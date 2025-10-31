import { getData, postData } from '@/shared/config/fetcher';
import type {
    GetPilotsResponse,
    UpsertPilotResponse,
    GetLatestResponse,
    GetRecentResponse,
    GetLeaderboardResponse,
} from '@/shared/types/dto';
import type { Team, Millis } from '@/shared/types/domain';

/**
 * Helper para extraer el tipo de 'data' SOLO cuando la respuesta es ok:true.
 * Evita el error de indexar union types (ApiResponse<T>).
 */
type ApiOkData<R> = R extends { ok: true; data: infer D } ? D : never;

/**
 * Nota:
 * - getData<T>()/postData<T>() DEVUELVEN T (el 'data' ya desempaquetado).
 * - Por eso pasamos ApiOkData<...> como genérico, que se deriva de tus
 *   GetXResponse existentes (sin re-declarar ni inventar tipos).
 */

export async function getPilots(): Promise<ApiOkData<GetPilotsResponse>> {
    // T = ReadonlyArray<PilotDTO>
    return getData<ApiOkData<GetPilotsResponse>>('/api/pilots');
}

export async function upsertPilot(input: {
    id: string;
    name: string;
    team: Team;
}): Promise<ApiOkData<UpsertPilotResponse>> {
    // T = { id: PilotId; name: string; team: Team }
    return postData<ApiOkData<UpsertPilotResponse>, typeof input>('/api/pilots', input);
}

export async function getLatest(pilotId: string): Promise<ApiOkData<GetLatestResponse>> {
    // T = RaceSampleDTO | null
    return getData<ApiOkData<GetLatestResponse>>('/api/pilots/latest', { id: pilotId });
}

export async function getRecent(
    pilotId: string,
    windowMs?: Millis
): Promise<ApiOkData<GetRecentResponse>> {
    // T = ReadonlyArray<RaceSampleDTO>
    return getData<ApiOkData<GetRecentResponse>>('/api/pilots/recent', { id: pilotId, windowMs });
}

export async function getLeaderboard(): Promise<ApiOkData<GetLeaderboardResponse>> {
    // T = ReadonlyArray<LeaderboardRowDTO>
    return getData<ApiOkData<GetLeaderboardResponse>>('/api/leaderboard');
}

/* 
  Tipos “visibles” en las promesas (para referencia rápida):

  getPilots(): Promise<ReadonlyArray<PilotDTO>>
  upsertPilot(...): Promise<{ id: PilotId; name: string; team: Team }>
  getLatest(...): Promise<RaceSampleDTO | null>
  getRecent(...): Promise<ReadonlyArray<RaceSampleDTO>>
  getLeaderboard(): Promise<ReadonlyArray<LeaderboardRowDTO>>
*/
