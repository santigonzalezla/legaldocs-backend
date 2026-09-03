import {LegalUpdateSource, LegalUpdateType} from '../../generated/prisma/client';

export interface HttpResponse
{
    status:      number;
    contentType: string | null;
    body:        string;
}

export interface HttpGetOptions
{
    headers?:   Record<string, string>;
    timeoutMs?: number;
    retries?:   number;
}

export interface FeedItem
{
    title:      string | null;
    link:       string | null;
    guid:       string | null;
    pubDate:    string | null;
    categories: string[];
    summary:    string | null;
}

// Ítem ya normalizado por un adaptador, listo para persistir. branchId se
// resuelve luego en el polling.
export interface RawLegalUpdate
{
    externalId:  string;
    type:        LegalUpdateType;
    title:       string;
    summary:     string | null;
    url:         string;
    category:    string | null;
    publishedAt: Date;
}

export interface FetchSinceResult
{
    items:      RawLegalUpdate[];
    nextCursor: string | null;
}

export interface LegalUpdateSourceAdapter
{
    source:      LegalUpdateSource;
    sourceLabel: string;
    fetchSince(cursor: string | null): Promise<FetchSinceResult>;
}

export interface SodaSourceConfig
{
    source:      LegalUpdateSource;
    sourceLabel: string;
    datasetId:   string;
    dateField:   string;
    select:      string[];
    toRaw:       (row: Record<string, unknown>) => RawLegalUpdate | null;
}

export interface RssSourceConfig
{
    source:      LegalUpdateSource;
    sourceLabel: string;
    feedUrl:     string;
    toRaw:       (item: FeedItem) => RawLegalUpdate | null;
}

export interface LegalUpdateSourceInfo
{
    source:       LegalUpdateSource;
    label:        string;
    lastOkAt:     string | null;
    itemsLastRun: number;
}

export interface PollSourceSummary
{
    source:   LegalUpdateSource;
    inserted: number;
    error:    string | null;
}
