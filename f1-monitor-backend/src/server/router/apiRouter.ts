import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import type { PilotService } from '@/services/PilotService.js';
import { createPilotsController } from '../controllers/pilotsController';
import { sendJSON } from '@/utils/response.js';

export function createApiRouter(deps: { pilotService: PilotService }) {
    const pilots = createPilotsController(deps);

    return function apiRouter(req: AugmentedRequest, res: AugmentedResponse): void {
        // Ramas por path exacto (routes.ts ya validó método+path válidos para API)
        if (req.path === '/api/pilots') {
            if (req.method === 'GET') return pilots.list(req, res);
            if (req.method === 'POST') return pilots.upsert(req, res);
        }

        if (req.path === '/api/pilots/latest' && req.method === 'GET') {
            return pilots.latest(req, res);
        }

        if (req.path === '/api/pilots/recent' && req.method === 'GET') {
            return pilots.recent(req, res);
        }

        if (req.path === '/api/leaderboard' && req.method === 'GET') {
            return pilots.leaderboard(req, res);
        }

        // Si llegó aquí, es un 404 dentro del namespace /api
        sendJSON(res, 404, { ok: false, error: { code: 'API_NOT_FOUND', message: 'API route not found' } });
    };
}
