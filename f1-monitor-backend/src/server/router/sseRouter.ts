import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import type { SSEHub } from '@/sse/sseHub.js';
import { createSseController } from '../controllers/sseController';

export function createSseRouter(deps: { sseHub: SSEHub }) {
    const sse = createSseController(deps);
    return function sseRouter(req: AugmentedRequest, res: AugmentedResponse): void {
        sse(req, res);
    };
}
