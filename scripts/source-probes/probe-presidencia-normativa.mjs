// Sonda: "Normativa Nacional - Presidencia de la República" vía datos.gov.co (SODA).
// Dataset 88h2-dykw. Reemplaza a SUIN-Juriscol para "normas nuevas": SÍ trae
// fecha real, título, tipo y URL directa al PDF.
//
//   node scripts/source-probes/probe-presidencia-normativa.mjs
//   CURSOR=2026-08-01T00:00:00.000 node scripts/source-probes/probe-presidencia-normativa.mjs

import { httpGet, preview, section } from './_http.mjs';

const DATASET    = '88h2-dykw';
const DATE_FIELD = 'fecha';
const APP_TOKEN  = process.env.SOCRATA_APP_TOKEN || '';
const CURSOR     = process.env.CURSOR || null;
const LIMIT      = Number(process.env.LIMIT || 6);

const TYPE_MAP = {
    'LEYES': 'LAW', 'LEY': 'LAW',
    'DECRETOS': 'DECREE', 'DECRETO': 'DECREE',
    'RESOLUCIONES': 'RESOLUTION', 'RESOLUCION': 'RESOLUTION',
    'CIRCULARES': 'CIRCULAR', 'CIRCULAR': 'CIRCULAR',
    'DIRECTIVAS PRESIDENCIALES': 'OTHER', 'ACTOS LEGISLATIVOS': 'LAW',
};

function buildUrl()
{
    const params = new URLSearchParams();
    params.set('$select', `:id,${DATE_FIELD},tipo,titulo,descripcion,url`);
    if (CURSOR) params.set('$where', `${DATE_FIELD} > '${CURSOR}'`);
    params.set('$order', `${DATE_FIELD} DESC`);
    params.set('$limit', String(LIMIT));
    return `https://www.datos.gov.co/resource/${DATASET}.json?${params.toString()}`;
}

function normalize(row)
{
    const rawUrl = row.url ? String(row.url).trim() : null;
    return {
        source:      'PRESIDENCIA_NORMATIVA',
        sourceLabel: 'Normativa Nacional — Presidencia de la República (vía Datos Abiertos Colombia)',
        externalId:  row[':id'],
        type:        TYPE_MAP[String(row.tipo || '').toUpperCase().trim()] || 'OTHER',
        title:       String(row.titulo || '').replace(/\s+/g, ' ').trim(),
        summary:     preview(String(row.descripcion || '').replace(/^"|"$/g, '').trim(), 300) || null,
        // el PDF trae espacios en la ruta -> encodeURI para un enlace válido
        url:         rawUrl ? encodeURI(rawUrl) : `https://www.datos.gov.co/resource/${DATASET}.json`,
        category:    row.tipo ?? null,
        publishedAt: row[DATE_FIELD] ? new Date(row[DATE_FIELD] + 'Z').toISOString() : null,
    };
}

async function main()
{
    section('PRESIDENCIA — NORMATIVA NACIONAL — datos.gov.co SODA (88h2-dykw)');

    const url = buildUrl();
    console.log('GET', url);
    console.log('X-App-Token:', APP_TOKEN ? '(configurado)' : '(sin token)');
    console.log('CURSOR:', CURSOR ?? '(ninguno)');

    const r = await httpGet(url, APP_TOKEN ? { headers: { 'X-App-Token': APP_TOKEN } } : {});
    console.log(`\n-> HTTP ${r.status} | ${r.contentType} | ${r.bytes} bytes | ${r.ms} ms`);
    if (!r.ok) { console.log(r.body.slice(0, 600)); process.exit(1); }

    const rows = JSON.parse(r.body);
    console.log(`-> ${rows.length} filas`);

    console.log('\n--- RAW primera fila ---');
    console.log(JSON.stringify(rows[0], null, 2));

    console.log('\n--- NORMALIZADO ---');
    for (const row of rows) console.log(JSON.stringify(normalize(row)));

    console.log('\n--- lastCursor a persistir ---');
    console.log(rows[0]?.[DATE_FIELD] ?? null);

    section('CHEQUEOS');
    const issues = [];
    const n0 = rows[0] ?? {};
    if (!rows.length)      issues.push('respuesta vacía');
    if (!n0[':id'])        issues.push('falta :id (dedupe)');
    if (!n0[DATE_FIELD])   issues.push('falta fecha (cursor)');
    if (!n0.titulo)        issues.push('falta titulo');
    if (!n0.url)           issues.push('falta url');
    const badDates = rows.filter(x => x[DATE_FIELD] && isNaN(Date.parse(x[DATE_FIELD]))).length;
    if (badDates)          issues.push(`${badDates} fechas no parseables`);
    const unmapped = [...new Set(rows.map(x => String(x.tipo || '').toUpperCase().trim()).filter(t => !TYPE_MAP[t]))];
    if (unmapped.length)   issues.push(`tipos sin mapear: ${unmapped.join(', ')}`);
    console.log(issues.length ? issues.map(i => ' - ' + i).join('\n') : ' OK — reemplaza a SUIN-Juriscol para normas nuevas');
}

main().catch(e => { console.error('FALLO:', e); process.exit(1); });
