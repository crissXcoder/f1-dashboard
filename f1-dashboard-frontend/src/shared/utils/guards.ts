import { TEAMS, type Millis, type Position, type Team } from '@/shared/types/domain';
import type {
    ApiResponse,
    LeaderboardRowDTO,
    PilotDTO,
    RaceSampleDTO,
    RaceUpdateEventPayload,
    LatencySnapshotDTO,
} from '@/shared/types/dto';

export function isNonEmptyString(x: unknown): x is string {
    return typeof x === 'string' && x.trim().length > 0;
}

export function isFiniteNumber(x: unknown): x is number {
    return typeof x === 'number' && Number.isFinite(x);
}

export function isMillis(x: unknown): x is Millis {
    return isFiniteNumber(x) && x >= 0;
}

export function isTeam(x: unknown): x is Team {
    return typeof x === 'string' && (TEAMS as readonly string[]).includes(x);
}

export function isPosition(x: unknown): x is Position {
    return Number.isInteger(x) && (x as number) >= 1 && (x as number) <= 20;
}

/** ApiResponse guard (ok: true/false, data/error). */
export function isApiResponseOk<T>(x: unknown): x is ApiResponse<T> & { ok: true } {
    return typeof x === 'object' && x !== null && (x as { ok?: unknown }).ok === true;
}
export function isApiResponseErr<T>(x: unknown): x is ApiResponse<T> & { ok: false } {
    return typeof x === 'object' && x !== null && (x as { ok?: unknown }).ok === false;
}

/** PilotDTO guard. */
export function isPilotDTO(x: unknown): x is PilotDTO {
    if (typeof x !== 'object' || x === null) return false;
    const o = x as Record<string, unknown>;
    return isNonEmptyString(o.id) && isNonEmptyString(o.name) && isTeam(o.team);
}

/** RaceSampleDTO guard. */
export function isRaceSampleDTO(x: unknown): x is RaceSampleDTO {
    if (typeof x !== 'object' || x === null) return false;
    const o = x as Record<string, unknown>;
    return (
        isNonEmptyString(o.pilotId) &&
        isPosition(o.position) &&
        isMillis(o.lastLapMs) &&
        isFiniteNumber(o.points) &&
        typeof o.anomaly === 'boolean' &&
        isMillis(o.ts)
    );
}

/** LeaderboardRowDTO guard. */
export function isLeaderboardRowDTO(x: unknown): x is LeaderboardRowDTO {
    if (typeof x !== 'object' || x === null) return false;
    const o = x as Record<string, unknown>;
    const optPosOk = o.position === undefined || isPosition(o.position);
    const optLapOk = o.lastLapMs === undefined || isMillis(o.lastLapMs);
    const optAnomOk = o.anomaly === undefined || typeof o.anomaly === 'boolean';
    const optTsOk = o.ts === undefined || isMillis(o.ts);
    return (
        isNonEmptyString(o.pilotId) &&
        isNonEmptyString(o.pilotName) &&
        isTeam(o.team) &&
        isFiniteNumber(o.points) &&
        optPosOk &&
        optLapOk &&
        optAnomOk &&
        optTsOk
    );
}

/** SSE race-update payload guard. */
export function isRaceUpdateEventPayload(x: unknown): x is RaceUpdateEventPayload {
    return isRaceSampleDTO(x);
}

/** Métricas guard. */
export function isLatencySnapshotDTO(x: unknown): x is LatencySnapshotDTO {
    if (typeof x !== 'object' || x === null) return false;
    const o = x as Record<string, unknown>;
    return (
        isFiniteNumber(o.mean) &&
        isFiniteNumber(o.p50) &&
        isFiniteNumber(o.p95) &&
        Number.isInteger(o.count)
    );
}
