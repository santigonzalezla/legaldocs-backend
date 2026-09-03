// Sonda: Ámbito Jurídico (Legis). Se espera que NO haya feed público (bloqueo anti-bot).
// Confirma el descarte de Fase 1.
//
//   node scripts/source-probes/probe-ambito-juridico.mjs

import { httpGet, section } from './_http.mjs';

const CANDIDATES = [
    'https://www.ambitojuridico.com/rss.xml',
    'https://www.ambitojuridico.com/feed',
    'https://www.ambitojuridico.com/rss',
    'https://www.ambitojuridico.com/noticias/feed',
    'https://www.ambitojuridico.com/index.php/rss.xml',
];

async function main()
{
    section('ÁMBITO JURÍDICO — sondeo de RSS (se espera bloqueo / 404)');

    let anyUsable = false;

    for (const url of CANDIDATES)
    {
        try
        {
            const r = await httpGet(url, { timeoutMs: 10000 });
            const looksXml = /xml|rss|atom/i.test(r.contentType || '') || r.body.trimStart().startsWith('<?xml');
            if (r.ok && looksXml) anyUsable = true;
            console.log(`${String(r.status).padEnd(5)} ${(looksXml ? 'XML' : 'no-xml').padEnd(7)} ${String(r.bytes).padEnd(8)}b  ${url}`);
        }
        catch (e)
        {
            console.log(`ERR   ${(e.name || e.code || 'error')}  ${url}`);
        }
    }

    section('CONCLUSIÓN');
    console.log(anyUsable
        ? 'Se encontró un feed XML servible — revisar términos de Legis antes de usar.'
        : 'Sin feed público servible → fuera de Fase 1. Requeriría acuerdo con Legis o scraping headless (frágil + posible violación de términos).');
}

main().catch(e => { console.error('FALLO:', e); process.exit(1); });
