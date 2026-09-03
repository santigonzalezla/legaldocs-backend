import {XMLParser} from 'fast-xml-parser';
import {FeedItem} from '../../interfaces/LegalUpdates';

const parser = new XMLParser({
    ignoreAttributes:    false,
    attributeNamePrefix: '@_',
    cdataPropName:        '__cdata',
    trimValues:          true,
});

const NAMED_ENTITIES: Record<string, string> = {
    '&#8211;': '–', '&#8212;': '—',
    '&#8216;': '‘', '&#8217;': '’',
    '&#8220;': '“', '&#8221;': '”',
    '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
};

const asArray = <T>(value: T | T[] | undefined | null): T[] =>
    Array.isArray(value) ? value : value == null ? [] : [value];

const nodeText = (value: unknown): string | null =>
{
    if (value == null) return null;
    if (typeof value === 'string') return value;

    if (typeof value === 'object')
    {
        const obj = value as Record<string, unknown>;
        return (obj.__cdata as string) ?? (obj['#text'] as string) ?? null;
    }

    return String(value);
};

export const decodeEntities = (input: string | null): string | null =>
{
    if (!input) return null;

    const decoded = input
        .replace(/&#8211;|&#8212;|&#8216;|&#8217;|&#8220;|&#8221;|&nbsp;|&amp;|&lt;|&gt;|&quot;/g, match => NAMED_ENTITIES[match] ?? match)
        .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
        .replace(/\s+/g, ' ')
        .trim();

    return decoded || null;
};

export const stripHtml = (input: string | null): string | null =>
{
    if (!input) return null;
    return decodeEntities(input.replace(/<[^>]+>/g, ' '));
};

const parseRssItems = (channel: Record<string, unknown>): FeedItem[] =>
    asArray<Record<string, unknown>>(channel.item as never).map(item =>
    {
        const guidNode = item.guid as Record<string, unknown> | string | undefined;
        const guid = typeof guidNode === 'object' && guidNode !== null
            ? nodeText(guidNode)
            : (guidNode as string | undefined) ?? null;

        return {
            title:      decodeEntities(nodeText(item.title)),
            link:       nodeText(item.link),
            guid:       guid ?? nodeText(item.link),
            pubDate:    nodeText(item.pubDate) ?? nodeText(item['dc:date']),
            categories: asArray(item.category).map(nodeText).filter((c): c is string => !!c),
            summary:    stripHtml(nodeText(item.description)),
        };
    });

const parseAtomEntries = (feed: Record<string, unknown>): FeedItem[] =>
    asArray<Record<string, unknown>>(feed.entry as never).map(entry =>
    {
        const links = asArray(entry.link) as Array<Record<string, string>>;
        const alt = links.find(l => l['@_rel'] === 'alternate') ?? links[0];

        return {
            title:      decodeEntities(nodeText(entry.title)),
            link:       alt?.['@_href'] ?? nodeText(entry.id),
            guid:       nodeText(entry.id) ?? alt?.['@_href'] ?? null,
            pubDate:    nodeText(entry.updated) ?? nodeText(entry.published),
            categories: asArray(entry.category).map(c => (c as Record<string, string>)['@_term']).filter((c): c is string => !!c),
            summary:    stripHtml(nodeText(entry.summary) ?? nodeText(entry.content)),
        };
    });

export const parseFeed = (body: string): FeedItem[] =>
{
    let doc: Record<string, unknown>;

    try
    {
        doc = parser.parse(body) as Record<string, unknown>;
    }
    catch (error)
    {
        throw new Error(`XML inválido: ${error instanceof Error ? error.message : 'error de parseo'}`);
    }

    const rss = doc.rss as Record<string, unknown> | undefined;
    if (rss?.channel) return parseRssItems(rss.channel as Record<string, unknown>);

    const feed = doc.feed as Record<string, unknown> | undefined;
    if (feed) return parseAtomEntries(feed);

    throw new Error('La respuesta no es un feed RSS/Atom válido');
};
