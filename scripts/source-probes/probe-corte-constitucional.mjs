// Sonda: Corte Constitucional vía datos.gov.co (SODA API).
// Valida: endpoint, SoQL incremental por fecha_sentencia, campo :id para dedupe,
// y cómo se vería una fila normalizada a LegalUpdate.
//
//   node scripts/source-probes/probe-corte-constitucional.mjs
//   SOCRATA_APP_TOKEN=xxxx CURSOR=2026-07-20T00:00:00.000 node scripts/source-probes/probe-corte-constitucional.mjs

import { httpGet, section } from './_http.mjs';

const DATASET    = 'v2k4-2t8s';
const DATE_FIELD = 'fecha_sentencia';
const APP_TOKEN  = process.env.SOCRATA_APP_TOKEN || '';
const CURSOR     = process.env.CURSOR || null; // ISO; null = primera corrida (trae lo más reciente)
const LIMIT      = Number(process.env.LIMIT || 5);

function buildUrl()
{
    const params = new URLSearchParams();
    params.set('$select', `:id,${DATE_FIELD},sentencia,sentencia_tipo,proceso,expediente_tipo,expediente_numero,magistrado_a,sala`);
    if (CURSOR) params.set('$where', `${DATE_FIELD} > '${CURSOR}'`);
    params.set('$order', `${DATE_FIELD} DESC`);
    params.set('$limit', String(LIMIT));
    return `https://www.datos.gov.co/resource/${DATASET}.json?${params.toString()}`;
}

// Map heurístico y determinístico (sin IA).
function mapType(sentenciaTipo)
{
    // C = constitucionalidad, T = tutela, SU = unificación, A = auto
    return ['C', 'T', 'SU', 'A'].includes(sentenciaTipo) ? 'RULING' : 'RULING';
}

function normalize(row)
{
    return {
        source:      'CORTE_CONSTITUCIONAL',
        sourceLabel: 'Corte Constitucional (vía Datos Abiertos Colombia)',
        externalId:  row[':id'],
        type:        mapType(row.sentencia_tipo),
        title:       `Sentencia ${row.sentencia ?? '(s/n)'}`,
        summary:     [row.proceso, row.magistrado_a, row.sala].filter(Boolean).join(' · ') || null,
        url:         `https://www.datos.gov.co/resource/${DATASET}.json?sentencia=${encodeURIComponent(row.sentencia ?? '')}`,
        category:    row.proceso ?? null,
        publishedAt: row[DATE_FIELD] ? new Date(row[DATE_FIELD]).toISOString() : null,
    };
}

async function main()
{
    section('CORTE CONSTITUCIONAL — datos.gov.co SODA API');

    const url = buildUrl();
    console.log('GET', url);
    console.log('X-App-Token:', APP_TOKEN ? '(configurado)' : '(sin token → pool compartido por IP, ~1000/h)');
    console.log('CURSOR:', CURSOR ?? '(ninguno — primera corrida)');

    const r = await httpGet(url, APP_TOKEN ? { headers: { 'X-App-Token': APP_TOKEN } } : {});
    console.log(`\n-> HTTP ${r.status} | ${r.contentType} | ${r.bytes} bytes | ${r.ms} ms`);
    if (!r.ok) { console.log('BODY:', r.body.slice(0, 600)); process.exit(1); }

    const rows = JSON.parse(r.body);
    console.log(`-> ${rows.length} filas`);

    console.log('\n--- RAW primera fila (todas las claves que devuelve la API) ---');
    console.log(JSON.stringify(rows[0], null, 2));

    console.log('\n--- NORMALIZADO (lo que insertaría el adapter en LegalUpdate) ---');
    for (const row of rows) console.log(JSON.stringify(normalize(row)));

    const newest = rows[0]?.[DATE_FIELD] ?? null;
    console.log('\n--- lastCursor a persistir en LegalUpdateSourceRun ---');
    console.log(newest);

    section('CHEQUEOS');
    const issues = [];
    if (!rows.length)               issues.push('respuesta vacía');
    if (rows[0] && !rows[0][':id']) issues.push('falta :id (dedupe key)');
    if (rows[0] && !rows[0][DATE_FIELD]) issues.push(`falta ${DATE_FIELD} (cursor)`);
    if (rows[0] && !rows[0].sentencia)  issues.push('falta "sentencia" (título / deep-link)');
    const parseOk = rows.every(row => !row[DATE_FIELD] || !isNaN(Date.parse(row[DATE_FIELD])));
    if (!parseOk) issues.push(`${DATE_FIELD} no siempre parseable como fecha`);
    console.log(issues.length ? issues.map(i => ' - ' + i).join('\n') : ' OK — estructura consumible con la estrategia del plan');
}

main().catch(e => { console.error('FALLO:', e); process.exit(1); });
