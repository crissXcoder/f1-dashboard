import type { IncomingMessage, ServerResponse } from 'http';
import { sendJSON, sendText, type ApiResponse, type HttpStatus } from '@/utils/response.js';
import { parseUrl } from '@/utils/parseUrl.js';

export type HttpMethod =
    | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface AugmentedRequest extends IncomingMessage {
    /** Método HTTP en mayúsculas y restringido */
    method: HttpMethod;
    /** Ruta parseada (sin querystring) */
    path: string;
    /** Parámetros de consulta */
    query: URLSearchParams;
    /** Cuerpo ya parseado (JSON u otro), si corresponde */
    body?: unknown;
}

export interface AugmentedResponse extends ServerResponse {
    /** Establece status y permite encadenar */
    status(code: HttpStatus): AugmentedResponse;
    /** Establece una cabecera y permite encadenar */
    header(name: string, value: string): AugmentedResponse;
    /** Envía JSON tipado (finaliza la respuesta) */
    json<T>(body: ApiResponse<T>): void;
    /** Envía texto plano/HTML y finaliza (status opcional, por defecto 200) */
    text(body: string, status?: HttpStatus, contentType?: 'text/plain' | 'text/html'): void;
}

/**
 * Construye un `AugmentedRequest` a partir de `IncomingMessage`.
 * - Normaliza `method`.
 * - Parsea `path` y `query` desde `req.url`.
 * - `body` se asignará en middleware de parseo JSON (si aplica).
 */
export function buildAugmentedRequest(req: IncomingMessage): AugmentedRequest {
    const method = (req.method ?? 'GET').toUpperCase() as HttpMethod;
    const { pathname, query } = parseUrl(req.url);
    return Object.assign(req, {
        method,
        path: pathname,
        query,
    }) as AugmentedRequest;
}

/**
 * Extiende un `ServerResponse` con helpers encadenables fuertemente tipados.
 * No cambia el prototipo global; solo decora la instancia.
 */
export function augmentResponse(res: ServerResponse): AugmentedResponse {
    const r = res as AugmentedResponse;

    r.status = (code: HttpStatus): AugmentedResponse => {
        r.statusCode = code;
        return r;
    };

    r.header = (name: string, value: string): AugmentedResponse => {
        r.setHeader(name, value);
        return r;
    };

    r.json = <T>(body: ApiResponse<T>): void => {
        // Si no se marcó previamente, por defecto 200
        if (typeof r.statusCode !== 'number' || r.statusCode === 0) {
            r.statusCode = 200;
        }
        sendJSON(r, r.statusCode as HttpStatus, body);
    };

    r.text = (body: string, status?: HttpStatus, contentType?: 'text/plain' | 'text/html'): void => {
        const code = status ?? (typeof r.statusCode === 'number' && r.statusCode !== 0 ? (r.statusCode as HttpStatus) : 200);
        sendText(r, code, body, contentType ?? 'text/plain');
    };

    return r;
}
