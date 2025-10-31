import http from 'http';
import { buildAugmentedRequest, augmentResponse, type AugmentedRequest, type AugmentedResponse } from '@/utils/http.js';

import { cors } from '@/server/middleware/cors.js';
import { requestLogger } from '@/server/middleware/requestLogger.js';
import { rateLimiter } from '@/server/middleware/rateLimiter.js';
import { jsonParser } from '@/server/middleware/json.js';
import { inputSanitizer } from '@/server/middleware/inputSanitizer.js';
import { errorHandler } from '@/server/middleware/errorHandler.js';

import { PilotService } from '@/services/PilotService.js';
import { MetricsService } from '@/services/MetricsService.js';
import { SimulationService } from '@/services/SimulationService.js';

import { SSEHub } from '@/sse/sseHub.js';
import { config } from '@/config/index.js';
import { buildRoutes } from '@/server/routes.js';

export function createHttpServer() {
    // ----- Dependencias singleton por proceso -----
    const pilotService = new PilotService({ ringBufferCapacity: config.RING_BUFFER_CAPACITY });
    const metrics = new MetricsService();
    const sseHub = new SSEHub(15_000);
    const simulation = new SimulationService();

    // Puedes arrancar la simulación en dev/staging:
    if (config.NODE_ENV === 'development' || config.NODE_ENV === 'staging') {
        simulation.on('sample', (sample) => {
            // Reinyecta al pipeline mediante controllers → routes
            // Aquí no persistimos; el flujo normal es vía /ingest (controllers).
            // Si quieres, puedes llamar al controlador /ingest internamente.
            // En esta versión, el router expone /ingest; úsalo con fetch interno si lo deseas.
            // Para menos acoplamiento, lo dejamos como “solo-generador”.
        });
        // simulation.start(2000); // activa si quieres simular automáticamente
    }

    // Construye la tabla de rutas con deps
    const dispatch = buildRoutes({ pilotService, metrics, sseHub });

    // ----- Middlewares (orden) -----
    const withErrors = errorHandler();
    const withCORS = cors();
    const withLogger = requestLogger();
    const withRate = rateLimiter();
    const withJSON = jsonParser(1_000_000);
    const withSanitize = inputSanitizer();

    // ----- Servidor HTTP -----
    const server = http.createServer((reqRaw, resRaw) => {
        const req = buildAugmentedRequest(reqRaw);
        const res = augmentResponse(resRaw);

        // Métricas TPS/latencia por request
        const startedAt = Date.now();
        metrics.tick();
        res.on('finish', () => {
            const dur = Date.now() - startedAt;
            metrics.recordLatency(dur);
        });

        // Cadena de middlewares y, al final, despacho de rutas
        withErrors(req, res, () => {
            withCORS(req, res, () => {
                withLogger(req, res, () => {
                    withRate(req, res, () => {
                        withJSON(req, res, () => {
                            withSanitize(req, res, () => {
                                // Despacho centralizado
                                dispatch(req as AugmentedRequest, res as AugmentedResponse);
                            });
                        });
                    });
                });
            });
        });
    });

    return { server, services: { pilotService, metrics, sseHub, simulation } };
}
