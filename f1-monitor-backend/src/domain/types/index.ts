import type { Team, Position, Millis } from '@/config/constants.js';

declare const __pilotIdBrand: unique symbol;
/** Identificador de piloto con branding nominal para evitar confundir con string genérica. */
export type PilotId = string & { readonly [__pilotIdBrand]: 'pilotId' };

/** Castea de forma segura un string a PilotId (en tiempo de compilación aplica branding). */
export function asPilotId(id: string): PilotId {
    const trimmed = id.trim();
    if (trimmed.length === 0) {
        throw new Error('PilotId must be a non-empty string');
    }
    return trimmed as PilotId;
}

export type { Team, Position, Millis };
