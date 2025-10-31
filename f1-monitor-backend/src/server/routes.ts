import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import type { PilotService } from '@/services/PilotService.js';
import type { MetricsService } from '@/services/MetricsService.js';
import type { SSEHub } from '@/sse/sseHub.js';

import { createIngestRouter } from '@/server/router/ingestRouter.js';
import { createSseRouter } from '@/server/router/sseRouter.js';
import { createMetricsRouter } from '@/server/router/metricsRouter.js';
import { createHealthRouter } from '@/server/router/healthRouter.js';
import { createApiRouter } from '@/server/router/apiRouter.js';
import { sendJSON } from '@/utils/response.js';

export type Handler = (req: AugmentedRequest, res: AugmentedResponse) => void;
export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface RouteEntry {
    readonly method: Method;
    readonly path: string;
    readonly handler: Handler;
}

export function buildRoutes(deps: {
    pilotService: PilotService;
    metrics: MetricsService;
    sseHub: SSEHub;
}) {
    const ingestRouter = createIngestRouter({ pilotService: deps.pilotService, sseHub: deps.sseHub });
    const sseRouter = createSseRouter({ sseHub: deps.sseHub });
    const metricsRouter = createMetricsRouter({ metrics: deps.metrics });
    const healthRouter = createHealthRouter();
    const apiRouter = createApiRouter({ pilotService: deps.pilotService });

    // Tabla inmutable de rutas (matcheo por igualdad exacta)
    const routes: readonly RouteEntry[] = Object.freeze([
        { method: 'GET', path: '/health', handler: healthRouter },
        { method: 'GET', path: '/metrics', handler: metricsRouter },
        { method: 'GET', path: '/sse', handler: sseRouter },
        { method: 'POST', path: '/ingest', handler: ingestRouter },

        // API
        { method: 'GET', path: '/api/pilots', handler: apiRouter },
        { method: 'POST', path: '/api/pilots', handler: apiRouter },
        { method: 'GET', path: '/api/pilots/latest', handler: apiRouter },
        { method: 'GET', path: '/api/pilots/recent', handler: apiRouter },
        { method: 'GET', path: '/api/leaderboard', handler: apiRouter },
    ]);

    // Dispatcher: busca coincidencia exacta; si no, 404.
    return function dispatch(req: AugmentedRequest, res: AugmentedResponse): void {
        const found = routes.find(r => r.method === req.method && r.path === req.path);
        if (!found) {
            sendJSON(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
            return;
        }
        found.handler(req, res);
    };
}
