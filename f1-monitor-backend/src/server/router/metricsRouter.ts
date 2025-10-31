import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import type { MetricsService } from '@/services/MetricsService.js';
import { createMetricsController } from '../controllers/metricsController';

export function createMetricsRouter(deps: { metrics: MetricsService }) {
    const metricsCtrl = createMetricsController(deps);
    return function metricsRouter(req: AugmentedRequest, res: AugmentedResponse): void {
        metricsCtrl(req, res);
    };
}
