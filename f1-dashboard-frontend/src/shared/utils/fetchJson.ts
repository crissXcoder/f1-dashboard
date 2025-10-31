export class HttpError extends Error {
    public readonly status: number;
    public readonly body?: unknown;

    constructor(message: string, status: number, body?: unknown) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.body = body;
    }
}

/**
 * fetchJson: pequeño wrapper tipado para JSON.
 * - Lanza HttpError ante !response.ok
 * - Devuelve T (genérico) si todo sale bien.
 */
export async function fetchJson<T>(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<T> {
    const res = await fetch(input, init);
    const text = await res.text();
    const maybeJson = safeParse(text);

    if (!res.ok) {
        const msg =
            (isMessageLike(maybeJson)
                ? String(maybeJson.message)
                : undefined) || res.statusText || 'Request failed';
        throw new HttpError(msg, res.status, maybeJson ?? text);
    }

    // algunos endpoints devuelven vacío (204/no content)
    if (!text) return undefined as unknown as T;
    return maybeJson as T;
}

function isMessageLike(obj: unknown): obj is { message: unknown } {
    return typeof obj === 'object' && obj !== null && 'message' in obj;
}

function safeParse(s: string): unknown | undefined {
    if (!s) return undefined;
    try {
        return JSON.parse(s);
    } catch {
        return undefined;
    }
}
