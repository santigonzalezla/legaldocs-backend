// Helper HTTP compartido por las sondas de fuentes externas.
// Replica lo que hará el `http.util.ts` del módulo real: timeout, User-Agent de
// contacto, y una respuesta uniforme para inspeccionar.

export async function httpGet(url, { headers = {}, timeoutMs = 15000 } = {})
{
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    const started = Date.now();

    try
    {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'LegalDocs/1.0 (+https://app.legaldocs.com.co; probe)',
                'Accept': 'application/json, application/rss+xml, application/xml;q=0.9, */*;q=0.8',
                ...headers,
            },
            signal: ac.signal,
            redirect: 'follow',
        });

        const body = await res.text();

        return {
            ok: res.ok,
            status: res.status,
            contentType: res.headers.get('content-type'),
            bytes: Buffer.byteLength(body),
            ms: Date.now() - started,
            body,
        };
    }
    finally
    {
        clearTimeout(timer);
    }
}

export function preview(str, n = 160)
{
    if (str == null) return null;
    const s = String(str).replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n) + '…' : s;
}

export function section(title)
{
    console.log('\n' + '='.repeat(72) + '\n' + title + '\n' + '='.repeat(72));
}
