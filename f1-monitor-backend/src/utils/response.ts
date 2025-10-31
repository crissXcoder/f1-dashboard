import type { ServerResponse } from 'http';

export type HttpStatus =
    | 200 | 201 | 202 | 204
    | 400 | 401 | 403 | 404 | 405 | 409 | 413 | 415 | 418 | 422 | 429
    | 500 | 503;

export type ApiResponse<T> =
    | { ok: true; data: T }
    | { ok: false; error: { code: string; message: string; details?: unknown } };

/** Envía JSON tipado con status y cabeceras apropiadas. */
export function sendJSON<T>(
    res: ServerResponse,
    status: HttpStatus,
    body: ApiResponse<T>,
): void {
    const json = JSON.stringify(body);
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Length', Buffer.byteLength(json, 'utf8'));
    res.end(json, 'utf8');
}

/** Envía texto plano con encoding y status. */
export function sendText(
    res: ServerResponse,
    status: HttpStatus,
    text: string,
    contentType: 'text/plain' | 'text/html' = 'text/plain',
): void {
    const payload = text;
    res.statusCode = status;
    res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
    res.setHeader('Content-Length', Buffer.byteLength(payload, 'utf8'));
    res.end(payload, 'utf8');
}

/** Aplica cabeceras estándar para conexiones Server-Sent Events (SSE). */
export function applySSEHeaders(res: ServerResponse): void {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    // Para CORS en SSE (si el router ya aplicó origin, se respeta)
    if (!res.hasHeader('Access-Control-Allow-Origin')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    // Evita que proxies compriman y rompan el stream
    res.setHeader('X-Accel-Buffering', 'no');
}
