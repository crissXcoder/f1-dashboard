import type { Next } from '@/server/middleware/types.js';
import { HttpError } from '@/server/middleware/types.js';
import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import { sendJSON, type ApiResponse } from '@/utils/response.js';
import { logError } from '@/infra/logging/logger.js';

export function errorHandler() {
    return (req: AugmentedRequest, res: AugmentedResponse, next: Next): void => {
        try {
            next(req, res);
        } catch (err) {
            // Si next lanzó sin async, manejamos aquí
            handleError(err, req, res);
        }
    };
}

/**
 * Versión async-safe: envuelve un handler async y reenvía al manejador.
 * Útil si en tu router usas funciones async/await.
 */
export function wrapAsync(handler: Next): Next {
    return async (req, res) => {
        try {
            await handler(req, res);
        } catch (err) {
            handleError(err, req, res);
        }
    };
}

function handleError(err: unknown, req: AugmentedRequest, res: AugmentedResponse): void {
    // Ya se envió?
    if (res.writableEnded) return;

    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal Server Error';

    if (err instanceof HttpError) {
        status = err.status;
        code = err.code ?? code;
        message = err.message;
    } else if (err instanceof Error) {
        message = err.message || message;
    }

    // Log estructurado
    logError(
        message,
        err instanceof Error && typeof err.stack === 'string' ? { stack: err.stack } : undefined,
        {
            path: req.path,
            method: req.method,
            status,
            code,
        },
    );

    const body: ApiResponse<unknown> = {
        ok: false,
        error: { code, message },
    };

    sendJSON(res, status as 400 | 401 | 403 | 404 | 405 | 409 | 413 | 415 | 418 | 422 | 429 | 500 | 503 | 200 | 201 | 202 | 204, body);
}
