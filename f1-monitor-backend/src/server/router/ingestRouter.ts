import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import type { PilotService } from '@/services/PilotService.js';
import type { SSEHub } from '@/sse/sseHub.js';
import { createIngestController } from '../controllers/ingestController';

export function createIngestRouter(deps: { pilotService: PilotService; sseHub: SSEHub }) {
    const ingest = createIngestController(deps);
    return function ingestRouter(req: AugmentedRequest, res: AugmentedResponse): void {
        // Solo atiende POST /ingest (el matching por path/method ya se hizo en routes.ts)
        ingest(req, res);
    };
}
