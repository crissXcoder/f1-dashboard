import type { Next } from '@/server/middleware/types.js';
import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';
import { config } from '@/config/index.js';

function resolveOriginHeader(requestOrigin: string | null): string {
    const allowed = config.CORS_ORIGIN.trim();

    // Permite todo
    if (allowed === '*') return '*';

    // Lista separada por comas
    const list = allowed.split(',').map(s => s.trim()).filter(Boolean);
    if (list.length === 0) return '*';

    // Si la petición trae Origin y está en la lista, se refleja
    if (requestOrigin && list.includes(requestOrigin)) {
        return requestOrigin;
    }

    // Caso conservador: no reflejar si no coincide
    return list[0] ?? '*';
}

export function cors(): (req: AugmentedRequest, res: AugmentedResponse, next: Next) => void {
    return (req, res, next) => {
        const reqOrigin = (req.headers.origin ?? null) as string | null;
        const originHeader = resolveOriginHeader(reqOrigin);

        res.setHeader('Access-Control-Allow-Origin', originHeader);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', originHeader === '*' ? 'false' : 'true');

        if (req.method === 'OPTIONS') {
            res.status(204).end();
            return;
        }

        next(req, res);
    };
}
