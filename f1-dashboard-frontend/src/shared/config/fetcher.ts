import { env } from '@/shared/config/env';
import type { ApiResponse } from '@/shared/types/dto';

export class FetchError extends Error {
    readonly status: number;
    readonly body?: unknown;

    constructor(message: string, status: number, body?: unknown) {
        super(message);
        this.status = status;
        this.body = body;
    }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions<B> {
    readonly method?: HttpMethod;
    readonly path: string;        // relativo a API_URL (e.g., "/api/pilots")
    readonly query?: Record<string, string | number | boolean | undefined>;
    readonly body?: B;
    readonly headers?: Record<string, string>;
}

/** Serializa query params de forma segura. */
function toQueryString(q?: RequestOptions<unknown>['query']): string {
    if (!q) return '';
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) {
        if (v === undefined) continue;
        usp.set(k, String(v));
    }
    const s = usp.toString();
    return s ? `?${s}` : '';
}

/** Llama al backend y parsea JSON → ApiResponse<T> (sin unwrap). */
export async function requestApi<T, B = unknown>(opts: RequestOptions<B>): Promise<ApiResponse<T>> {
    const method = opts.method ?? 'GET';
    const base = env.API_URL;
    const url = `${base}${opts.path}${toQueryString(opts.query)}`;

    const headers: Record<string, string> = {
        ...(opts.headers ?? {}),
    };
    const init: RequestInit = { method, headers, credentials: 'omit' };

    if (opts.body !== undefined) {
        headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
        init.body = headers['Content-Type'].includes('application/json')
            ? JSON.stringify(opts.body)
            : (opts.body as unknown as BodyInit);
    }

    const res = await fetch(url, init);

    // Intentar parsear JSON; si no se puede, arrojar con texto
    const text = await res.text();
    let json: unknown;
    try {
        json = text.length ? JSON.parse(text) : null;
    } catch {
        throw new FetchError(`Invalid JSON from server (${res.status})`, res.status, text);
    }

    // Normalizar respuesta ApiResponse
    const api = json as ApiResponse<T>;
    if (!res.ok) {
        // si HTTP no es 2xx, levantar error con cuerpo
        throw new FetchError(`HTTP ${res.status}`, res.status, api);
    }
    return api;
}

/** Igual que requestApi pero devuelve T (desempaqueta data y lanza si ok=false). */
export async function requestData<T, B = unknown>(opts: RequestOptions<B>): Promise<T> {
    const api = await requestApi<T, B>(opts);
    if (api.ok) return api.data;
    // api.ok === false
    const code = api.error?.code ?? 'API_ERROR';
    const msg = api.error?.message ?? 'Unknown API error';
    throw new FetchError(`${code}: ${msg}`, 200, api);
}

/** Helpers orientados a REST */
export function getApi<T>(path: string, query?: RequestOptions<never>['query']) {
    return requestApi<T>({ method: 'GET', path, query });
}
export function getData<T>(path: string, query?: RequestOptions<never>['query']) {
    return requestData<T>({ method: 'GET', path, query });
}
export function postApi<T, B>(path: string, body: B, query?: RequestOptions<never>['query']) {
    return requestApi<T, B>({ method: 'POST', path, query, body });
}
export function postData<T, B>(path: string, body: B, query?: RequestOptions<never>['query']) {
    return requestData<T, B>({ method: 'POST', path, query, body });
}
