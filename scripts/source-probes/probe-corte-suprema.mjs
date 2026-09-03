// Sonda: Corte Suprema de Justicia — RSS 2.0 (WordPress).  Candidata a 3ª fuente.
//   node scripts/source-probes/probe-corte-suprema.mjs

import { httpGet, preview, section } from './_http.mjs';
import { parseFeed, text } from './_feed.mjs';

const FEED_URL = process.env.FEED_URL || 'https://cortesuprema.gov.co/feed/';
const CURSOR   = process.env.CURSOR ? new Date(process.env.CURSOR) : null;

// La Corte Suprema mezcla comunicados/relatoría con eventos y convocatorias.
// El adapter real puede filtrar por título (Conversatorio/Feria/Convocatoria = evento).
const EVENT_HINTS = /conversatorio|feria|convocatoria|posesi[oó]n|homenaje|capacitaci[oó]n|seminario|congreso\b/i;

function normalize(item)
{
    const link = text(item.link);
    const guid = typeof item.guid === 'object' ? (item.guid['#text'] ?? item.guid.__cdata) : item.guid;
    const pub  = text(item.pubDate);
    const title = text(item.title);

    return {
        source:      'CORTE_SUPREMA',
        sourceLabel: 'Corte Suprema de Justicia',
        externalId:  guid || link,
        type:        'NEWS',
        title,
        summary:     preview(String(text(item.description) ?? '').replace(/<[^>]+>/g, ' '), 300),
        url:         link,
        category:    null,
        publishedAt: pub && !isNaN(Date.parse(pub)) ? new Date(pub).toISOString() : null,
        _looksLikeEvent: EVENT_HINTS.test(title || ''),
    };
}

async function main()
{
    section('CORTE SUPREMA DE JUSTICIA — RSS 2.0');
    console.log('GET', FEED_URL);

    const r = await httpGet(FEED_URL);
    console.log(`\n-> HTTP ${r.status} | ${r.contentType} | ${r.bytes} bytes | ${r.ms} ms`);
    if (!r.ok) { console.log(r.body.slice(0, 600)); process.exit(1); }

    const feed = parseFeed(r.body);
    console.log(`-> ${feed.kind} · canal "${feed.title}" · ${feed.items.length} ítems`);

    // parseFeed no expone description; reparseamos crudo para el normalizador completo
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    const { XMLParser } = require('fast-xml-parser');
    const doc = new XMLParser({ ignoreAttributes: false, cdataPropName: '__cdata', trimValues: true }).parse(r.body);
    const rawItems = [].concat(doc?.rss?.channel?.item ?? []);

    console.log('\n--- RAW primer ítem: claves ---');
    console.log(Object.keys(rawItems[0] ?? {}));

    const norm = rawItems.map(normalize);
    console.log('\n--- NORMALIZADO ---');
    for (const n of norm) console.log(JSON.stringify(n));

    const newest = norm.map(n => n.publishedAt).filter(Boolean).sort().at(-1) ?? null;
    console.log('\n--- lastCursor (max pubDate ISO) ---');
    console.log(newest);

    if (CURSOR)
    {
        const fresh = norm.filter(n => n.publishedAt && new Date(n.publishedAt) > CURSOR);
        console.log(`\n--- Con CURSOR=${CURSOR.toISOString()} → ${fresh.length} nuevos ---`);
    }

    section('CHEQUEOS');
    const issues = [];
    const n0 = norm[0] ?? {};
    if (!norm.length)     issues.push('feed sin ítems');
    if (!n0.externalId)   issues.push('sin guid ni link');
    if (!n0.publishedAt)  issues.push('pubDate no parseable');
    if (!n0.title)        issues.push('sin título');
    const events = norm.filter(n => n._looksLikeEvent).length;
    console.log(issues.length ? issues.map(i => ' - ' + i).join('\n') : ' OK — estructura consumible');
    console.log(` - ${events}/${norm.length} ítems parecen eventos/convocatorias (filtrables por título si se quiere)`);
}

main().catch(e => { console.error('FALLO:', e); process.exit(1); });
