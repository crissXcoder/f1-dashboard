import { Buffer } from 'buffer';
import type { Next } from '@/server/middleware/types.js';
import { HttpError } from '@/server/middleware/types.js';
import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';

function isJsonContentType(ct: string | undefined): boolean {
    if (!ct) return false;
    return ct.toLowerCase().includes('application/json');
}

/** Lee y parsea JSON con límite de tamaño (por defecto 1MB). */
export function jsonParser(maxBytes: number = 1_000_000) {
    return async (req: AugmentedRequest, res: AugmentedResponse, next: Next): Promise<void> => {
        // Solo parsea si el método potencialmente trae body
        if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
            return next(req, res);
        }

        if (!isJsonContentType(req.headers['content-type'])) {
            // No JSON → seguimos sin tocar body
            return next(req, res);
        }

        const chunks: Buffer[] = [];
        let total = 0;

        await new Promise<void>((resolve, reject) => {
            req.on('data', (chunk: Buffer) => {
                total += chunk.length;
                if (total > maxBytes) {
                    reject(new HttpError(413, `Payload too large (>${maxBytes} bytes)`, 'PAYLOAD_TOO_LARGE'));
                    return;
                }
                chunks.push(chunk);
            });
            req.on('end', () => resolve());
            req.on('error', (err) => reject(err));
        }).catch((err) => {
            // Propaga al errorHandler
            throw err;
        });

        if (chunks.length === 0) {
            req.body = undefined;
            return next(req, res);
        }

        const raw = Buffer.concat(chunks).toString('utf8');
        try {
            const parsed = JSON.parse(raw) as unknown;
            req.body = parsed;
            return next(req, res);
        } catch {
            throw new HttpError(400, 'Invalid JSON payload', 'INVALID_JSON');
        }
    };
}
