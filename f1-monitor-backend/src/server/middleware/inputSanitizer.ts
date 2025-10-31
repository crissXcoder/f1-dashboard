import type { Next } from '@/server/middleware/types.js';
import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';

/** Colapsa espacios múltiples a uno solo y recorta extremos. */
function cleanString(s: string): string {
    const t = s.trim();
    return t.replace(/\s{2,}/g, ' ');
}

function sanitizeUnknown(value: unknown): unknown {
    if (typeof value === 'string') return cleanString(value);
    if (Array.isArray(value)) return value.map(sanitizeUnknown);
    if (value && typeof value === 'object') {
        const src = value as Record<string, unknown>;
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(src)) {
            out[k] = sanitizeUnknown(src[k]);
        }
        return out;
    }
    return value;
}

/**
 * Sanea req.body si existe (no muta el original). No valida dominios;
 * solo normaliza strings. Útil antes del pipeline funcional.
 */
export function inputSanitizer() {
    return (req: AugmentedRequest, res: AugmentedResponse, next: Next): void => {
        if (req.body !== undefined) {
            req.body = sanitizeUnknown(req.body);
        }
        next(req, res);
    };
}
