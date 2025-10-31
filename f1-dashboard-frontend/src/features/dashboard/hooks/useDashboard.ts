import { useMemo } from 'react';
import { useRaceData } from '@/shared/hooks/useRaceData';
import { useRaceState } from '@/shared/state/RaceContext';
import { selectLeaderboard, selectConnected, selectLastUpdateTs } from '@/shared/state/race.reducer';
import type { LeaderboardRowDTO } from '@/shared/types/dto';
import type { Millis } from '@/shared/types/domain';

export interface UseDashboardState {
    readonly loading: boolean;
    readonly error?: string;
    readonly connected: boolean;
    readonly lastUpdateTs?: Millis;
    readonly leaderboard: ReadonlyArray<LeaderboardRowDTO>;
}

export function useDashboard(): UseDashboardState {
    const { loading, error, connected: sseConnected, lastUpdateTs } = useRaceData();
    const state = useRaceState();

    // selectores derivados del state global
    const leaderboard = useMemo(() => selectLeaderboard(state), [state]);
    const connected = useMemo(() => selectConnected(state) || sseConnected, [state, sseConnected]);
    const lastTs = useMemo(() => selectLastUpdateTs(state) ?? lastUpdateTs, [state, lastUpdateTs]);

    return {
        loading,
        error,
        connected,
        lastUpdateTs: lastTs,
        leaderboard,
    };
}
