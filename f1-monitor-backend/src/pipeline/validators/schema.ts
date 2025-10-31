import { TEAMS, MIN_POSITION, MAX_POSITION } from '@/config/constants.js';
import type { Position, Team } from '@/config/constants.js';
import type { SampleInput, ValidationError, ValidationResult } from '@/pipeline/types.js';

function err(path: string, message: string): ValidationError {
    return { path, message };
}

function asTeam(v: unknown): Team | undefined {
    if (typeof v !== 'string') return undefined;
    const t = v.trim() as Team;
    return (TEAMS as readonly string[]).includes(t) ? t : undefined;
}

function asPosition(v: unknown): Position | undefined {
    // Aceptamos "7" o 7, luego normalizamos al union 1..20
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number.parseInt(v, 10) : NaN;
    if (!Number.isFinite(n) || !Number.isInteger(n)) return undefined;
    if (n < MIN_POSITION || n > MAX_POSITION) return undefined;
    return n as Position;
}

function nonEmptyString(v: unknown): string | undefined {
    if (typeof v !== 'string') return undefined;
    const s = v.trim();
    return s.length > 0 ? s : undefined;
}

function asLapTimeString(v: unknown): string | undefined {
    // Permitimos formatos "M:SS.mmm" | "SSS.mmm" | "81345"
    if (typeof v !== 'string') return undefined;
    const s = v.trim();
    if (s.length === 0) return undefined;
    // Chequeo superficial: debe ser dígitos y/o colon/punto
    if (!/^[0-9:.]+$/.test(s)) return undefined;
    return s;
}

function asOptionalBoolean(v: unknown): boolean | undefined {
    if (v === undefined) return undefined;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
        const x = v.trim().toLowerCase();
        if (x === 'true' || x === '1' || x === 'yes') return true;
        if (x === 'false' || x === '0' || x === 'no') return false;
    }
    return undefined;
}

function asOptionalStringNumber(v: unknown): string | undefined {
    if (v === undefined) return undefined;
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    if (typeof v === 'string' && v.trim().length > 0 && /^[0-9.]+$/.test(v)) return v.trim();
    return undefined;
}

/**
 * Valida y construye el SampleInput
 */
export function validateShape(input: unknown): ValidationResult<SampleInput> {
    const errors: ValidationError[] = [];
    const obj = (typeof input === 'object' && input !== null) ? (input as Record<string, unknown>) : undefined;

    if (!obj) {
        return { ok: false, errors: [err('$', 'Body must be a JSON object')] };
    }

    const pilotId = nonEmptyString(obj.pilotId);
    if (!pilotId) errors.push(err('pilotId', 'pilotId must be a non-empty string'));

    const pilotName = nonEmptyString(obj.pilotName);
    if (!pilotName) errors.push(err('pilotName', 'pilotName must be a non-empty string'));

    const team = asTeam(obj.team);
    if (!team) errors.push(err('team', `team must be one of: ${TEAMS.join(', ')}`));

    const currentPosition = asPosition(obj.currentPosition);
    if (!currentPosition) errors.push(err('currentPosition', `currentPosition must be an integer between ${MIN_POSITION} and ${MAX_POSITION}`));

    const lastLapTime = asLapTimeString(obj.lastLapTime);
    if (!lastLapTime) errors.push(err('lastLapTime', 'lastLapTime must be in format "M:SS.mmm" or "SSS.mmm" or milliseconds as string'));

    const currentRacePoints = asOptionalStringNumber(obj.currentRacePoints);
    if (obj.currentRacePoints !== undefined && currentRacePoints === undefined) {
        errors.push(err('currentRacePoints', 'currentRacePoints must be numeric string or number'));
    }

    const anomalyDetected = asOptionalBoolean(obj.anomalyDetected);
    if (obj.anomalyDetected !== undefined && anomalyDetected === undefined) {
        errors.push(err('anomalyDetected', 'anomalyDetected must be boolean or "true/false/1/0/yes/no"'));
    }

    if (errors.length > 0) {
        return { ok: false, errors };
    }

    const value: SampleInput = {
        pilotId: pilotId!,                 // safe por validación previa
        pilotName: pilotName!,
        team: team as Team,
        currentPosition: currentPosition as Position,
        lastLapTime: lastLapTime!,
        ...(currentRacePoints !== undefined ? { currentRacePoints } : {}),
        ...(anomalyDetected !== undefined ? { anomalyDetected } : {}),
    };

    return { ok: true, value };
}
