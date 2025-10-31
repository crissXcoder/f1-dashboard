import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import type { SSEHub } from '@/sse/sseHub.js';
import { HttpError } from '@/server/middleware/types.js';

/**
 * Controlador SSE:
 *  - GET /sse -> suscribe el cliente al hub y deja el stream abierto
 */
export function createSseController(deps: { sseHub: SSEHub }) {
    const { sseHub } = deps;

    return function sseHandler(req: AugmentedRequest, res: AugmentedResponse): void {
        if (req.method !== 'GET') {
            throw new HttpError(405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');
        }
        // Mantener la conexión viva — el hub gestiona heartbeats y cierre
        sseHub.subscribe(res);
        // No hacemos res.end(); el stream debe quedar abierto hasta que el cliente cierre
    };
}
