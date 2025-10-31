import { useEffect, useMemo, useRef, useState } from 'react';
import { getMetrics } from '@/shared/api/metrics.api';
import type { GetMetricsResponse } from '@/shared/types/dto';

export interface UseMetricsOptions {
    readonly intervalMs?: number; // default 3000
}

export type MetricsSnapshot = GetMetricsResponse;

export interface UseMetricsState {
    readonly loading: boolean;
    readonly error?: string;
    readonly data?: MetricsSnapshot;
    readonly lastUpdated?: number; // epoch ms
    readonly refresh: () => Promise<void>;
}

/**
 * Hook de sondeo (poll) para /metrics
 * - Llama a GET /metrics cada intervalMs
 * - Expone loading, data, error y lastUpdated
 */
export function useMetrics(opts?: UseMetricsOptions): UseMetricsState {
    const interval = Math.max(500, opts?.intervalMs ?? 3000);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | undefined>(undefined);
    const [data, setData] = useState<MetricsSnapshot | undefined>(undefined);
    const [lastUpdated, setLastUpdated] = useState<number | undefined>(undefined);

    const mountedRef = useRef<boolean>(false);
    const timerRef = useRef<number | null>(null);

    const refresh = useMemo(
        () => async () => {
            try {
                const payload = await getMetrics(); // { tps, latency: { mean, p50, p95, count } }
                if (!mountedRef.current) return;
                setData(payload);
                setError(undefined);
                setLastUpdated(Date.now());
            } catch (e) {
                if (!mountedRef.current) return;
                const msg = e instanceof Error ? e.message : 'Failed to fetch /metrics';
                setError(msg);
            } finally {
                if (mountedRef.current) {
                    setLoading(false);
                }
            }
        },
        []
    );

    useEffect(() => {
        mountedRef.current = true;
        // carga inmediata
        refresh();

        // intervalo de sondeo
        timerRef.current = window.setInterval(() => {
            void refresh();
        }, interval);

        return () => {
            mountedRef.current = false;
            if (timerRef.current !== null) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [interval, refresh]);

    return { loading, error, data, lastUpdated, refresh };
}
