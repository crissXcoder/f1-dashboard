import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import { sendJSON } from '@/utils/response.js';
import type { MetricsService } from '@/services/MetricsService.js';
import { HttpError } from '@/server/middleware/types.js';

/**
 * Controlador de métricas:
 *  - GET /metrics -> { tps, latency: { mean, p50, p95, count } }
 */
export function createMetricsController(deps: { metrics: MetricsService }) {
    const { metrics } = deps;

    return function metricsHandler(req: AugmentedRequest, res: AugmentedResponse): void {
        if (req.method !== 'GET') {
            throw new HttpError(405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');
        }
        const data = metrics.getMetrics();
        sendJSON(res, 200, { ok: true, data });
    };
}
