import {HttpGetOptions, HttpResponse} from '../../interfaces/LegalUpdates';

const USER_AGENT = 'LegalDocs/1.0 (+https://app.legaldocs.com.co; contacto@legaldocs.com.co)';

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const httpGet = async (url: string, options: HttpGetOptions = {}): Promise<HttpResponse> =>
{
    const {headers = {}, timeoutMs = 20000, retries = 2} = options;
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++)
    {
        if (attempt > 0) await sleep(500 * 2 ** (attempt - 1));

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try
        {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept':     'application/json, application/rss+xml, application/xml;q=0.9, */*;q=0.8',
                    ...headers,
                },
                signal:   controller.signal,
                redirect: 'follow',
            });

            if (res.status === 429 || res.status >= 500)
            {
                const retryAfter = Number(res.headers.get('retry-after'));
                if (Number.isFinite(retryAfter) && retryAfter > 0) await sleep(Math.min(retryAfter, 30) * 1000);
                lastError = new Error(`HTTP ${res.status} en ${url}`);
                continue;
            }

            const body = await res.text();
            return {status: res.status, contentType: res.headers.get('content-type'), body};
        }
        catch (error)
        {
            lastError = error;
        }
        finally
        {
            clearTimeout(timer);
        }
    }

    throw lastError instanceof Error ? lastError : new Error(`Fallo al consultar ${url}`);
};
