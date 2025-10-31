import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import { sendJSON } from '@/utils/response.js';
import { nowMs } from '@/utils/time.js';
import { HttpError } from '@/server/middleware/types.js';

/**
 * Controlador de salud:
 *  - GET /health -> estado simple con ts y uptime aproximado
 */
const startedAt = Date.now();

export function createHealthController() {
    return function healthHandler(req: AugmentedRequest, res: AugmentedResponse): void {
        if (req.method !== 'GET') {
            throw new HttpError(405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');
        }
        const ts = nowMs();
        const uptimeMs = (Date.now() - startedAt) as number;
        sendJSON(res, 200, {
            ok: true,
            data: { status: 'ok', ts, uptimeMs },
        });
    };
}
