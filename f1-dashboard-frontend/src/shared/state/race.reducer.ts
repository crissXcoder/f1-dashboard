import type { Millis } from '@/shared/types/domain';
import type {
    PilotDTO,
    LeaderboardRowDTO,
    RaceUpdateEventPayload,
} from '@/shared/types/dto';

export interface RaceState {
    readonly pilotsById: Readonly<Record<string, PilotDTO>>;
    readonly leaderboard: ReadonlyArray<LeaderboardRowDTO>;
    readonly connected: boolean;
    readonly lastUpdateTs?: Millis;
    readonly error?: string;
}

export const initialRaceState: RaceState = Object.freeze({
    pilotsById: {},
    leaderboard: [],
    connected: false,
});

export type RaceAction =
    | {
        type: 'INIT_FROM_REST';
        payload: {
            readonly pilots: ReadonlyArray<PilotDTO>;
            readonly leaderboard: ReadonlyArray<LeaderboardRowDTO>;
            readonly fetchedAt: Millis;
        };
    }
    | {
        type: 'UPSERT_FROM_SSE';
        payload: RaceUpdateEventPayload;
    }
    | { type: 'CONNECTED' }
    | { type: 'DISCONNECTED' }
    | { type: 'SET_ERROR'; payload?: string };

function indexPilots(list: ReadonlyArray<PilotDTO>): Record<string, PilotDTO> {
    const acc: Record<string, PilotDTO> = {};
    for (const p of list) acc[p.id] = p;
    return acc;
}

function upsertLeaderboardRow(
    rows: ReadonlyArray<LeaderboardRowDTO>,
    update: RaceUpdateEventPayload,
    pilot: PilotDTO | undefined
): ReadonlyArray<LeaderboardRowDTO> {
    const idx = rows.findIndex((r) => r.pilotId === update.pilotId);

    const base: LeaderboardRowDTO = idx >= 0 ? rows[idx] : {
        pilotId: update.pilotId,
        pilotName: pilot?.name ?? '',
        team: pilot?.team ?? ('' as never), // se reescribe en cuanto llegue pilots
        points: 0,
    };

    const next: LeaderboardRowDTO = {
        ...base,
        pilotName: pilot?.name ?? base.pilotName,
        team: pilot?.team ?? base.team,
        position: update.position,
        lastLapMs: update.lastLapMs,
        points: update.points,
        anomaly: update.anomaly,
        ts: update.ts,
    };

    if (idx >= 0) {
        const copy = rows.slice();
        copy[idx] = next;
        // ordenar si hay posición: asc por position; sin position al final
        return copy
            .slice()
            .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
    }
    return [...rows, next]
        .slice()
        .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
}

export function raceReducer(state: RaceState, action: RaceAction): RaceState {
    switch (action.type) {
        case 'INIT_FROM_REST': {
            const pilotsById = indexPilots(action.payload.pilots);
            const ordered = [...action.payload.leaderboard].sort(
                (a, b) => (a.position ?? 999) - (b.position ?? 999)
            );
            return {
                pilotsById,
                leaderboard: ordered,
                connected: state.connected,
                lastUpdateTs: action.payload.fetchedAt,
            };
        }
        case 'UPSERT_FROM_SSE': {
            const pilot = state.pilotsById[action.payload.pilotId];
            const leaderboard = upsertLeaderboardRow(
                state.leaderboard,
                action.payload,
                pilot
            );
            return {
                ...state,
                leaderboard,
                lastUpdateTs: action.payload.ts,
                error: undefined,
            };
        }
        case 'CONNECTED':
            return { ...state, connected: true, error: undefined };
        case 'DISCONNECTED':
            return { ...state, connected: false };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            // type-exhaustive
            return state;
    }
}

// Selectores útiles
export const selectLeaderboard = (s: RaceState) => s.leaderboard;
export const selectPilots = (s: RaceState) =>
    Object.values(s.pilotsById) as ReadonlyArray<PilotDTO>;
export const selectConnected = (s: RaceState) => s.connected;
export const selectLastUpdateTs = (s: RaceState) => s.lastUpdateTs;
export const selectError = (s: RaceState) => s.error;
