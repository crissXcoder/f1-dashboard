import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import { createHealthController } from '../controllers/healthController';

export function createHealthRouter() {
    const health = createHealthController();
    return function healthRouter(req: AugmentedRequest, res: AugmentedResponse): void {
        health(req, res);
    };
}
