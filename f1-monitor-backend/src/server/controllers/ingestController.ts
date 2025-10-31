import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import { sendJSON, type ApiResponse } from '@/utils/response.js';
import { processIncomingSample } from '@/pipeline/index.js';
import type { SampleProcessed } from '@/pipeline/types.js';
import type { PilotService } from '@/services/PilotService.js';
import type { SSEHub } from '@/sse/sseHub.js';
import { HttpError } from '@/server/middleware/types.js';

/**
 * Controlador de ingesta:
 * 1) Valida + transforma (pipeline funcional)
 * 2) Persiste en memoria (PilotService + RaceDataStore)
 * 3) Difunde por SSE (SSEHub.broadcast)
 * 4) Responde JSON tipado
 */
export function createIngestController(deps: {
    pilotService: PilotService;
    sseHub: SSEHub;
}) {
    const { pilotService, sseHub } = deps;

    return function ingestHandler(req: AugmentedRequest, res: AugmentedResponse): void {
        if (req.method !== 'POST') {
            throw new HttpError(405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');
        }

        const result = processIncomingSample(req.body);

        if (!result.ok) {
            const body: ApiResponse<unknown> = {
                ok: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid payload',
                    details: result.errors,
                },
            };
            sendJSON(res, 422, body);
            return;
        }

        // Persistencia OO
        const processed: SampleProcessed = result.value;
        const raceSample = pilotService.ingestProcessedSample(processed);

        // Difusión SSE
        sseHub.broadcast('race-update', {
            pilotId: raceSample.pilotId,
            position: raceSample.position,
            lastLapMs: raceSample.lastLapMs,
            points: raceSample.points,
            anomaly: raceSample.anomaly,
            ts: raceSample.ts,
        });

        const body: ApiResponse<SampleProcessed> = {
            ok: true,
            data: processed,
        };
        sendJSON(res, 201, body);
    };
}
