import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import { sendJSON, type ApiResponse } from '@/utils/response.js';
import type { PilotService } from '@/services/PilotService.js';
import type { Team, Millis } from '@/domain/types/index.js';
import { asPilotId } from '@/domain/types/index.js';
import { HttpError } from '@/server/middleware/types.js';

/**
 * Controlador de pilotos:
 *  - list: GET /api/pilots[?team=Team]
 *  - upsert: POST /api/pilots  { id, name, team }
 *  - latest: GET /api/pilots/latest?id=pilotId
 *  - recent: GET /api/pilots/recent?id=pilotId&windowMs=300000
 *  - leaderboard: GET /api/leaderboard
 */
export function createPilotsController(deps: { pilotService: PilotService }) {
    const { pilotService } = deps;

    function list(req: AugmentedRequest, res: AugmentedResponse): void {
        if (req.method !== 'GET') throw new HttpError(405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');

        const teamParam = req.query.get('team');
        if (teamParam) {
            const team = teamParam as Team;
            const data = pilotService.listPilotsByTeam(team);
            const body: ApiResponse<typeof data> = { ok: true, data };
            sendJSON(res, 200, body);
            return;
        }

        const data = pilotService.listPilots();
        const body: ApiResponse<typeof data> = { ok: true, data };
        sendJSON(res, 200, body);
    }

    function upsert(req: AugmentedRequest, res: AugmentedResponse): void {
        if (req.method !== 'POST') throw new HttpError(405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');

        const b = req.body as unknown as { id?: string; name?: string; team?: Team } | undefined;
        if (!b || !b.id || !b.name || !b.team) {
            throw new HttpError(400, 'Missing required fields: id, name, team', 'BAD_REQUEST');
        }

        pilotService.upsertPilot(b.id, b.name, b.team);
        sendJSON(res, 201, { ok: true, data: { id: b.id, name: b.name, team: b.team } });
    }

    function latest(req: AugmentedRequest, res: AugmentedResponse): void {
        if (req.method !== 'GET') throw new HttpError(405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');

        const id = req.query.get('id');
        if (!id) throw new HttpError(400, 'Missing query param: id', 'BAD_REQUEST');

        const latestSample = pilotService.getLatestByPilot(id);
        sendJSON(res, 200, { ok: true, data: latestSample ?? null });
    }

    function recent(req: AugmentedRequest, res: AugmentedResponse): void {
        if (req.method !== 'GET') throw new HttpError(405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');

        const id = req.query.get('id');
        const windowMsStr = req.query.get('windowMs');
        if (!id) throw new HttpError(400, 'Missing query param: id', 'BAD_REQUEST');

        const windowMs = (windowMsStr ? Number.parseInt(windowMsStr, 10) : 5 * 60 * 1000) as Millis; // 5 min por defecto
        if (!Number.isFinite(Number(windowMs)) || Number(windowMs) <= 0) {
            throw new HttpError(400, 'Invalid windowMs', 'BAD_REQUEST');
        }

        const data = pilotService.getRecentByPilot(id, windowMs);
        sendJSON(res, 200, { ok: true, data });
    }

    function leaderboard(req: AugmentedRequest, res: AugmentedResponse): void {
        if (req.method !== 'GET') throw new HttpError(405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');

        const data = pilotService.getLeaderboard();
        sendJSON(res, 200, { ok: true, data });
    }

    return { list, upsert, latest, recent, leaderboard };
}
