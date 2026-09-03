// Sonda: SUIN-Juriscol (normas) vía datos.gov.co (SODA API).
// Objetivo: DEMOSTRAR por qué no sirve para un feed incremental por fecha y medir
// la estrategia best-effort (filtro por a_o).
//
//   node scripts/source-probes/probe-suin-juriscol.mjs
//   YEAR=2026 SOCRATA_APP_TOKEN=xxxx node scripts/source-probes/probe-suin-juriscol.mjs

import { httpGet, section } from './_http.mjs';

const DATASET   = 'fiev-nid6';
const YEAR      = process.env.YEAR || String(new Date().getFullYear());
const APP_TOKEN = process.env.SOCRATA_APP_TOKEN || '';

async function q(desc, soql)
{
    const url = `https://www.datos.gov.co/resource/${DATASET}.json?${soql}`;
    console.log(`\n[${desc}]\nGET ${url}`);
    const r = await httpGet(url, APP_TOKEN ? { headers: { 'X-App-Token': APP_TOKEN } } : {});
    console.log(`-> HTTP ${r.status} | ${r.bytes} bytes | ${r.ms} ms`);
    if (!r.ok) { console.log(r.body.slice(0, 400)); return null; }
    return JSON.parse(r.body);
}

async function main()
{
    section('SUIN-JURISCOL (normas) — datos.gov.co SODA  [evaluación de viabilidad]');

    const sample = await q(
        'muestra + campos de sistema (:id, :created_at, :updated_at)',
        '$select=:id,:created_at,:updated_at,tipo,subtipo,n_mero,a_o,vigencia,materia&$order=:updated_at DESC&$limit=3',
    );
    console.log(JSON.stringify(sample, null, 2));

    const byYear = await q(
        `filtro a_o='${YEAR}' (estrategia best-effort del plan)`,
        `$select=:id,tipo,subtipo,n_mero,a_o,vigencia&$where=a_o='${YEAR}'&$limit=8`,
    );
    console.log(JSON.stringify(byYear, null, 2));

    const countAll  = await q('total de filas del dataset',  '$select=count(1)');
    const countYear = await q(`filas con a_o='${YEAR}'`,      `$select=count(1)&$where=a_o='${YEAR}'`);

    section('HALLAZGOS');

    const updatedValues = [...new Set((sample ?? []).map(r => r[':updated_at']))];
    console.log(` - :updated_at distintos en 3 filas no relacionadas: ${updatedValues.length}`);
    console.log(`   valores: ${updatedValues.join(', ')}`);
    console.log('   -> 1 solo valor = recarga masiva del dataset; "$where :updated_at > cursor" traería TODO en cada refresh, no deltas.');

    console.log(` - total dataset: ${JSON.stringify(countAll?.[0] ?? '?')}`);
    console.log(` - filas a_o=${YEAR}: ${JSON.stringify(countYear?.[0] ?? '?')}`);

    const missing = ['fecha de expedición/publicación', 'título', 'URL a la norma', 'resumen'];
    console.log(` - campos ausentes para un feed: ${missing.join(', ')}`);

    const sci = (byYear ?? []).find(r => /\d[eE][+]?\d/.test(String(r.n_mero)));
    if (sci) console.log(` - CALIDAD: n_mero corrompido (notación científica de Excel) → "${sci.n_mero}"`);
    const nullStr = (byYear ?? []).find(r => r.subtipo === 'NULL');
    if (nullStr) console.log(' - CALIDAD: subtipo trae el string literal "NULL" en vez de null.');

    console.log('\nConclusión: NO apto para Fase 1. Best-effort posible = poll por a_o + dedupe (tipo,n_mero,a_o) + publishedAt sintético.');
}

main().catch(e => { console.error('FALLO:', e); process.exit(1); });
