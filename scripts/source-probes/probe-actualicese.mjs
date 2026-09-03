// Sonda: Actualícese (RSS 2.0, WordPress).
// Valida: endpoint del feed, parseo con fast-xml-parser (ya instalado — evita
// agregar rss-parser), campos por ítem, guid como dedupe key, cursor por pubDate.
//
//   node scripts/source-probes/probe-actualicese.mjs
//   CURSOR=2026-09-01T00:00:00Z node scripts/source-probes/probe-actualicese.mjs

import { createRequire } from 'node:module';
import { httpGet, preview, section } from './_http.mjs';

const require = createRequire(import.meta.url);
const { XMLParser } = require('fast-xml-parser');

const FEED_URL = process.env.FEED_URL || 'https://actualicese.com/feed/';
const CURSOR   = process.env.CURSOR ? new Date(process.env.CURSOR) : null;

const parser = new XMLParser({
    ignoreAttributes:    false,
    attributeNamePrefix: '@_',
    cdataPropName:        '__cdata',
    trimValues:          true,
});

const asArray = x => (Array.isArray(x) ? x : x == null ? [] : [x]);

function text(v)
{
    if (v == null) return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'object') return v.__cdata ?? v['#text'] ?? null;
    return String(v);
}

function normalize(item)
{
    const link  = text(item.link);
    const guid  = typeof item.guid === 'object' ? (item.guid['#text'] ?? item.guid.__cdata) : item.guid;
    const pub   = text(item.pubDate);

    return {
        source:      'ACTUALICESE',
        sourceLabel: 'Actualícese',
        externalId:  guid || link,
        type:        'NEWS',
        title:       text(item.title),
        summary:     preview(text(item.description), 300),
        url:         link,
        category:    asArray(item.category).map(text).filter(Boolean)[0] ?? null,
        publishedAt: pub && !isNaN(Date.parse(pub)) ? new Date(pub).toISOString() : null,
    };
}

async function main()
{
    section('ACTUALÍCESE — RSS 2.0');
    console.log('GET', FEED_URL);

    const r = await httpGet(FEED_URL);
    console.log(`\n-> HTTP ${r.status} | ${r.contentType} | ${r.bytes} bytes | ${r.ms} ms`);
    if (!r.ok) { console.log(r.body.slice(0, 600)); process.exit(1); }

    const doc     = parser.parse(r.body);
    const channel = doc?.rss?.channel;
    const items   = asArray(channel?.item);

    console.log(`-> canal: "${text(channel?.title)}"`);
    console.log(`-> ${items.length} ítems en el feed (ventana deslizante — hay que pollear seguido)`);

    console.log('\n--- RAW primer ítem: claves disponibles ---');
    console.log(Object.keys(items[0] ?? {}));
    console.log('\n--- RAW primer ítem (recortado) ---');
    console.log(JSON.stringify(items[0], null, 2).slice(0, 1400));

    const norm = items.map(normalize);
    console.log('\n--- NORMALIZADO (primeros 5) ---');
    for (const n of norm.slice(0, 5)) console.log(JSON.stringify(n));

    const newest = norm.map(n => n.publishedAt).filter(Boolean).sort().at(-1) ?? null;
    console.log('\n--- lastCursor a persistir (max pubDate ISO) ---');
    console.log(newest);

    if (CURSOR)
    {
        const fresh = norm.filter(n => n.publishedAt && new Date(n.publishedAt) > CURSOR);
        console.log(`\n--- Con CURSOR=${CURSOR.toISOString()} → ${fresh.length} ítems nuevos ---`);
    }

    section('CHEQUEOS');
    const issues = [];
    const n0 = normalize(items[0] ?? {});
    if (!items.length)     issues.push('feed sin ítems');
    if (!n0.externalId)    issues.push('sin guid ni link → sin dedupe key');
    if (!n0.publishedAt)   issues.push('pubDate ausente o no parseable');
    if (!n0.title)         issues.push('sin título');
    if (!n0.url)           issues.push('sin link');
    const dupGuids = norm.length - new Set(norm.map(n => n.externalId)).size;
    if (dupGuids)          issues.push(`${dupGuids} guids repetidos dentro del feed`);
    console.log(issues.length ? issues.map(i => ' - ' + i).join('\n') : ' OK — estructura consumible; guardar solo title+summary+link (no content:encoded)');
}

main().catch(e => { console.error('FALLO:', e); process.exit(1); });
