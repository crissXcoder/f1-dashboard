import type { Millis, PilotId, Position, Team } from './domain';

// ====== Envoltorio API genérico (igual al backend) ======
export type ApiResponse<T> =
    | { readonly ok: true; readonly data: T }
    | { readonly ok: false; readonly error: { readonly code: string; readonly message: string; readonly details?: unknown } };

// ====== Pilotos y muestras ======

// Entidad piloto básica (lo que expone el backend en /api/pilots)
export interface PilotDTO {
    readonly id: PilotId;
    readonly name: string;
    readonly team: Team;
}

// Muestra “actual” de carrera (latest/recent) tal como la usa el frontend
export interface RaceSampleDTO {
    readonly pilotId: PilotId;
    readonly position: Position;
    readonly lastLapMs: Millis;
    readonly points: number;          // puntos acumulados en la carrera
    readonly anomaly: boolean;
    readonly ts: Millis;              // timestamp en ms
}

// Leaderboard: última muestra por piloto + metadatos
export interface LeaderboardRowDTO {
    readonly pilotId: PilotId;
    readonly pilotName: string;
    readonly team: Team;
    readonly position?: Position;
    readonly lastLapMs?: Millis;
    readonly points: number;
    readonly anomaly?: boolean;
    readonly ts?: Millis;
}

// ====== Endpoints: respuestas tipadas ======

// GET /api/pilots
export type GetPilotsResponse = ApiResponse<ReadonlyArray<PilotDTO>>;

// POST /api/pilots  (eco básico del alta)
export type UpsertPilotResponse = ApiResponse<{ readonly id: PilotId; readonly name: string; readonly team: Team }>;

// GET /api/pilots/latest?id=...
export type GetLatestResponse = ApiResponse<RaceSampleDTO | null>;

// GET /api/pilots/recent?id=...&windowMs=...
export type GetRecentResponse = ApiResponse<ReadonlyArray<RaceSampleDTO>>;

// GET /api/leaderboard
export type GetLeaderboardResponse = ApiResponse<ReadonlyArray<LeaderboardRowDTO>>;

// ====== Métricas y health ======

// GET /metrics
export interface LatencySnapshotDTO {
    readonly mean: number;
    readonly p50: number;
    readonly p95: number;
    readonly count: number;
}
export type GetMetricsResponse = ApiResponse<{
    readonly tps: number;
    readonly latency: LatencySnapshotDTO;
}>;

// GET /health
export type GetHealthResponse = ApiResponse<{
    readonly status: 'ok';
    readonly ts: Millis;
    readonly uptimeMs: number;
}>;

// ====== SSE ======

// Evento principal que emite el backend por /sse
export type RaceUpdateEventName = 'race-update' | 'connected' | 'disconnected' | 'ping';

export interface RaceUpdateEventPayload {
    readonly pilotId: PilotId;
    readonly position: Position;
    readonly lastLapMs: Millis;
    readonly points: number;
    readonly anomaly: boolean;
    readonly ts: Millis;
}

// Estructura utilitaria para listeners SSE
export interface SseEvent<T extends string, P> {
    readonly event: T;
    readonly data: P;
}
