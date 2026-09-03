// Parser de feeds mínimo (RSS 2.0 + Atom) sobre fast-xml-parser (ya instalado).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({
    ignoreAttributes:    false,
    attributeNamePrefix: '@_',
    cdataPropName:        '__cdata',
    trimValues:          true,
});

const asArray = x => (Array.isArray(x) ? x : x == null ? [] : [x]);

export function text(v)
{
    if (v == null) return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'object') return v.__cdata ?? v['#text'] ?? null;
    return String(v);
}

// Devuelve { kind, title, items:[{title,link,date,id}] } o { kind:null } si no es feed.
export function parseFeed(xml)
{
    let doc;
    try { doc = parser.parse(xml); }
    catch { return { kind: null, items: [] }; }

    // RSS 2.0
    const channel = doc?.rss?.channel;
    if (channel)
    {
        const items = asArray(channel.item).map(it => ({
            title: text(it.title),
            link:  text(it.link),
            date:  text(it.pubDate) ?? text(it['dc:date']),
            id:    (typeof it.guid === 'object' ? (it.guid['#text'] ?? it.guid.__cdata) : it.guid) ?? text(it.link),
        }));
        return { kind: 'rss', title: text(channel.title), items };
    }

    // Atom
    const feed = doc?.feed;
    if (feed)
    {
        const items = asArray(feed.entry).map(e => {
            const links = asArray(e.link);
            const alt = links.find(l => l['@_rel'] === 'alternate') ?? links[0];
            return {
                title: text(e.title),
                link:  alt?.['@_href'] ?? text(e.id),
                date:  text(e.updated) ?? text(e.published),
                id:    text(e.id) ?? alt?.['@_href'],
            };
        });
        return { kind: 'atom', title: text(feed.title), items };
    }

    // RDF / RSS 1.0
    const rdf = doc?.['rdf:RDF'] ?? doc?.RDF;
    if (rdf)
    {
        const items = asArray(rdf.item).map(it => ({
            title: text(it.title),
            link:  text(it.link),
            date:  text(it['dc:date']),
            id:    text(it.link),
        }));
        return { kind: 'rdf', title: text(rdf.channel?.title), items };
    }

    return { kind: null, items: [] };
}
