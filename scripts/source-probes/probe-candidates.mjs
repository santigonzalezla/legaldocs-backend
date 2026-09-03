// Sonda: candidatas para la 3ª fuente de Fase 1.
// Prueba (a) rutas RSS/Atom de entidades oficiales y (b) el catálogo SODA de
// datos.gov.co buscando datasets judiciales con campo de fecha.
//
//   node scripts/source-probes/probe-candidates.mjs

import { httpGet, preview, section } from './_http.mjs';
import { parseFeed } from './_feed.mjs';

// ── (a) Rutas RSS/Atom candidatas ────────────────────────────────────────────
const RSS_CANDIDATES = [
    ['Rama Judicial',            'https://www.ramajudicial.gov.co/rss'],
    ['Rama Judicial',            'https://www.ramajudicial.gov.co/-/rss'],
    ['Rama Judicial',            'https://www.ramajudicial.gov.co/web/guest/inicio?p_p_id=rss'],
    ['MinJusticia',              'https://www.minjusticia.gov.co/rss.xml'],
    ['MinJusticia',              'https://www.minjusticia.gov.co/feed'],
    ['MinJusticia',              'https://www.minjusticia.gov.co/Sala-de-prensa/RSS'],
    ['Corte Suprema',            'https://cortesuprema.gov.co/feed/'],
    ['Corte Suprema',            'https://cortesuprema.gov.co/?feed=rss2'],
    ['Corte Suprema',            'https://cortesuprema.gov.co/corte/index.php/feed/'],
    ['Consejo de Estado',        'https://www.consejodeestado.gov.co/feed/'],
    ['Consejo de Estado',        'https://www.consejodeestado.gov.co/?feed=rss2'],
    ['Corte Constitucional',     'https://www.corteconstitucional.gov.co/rss/'],
    ['Corte Constitucional',     'https://www.corteconstitucional.gov.co/noticias/rss.php'],
    ['Función Pública',          'https://www.funcionpublica.gov.co/rss'],
    ['Función Pública',          'https://www.funcionpublica.gov.co/web/eva/rss'],
    ['DIAN',                     'https://www.dian.gov.co/Paginas/rss.aspx'],
    ['DIAN',                     'https://www.dian.gov.co/rss'],
    ['Presidencia',              'https://idm.presidencia.gov.co/feed'],
    ['Presidencia',              'https://petro.presidencia.gov.co/feed'],
    ['Supersociedades',          'https://www.supersociedades.gov.co/rss'],
    ['Senado (Joomla)',          'https://www.senado.gov.co/index.php/prensa/lista-de-noticias?format=feed&type=rss'],
    ['Ámbito Jurídico',          'https://www.ambitojuridico.com/rss.xml'],
    ['Asuntos Legales (LR)',     'https://www.asuntoslegales.com.co/rss'],
    ['Asuntos Legales (LR)',     'https://www.larepublica.co/rss/asuntos-legales'],
];

// ── (b) Consultas al catálogo SODA ──────────────────────────────────────────
const SODA_CATALOG_QUERIES = [
    'sentencias corte suprema',
    'consejo de estado providencias',
    'jurisprudencia',
    'diario oficial',
    'leyes sancionadas',
    'normas expedidas',
];

function classifyFeed(r)
{
    if (!r.ok) return { usable: false, note: `HTTP ${r.status}` };
    const feed = parseFeed(r.body);
    if (!feed.kind) return { usable: false, note: `no-feed (${(r.contentType || '?').split(';')[0]})` };
    const withDate = feed.items.filter(i => i.date && !isNaN(Date.parse(i.date)));
    const newest = withDate.map(i => Date.parse(i.date)).sort().at(-1);
    return {
        usable: feed.items.length > 0,
        note: `${feed.kind} · ${feed.items.length} ítems · última ${newest ? new Date(newest).toISOString().slice(0, 10) : 's/fecha'}`,
        feed,
    };
}

async function probeRss()
{
    section('(a) RUTAS RSS / ATOM DE ENTIDADES OFICIALES');
    const hits = [];

    for (const [entity, url] of RSS_CANDIDATES)
    {
        let line;
        try
        {
            const r = await httpGet(url, { timeoutMs: 12000 });
            const c = classifyFeed(r);
            line = `${c.usable ? '✅' : '  '} ${entity.padEnd(22)} ${String(r.status).padEnd(4)} ${c.note.padEnd(40)} ${url}`;
            if (c.usable) hits.push({ entity, url, feed: c.feed });
        }
        catch (e)
        {
            line = `   ${entity.padEnd(22)} ERR  ${(e.name || e.code || 'error').padEnd(40)} ${url}`;
        }
        console.log(line);
    }

    if (hits.length)
    {
        section('DETALLE DE LOS FEEDS SERVIBLES');
        for (const h of hits)
        {
            console.log(`\n### ${h.entity} — ${h.url}`);
            console.log(`canal: "${h.feed.title}"`);
            for (const it of h.feed.items.slice(0, 3))
                console.log(` - [${(it.date || 's/fecha').slice(0, 25)}] ${preview(it.title, 90)}\n   ${it.link}`);
        }
    }
    else
    {
        console.log('\nNinguna ruta RSS candidata respondió con un feed servible.');
    }
}

async function probeSodaCatalog()
{
    section('(b) CATÁLOGO SODA — datos.gov.co (busca datasets con fecha)');

    for (const q of SODA_CATALOG_QUERIES)
    {
        const url = `https://www.datos.gov.co/api/catalog/v1?q=${encodeURIComponent(q)}&only=dataset&limit=6`;
        console.log(`\n[q="${q}"]`);
        try
        {
            const r = await httpGet(url, { timeoutMs: 15000 });
            if (!r.ok) { console.log(`  HTTP ${r.status}`); continue; }
            const json = JSON.parse(r.body);
            const results = json.results ?? [];
            if (!results.length) { console.log('  (sin resultados)'); continue; }
            for (const res of results)
            {
                const rc = res.resource ?? {};
                const cols = (rc.columns_field_name ?? []).join(', ');
                const hasDate = /fecha|date|anio|año|ano|vigencia/i.test(cols);
                console.log(`  ${hasDate ? '📅' : '  '} ${rc.id}  ${preview(rc.name, 60)}`);
                console.log(`     updated: ${rc.updatedAt ?? '?'} | cols: ${preview(cols, 120)}`);
            }
        }
        catch (e)
        {
            console.log(`  ERR ${e.name || e.code || e}`);
        }
    }
}

async function main()
{
    await probeRss();
    await probeSodaCatalog();

    section('SIGUIENTE PASO');
    console.log('Elegir 1 feed ✅ (o 1 dataset 📅 con fecha real) como 3ª fuente y escribir su adapter,');
    console.log('replicando el patrón de probe-actualicese / probe-corte-constitucional.');
}

main().catch(e => { console.error('FALLO:', e); process.exit(1); });
