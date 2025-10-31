import type { Next } from '@/server/middleware/types.js';
import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import { logAccess } from '@/infra/logging/logger.js';

function getClientIp(req: AugmentedRequest): string | undefined {
    const h = req.headers['x-forwarded-for'];
    if (typeof h === 'string' && h.length > 0) {
        const first = h.split(',')[0] ?? '';
        return first.trim() || undefined;
    }
    return req.socket.remoteAddress ?? undefined;
}

/** Registra {ts, method, path, status, durationMs, ip}. */
export function requestLogger() {
    return (req: AugmentedRequest, res: AugmentedResponse, next: Next): void => {
        const start = Date.now();
        const ip = getClientIp(req);
        const { method, path } = req;

        // Al finalizar la respuesta, loguear
        res.on('finish', () => {
            const durationMs = Date.now() - start;
            const status = res.statusCode || 0;
            logAccess({
                route: path,
                method,
                status,
                durationMs,
                ...(ip ? { ip } : {}),
            });
        });

        next(req, res);
    };
}
