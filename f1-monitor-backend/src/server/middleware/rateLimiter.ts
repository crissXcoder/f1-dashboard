import type { Next } from '@/server/middleware/types.js';
import { HttpError } from '@/server/middleware/types.js';
import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import { config } from '@/config/index.js';

type Counter = { sec: number; count: number };

function getClientIp(req: AugmentedRequest): string {
    const h = req.headers['x-forwarded-for'];
    // Normalize possible header types (string | string[] | undefined)
    const header = Array.isArray(h) ? h[0] : h;
    if (typeof header === 'string' && header.length > 0) {
        // x-forwarded-for: "client, proxy1, proxy2"
        const first = header.split(',')[0];
        return (first ?? '').trim();
    }
    return req.socket.remoteAddress ?? 'unknown';
}

/**
 * Rate limiter IP→RPS. Permite configurar ventana (segundos) y límite.
 * Por defecto: ventana 1s, límite desde `config.RATE_LIMIT_RPS`.
 */
export function rateLimiter(windowSeconds: number = 1, limitRPS: number = config.RATE_LIMIT_RPS) {
    const map = new Map<string, Counter>();

    return (req: AugmentedRequest, res: AugmentedResponse, next: Next): void => {
        const ip = getClientIp(req);
        const nowSec = Math.floor(Date.now() / 1000);

        const c = map.get(ip);
        if (!c) {
            map.set(ip, { sec: nowSec, count: 1 });
            next(req, res);
            return;
        }

        if (nowSec - c.sec >= windowSeconds) {
            // Nueva ventana
            c.sec = nowSec;
            c.count = 1;
            next(req, res);
            return;
        }

        c.count += 1;
        if (c.count > limitRPS) {
            throw new HttpError(429, 'Too Many Requests', 'RATE_LIMITED');
        }

        next(req, res);
    };
}
