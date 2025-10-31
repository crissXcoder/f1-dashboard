import { useEffect, useMemo, useRef, useState } from 'react';
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
 *  - Carga inicial (pilots + leaderboard vía REST)
 *  - Suscripción SSE (race-update)
 *  - Estado combinado para UI
 *
 * Importante: evita deps que se auto-disparen y creen bucles;
 * la suscripción SSE ya es estable y única (useEventSource).
 */
export function useRaceData(): UseRaceDataState {
    const dispatch = useRaceDispatch();
    const { connected, lastUpdateTs, error } = useRaceState();

    const [loading, setLoading] = useState<boolean>(true);
    const [localError, setLocalError] = useState<string | undefined>(undefined);

    void connected;

    // Guardar referencia del último error local para leerlo en callbacks estables
    const localErrorRef = useRef<string | undefined>(undefined);
    useEffect(() => { localErrorRef.current = localError; }, [localError]);

    // 1) Carga inicial REST (se ejecuta una vez)
    useEffect(() => {
        let cancelled = false;

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
                const msg =
                    e instanceof Error ? e.message : 'Failed to load initial data';
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

    // 2) Suscripción SSE (una sola conexión; callbacks estables dentro del hook)
    const sse = useEventSource({
        enabled: true,
        retryBaseMs: 1000,
        retryMaxMs: 30000,
        onOpen: () => dispatch({ type: 'CONNECTED' }),
        onClose: () => dispatch({ type: 'DISCONNECTED' }),
        onError: () => {
            // No pisar el error de carga si ya existe uno
            if (!localErrorRef.current) {
                dispatch({ type: 'SET_ERROR', payload: 'SSE error' });
            }
        },
        onRaceUpdate: (payload: RaceUpdateEventPayload) => {
            dispatch({ type: 'UPSERT_FROM_SSE', payload });
        },
        onPing: () => {
            // opcional: podrías actualizar un "lastPingTs" si lo exposes en el state
            // dispatch({ type: 'PING', payload: nowMs() });
        },
    });

    // 3) Estado combinado para la UI
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
