import {httpGet} from '../../../utils/legal-updates/legal-updates-http.util';
import {parseFeed} from '../../../utils/legal-updates/legal-updates-feed.util';
import {
    FetchSinceResult,
    LegalUpdateSourceAdapter,
    RawLegalUpdate,
    RssSourceConfig,
} from '../../../interfaces/LegalUpdates';
import {LegalUpdateSource, LegalUpdateType} from '../../../../generated/prisma/client';

const SUMMARY_MAX = 300;

const CS_EVENT = /conversatorio|\bferia\b|convocatoria|seminario|\bcongreso\b|posesi[oó]n|homenaje/i;
const CS_PHOTO_LEAD = /foto:\s*corte suprema de justicia\.?\s*/i;

const ACT_BOILERPLATE = /\bthe post\b.*?\bappeared first on\b.*$/is;
const ACT_DROP_CATEGORY = /conferencias?|podcast/i;
const ACT_BRANCH_HINT = /derecho|laboral|tributari|civil|comercial|penal|societari/i;

const toDate = (value: string | null): Date | null =>
{
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

// La descripción de la Corte Suprema repite el título y antepone "Foto: …" al cuerpo.
const stripPhotoLead = (summary: string): string =>
{
    const parts = summary.split(CS_PHOTO_LEAD);
    return (parts.length > 1 ? parts[parts.length - 1] : summary).trim();
};

export const createRssSource = (config: RssSourceConfig): LegalUpdateSourceAdapter =>
{
    const fetchSince = async (cursor: string | null): Promise<FetchSinceResult> =>
    {
        const res = await httpGet(config.feedUrl);

        if (res.status !== 200) throw new Error(`${config.sourceLabel} → HTTP ${res.status}`);

        const feedItems  = parseFeed(res.body);
        const cursorDate = toDate(cursor);

        const items: RawLegalUpdate[] = [];
        let newest = cursorDate ? cursorDate.getTime() : 0;

        for (const feedItem of feedItems)
        {
            const itemDate = toDate(feedItem.pubDate);
            if (itemDate) newest = Math.max(newest, itemDate.getTime());

            const raw = config.toRaw(feedItem);
            if (!raw) continue;
            if (cursorDate && raw.publishedAt <= cursorDate) continue;

            items.push(raw);
        }

        const nextCursor = newest > 0 ? new Date(newest).toISOString() : cursor;

        return {items, nextCursor};
    };

    return {source: config.source, sourceLabel: config.sourceLabel, fetchSince};
};

export const corteSupremaSource = createRssSource({
    source:      LegalUpdateSource.CORTE_SUPREMA,
    sourceLabel: 'Corte Suprema de Justicia',
    feedUrl:     'https://cortesuprema.gov.co/feed/',
    toRaw: (item) =>
    {
        const publishedAt = toDate(item.pubDate);
        const externalId  = item.guid ?? item.link;

        if (!publishedAt || !externalId || !item.title || !item.link) return null;
        if (CS_EVENT.test(item.title)) return null;

        const summary = stripPhotoLead(item.summary ?? '');

        return {
            externalId,
            type:        LegalUpdateType.NEWS,
            title:       item.title,
            summary:     summary ? summary.slice(0, SUMMARY_MAX) : null,
            url:         item.link,
            category:    item.categories[0] ?? null,
            publishedAt,
        };
    },
});

export const actualiceseSource = createRssSource({
    source:      LegalUpdateSource.ACTUALICESE,
    sourceLabel: 'Actualícese',
    feedUrl:     'https://actualicese.com/feed/',
    toRaw: (item) =>
    {
        const publishedAt = toDate(item.pubDate);
        const externalId  = item.guid ?? item.link;

        if (!publishedAt || !externalId || !item.title || !item.link) return null;
        if (item.categories.some(category => ACT_DROP_CATEGORY.test(category))) return null;

        const summary  = (item.summary ?? '').replace(ACT_BOILERPLATE, '').trim();
        const category = item.categories.find(c => ACT_BRANCH_HINT.test(c)) ?? item.categories[0] ?? null;

        return {
            externalId,
            type:        LegalUpdateType.NEWS,
            title:       item.title,
            summary:     summary ? summary.slice(0, SUMMARY_MAX) : null,
            url:         item.link,
            category,
            publishedAt,
        };
    },
});
