import {environmentVariables} from '../../../config';
import {httpGet} from '../../../utils/legal-updates/legal-updates-http.util';
import {
    FetchSinceResult,
    LegalUpdateSourceAdapter,
    RawLegalUpdate,
    SodaSourceConfig,
} from '../../../interfaces/LegalUpdates';
import {LegalUpdateSource, LegalUpdateType} from '../../../../generated/prisma/client';

const SODA_LIMIT = 1000;

const PRESIDENCIA_TYPE: Record<string, LegalUpdateType> = {
    LEYES:        LegalUpdateType.LAW,
    LEY:          LegalUpdateType.LAW,
    DECRETOS:     LegalUpdateType.DECREE,
    DECRETO:      LegalUpdateType.DECREE,
    RESOLUCIONES: LegalUpdateType.RESOLUTION,
    RESOLUCION:   LegalUpdateType.RESOLUTION,
    CIRCULARES:   LegalUpdateType.CIRCULAR,
    CIRCULAR:     LegalUpdateType.CIRCULAR,
};

const ADMIN_NOISE = /\b(nombramiento|encargo|renuncia|designaci[oó]n|comisi[oó]n de servicios|licencia no remunerada)\b/i;

// Los timestamps SODA llegan sin zona (`2026-07-31T00:00:00.000`); se leen como UTC.
const parseSodaDate = (value: unknown): Date | null =>
{
    if (typeof value !== 'string' || !value) return null;

    const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
    const date = new Date(iso);

    return Number.isNaN(date.getTime()) ? null : date;
};

// El PDF de Presidencia llega a veces crudo (con espacios) y a veces ya percent-encoded.
const normalizePdfUrl = (raw: unknown): string | null =>
{
    if (typeof raw !== 'string' || !raw.trim()) return null;

    const value = raw.trim();
    try
    {
        return encodeURI(decodeURI(value));
    }
    catch
    {
        return value;
    }
};

const buildRelatoriaUrl = (sentencia: string, publishedAt: Date): string =>
{
    const slug = sentencia.replace(/\s+/g, '').replace(/\//g, '-');
    const year = publishedAt.getUTCFullYear();

    return slug && year
        ? `https://www.corteconstitucional.gov.co/relatoria/${year}/${slug}.htm`
        : 'https://www.corteconstitucional.gov.co/relatoria/';
};

const buildSodaUrl = (config: SodaSourceConfig, cursor: string | null): string =>
{
    const params = new URLSearchParams();

    params.set('$select', [':id', ...config.select].join(','));
    if (cursor) params.set('$where', `${config.dateField} > '${cursor}'`);
    params.set('$order', `${config.dateField} DESC`);
    params.set('$limit', String(SODA_LIMIT));

    return `https://www.datos.gov.co/resource/${config.datasetId}.json?${params.toString()}`;
};

export const createSodaSource = (config: SodaSourceConfig): LegalUpdateSourceAdapter =>
{
    const headers = environmentVariables.socrataAppToken
        ? {'X-App-Token': environmentVariables.socrataAppToken}
        : undefined;

    const fetchSince = async (cursor: string | null): Promise<FetchSinceResult> =>
    {
        const res = await httpGet(buildSodaUrl(config, cursor), {headers});

        if (res.status !== 200) throw new Error(`SODA ${config.datasetId} → HTTP ${res.status}`);

        let rows: Array<Record<string, unknown>>;
        try
        {
            rows = JSON.parse(res.body);
        }
        catch
        {
            throw new Error(`SODA ${config.datasetId} → respuesta no JSON`);
        }

        const items = rows
            .map(row => config.toRaw(row))
            .filter((item): item is RawLegalUpdate => item !== null);

        // rows llegan en $order DESC: rows[0] tiene el dateField máximo aunque toRaw lo descarte.
        const newest = rows.length > 0 ? String(rows[0][config.dateField] ?? '') : '';

        return {items, nextCursor: newest || cursor};
    };

    return {source: config.source, sourceLabel: config.sourceLabel, fetchSince};
};

export const corteConstitucionalSource = createSodaSource({
    source:      LegalUpdateSource.CORTE_CONSTITUCIONAL,
    sourceLabel: 'Corte Constitucional (vía Datos Abiertos Colombia)',
    datasetId:   'v2k4-2t8s',
    dateField:   'fecha_sentencia',
    select:      ['fecha_sentencia', 'sentencia', 'sentencia_tipo', 'proceso', 'magistrado_a', 'sala'],
    toRaw: (row) =>
    {
        const publishedAt = parseSodaDate(row.fecha_sentencia);
        const externalId  = String(row[':id'] ?? '');
        const sentencia   = row.sentencia ? String(row.sentencia).trim() : '';

        if (!publishedAt || !externalId || !sentencia) return null;

        return {
            externalId,
            type:        LegalUpdateType.RULING,
            title:       `Sentencia ${sentencia}`,
            summary:     [row.proceso, row.magistrado_a, row.sala].filter(Boolean).join(' · ') || null,
            url:         buildRelatoriaUrl(sentencia, publishedAt),
            category:    row.proceso ? String(row.proceso) : null,
            publishedAt,
        };
    },
});

export const presidenciaNormativaSource = createSodaSource({
    source:      LegalUpdateSource.PRESIDENCIA_NORMATIVA,
    sourceLabel: 'Normativa Nacional — Presidencia de la República (vía Datos Abiertos Colombia)',
    datasetId:   '88h2-dykw',
    dateField:   'fecha',
    select:      ['fecha', 'tipo', 'titulo', 'descripcion', 'url'],
    toRaw: (row) =>
    {
        const publishedAt = parseSodaDate(row.fecha);
        const externalId  = String(row[':id'] ?? '');
        const title       = row.titulo ? String(row.titulo).replace(/\s+/g, ' ').trim() : '';

        if (!publishedAt || !externalId || !title) return null;

        const summary = row.descripcion
            ? String(row.descripcion).replace(/^["']+|["']+$/g, '').replace(/\s+/g, ' ').trim() || null
            : null;

        if (ADMIN_NOISE.test(`${title} ${summary ?? ''}`)) return null;

        return {
            externalId,
            type:        PRESIDENCIA_TYPE[String(row.tipo ?? '').toUpperCase().trim()] ?? LegalUpdateType.OTHER,
            title,
            summary,
            url:         normalizePdfUrl(row.url) ?? 'https://www.datos.gov.co/resource/88h2-dykw.json',
            category:    row.tipo ? String(row.tipo) : null,
            publishedAt,
        };
    },
});
