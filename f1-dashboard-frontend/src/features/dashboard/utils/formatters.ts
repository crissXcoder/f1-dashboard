import type { LeaderboardRowDTO } from '@/shared/types/dto';
import type { Millis, Position, Team } from '@/shared/types/domain';
import { msToLapStr } from '@/shared/utils/time';

export function fmtLap(ms?: Millis): string {
    return ms === undefined ? '—' : msToLapStr(ms);
}

export function fmtPos(p?: Position): string {
    return p === undefined ? '—' : `#${p}`;
}

export function fmtTeam(t: Team): string {
    // Simple normalización visual (por si quieres mapear abreviaturas)
    return t;
}

export function rowKey(r: LeaderboardRowDTO, i: number): string {
    return `${r.pilotId}-${r.ts ?? 'na'}-${i}`;
}
