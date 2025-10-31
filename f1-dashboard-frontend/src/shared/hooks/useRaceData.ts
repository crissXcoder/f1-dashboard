import { useEffect, useMemo, useState } from 'react';
import { getLeaderboard, getPilots } from '@/shared/api/pilots.api';
import { useRaceDispatch, useRaceState } from '@/shared/state/RaceContext';
import { useEventSource } from './useEventSource';
import type { Millis } from '@/shared/types/domain';
import type { RaceUpdateEventPayload } from '@/shared/types/dto';
import { nowMs } from '@/shared/utils/time';

export interface UseRaceDataState {
    readonly loading: boolean;
    readonly error?: string;
    readonly connected: boolean;
    readonly lastUpdateTs?: Millis;
}

/**
 * Orquesta:
 *  - Carga inicial (pilots + leaderboard)
 *  - Suscripción SSE (race-update)
 *  - Refleja estado de conexión y errores
 */
export function useRaceData(): UseRaceDataState {
    const dispatch = useRaceDispatch();
    const { connected, lastUpdateTs, error } = useRaceState();
    const [loading, setLoading] = useState<boolean>(true);
    const [localError, setLocalError] = useState<string | undefined>(undefined);

    // 1) Carga inicial REST
    useEffect(() => {
        let cancelled = false;
        void connected;

        async function load() {
            setLoading(true);
            try {
                const [pilots, leaderboard] = await Promise.all([
                    getPilots(),
                    getLeaderboard(),
                ]);
                if (cancelled) return;
                dispatch({
                    type: 'INIT_FROM_REST',
                    payload: { pilots, leaderboard, fetchedAt: nowMs() },
                });
                setLocalError(undefined);
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Failed to load initial data';
                if (!cancelled) {
                    setLocalError(msg);
                    dispatch({ type: 'SET_ERROR', payload: msg });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [dispatch]);

    // 2) Suscripción SSE
    const sse = useEventSource({
        reconnectDelayMs: 3000,
        onOpen: () => dispatch({ type: 'CONNECTED' }),
        onClose: () => dispatch({ type: 'DISCONNECTED' }),
        onError: () => {
            // no pisar error local de carga si ya existe
            if (!localError) dispatch({ type: 'SET_ERROR', payload: 'SSE error' });
        },
        onRaceUpdate: (payload: RaceUpdateEventPayload) => {
            dispatch({ type: 'UPSERT_FROM_SSE', payload });
        },
    });

    // 3) Estado combinado para el caller
    const ui: UseRaceDataState = useMemo(
        () => ({
            loading,
            error: localError ?? error,
            connected: sse.connected,
            lastUpdateTs,
        }),
        [loading, localError, error, sse.connected, lastUpdateTs]
    );

    return ui;
}
