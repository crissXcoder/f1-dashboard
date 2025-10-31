import { useEffect, useRef, useState, useCallback } from 'react';
import type { RaceUpdateEventPayload } from '@/shared/types/dto';
import { createRaceEventSource } from '@/shared/api/sse.client';

export interface UseEventSourceOptions {
    readonly onOpen?: () => void;
    readonly onClose?: () => void;
    readonly onError?: (ev: Event) => void;
    readonly onRaceUpdate?: (payload: RaceUpdateEventPayload) => void;
    readonly onPing?: () => void;
    /** Reintentos automáticos simples (ms). 0 = sin reintentos. */
    readonly reconnectDelayMs?: number;
}

export function useEventSource(opts: UseEventSourceOptions) {
    const [connected, setConnected] = useState<boolean>(false);
    const [lastError, setLastError] = useState<string | undefined>(undefined);

    const closerRef = useRef<null | (() => void)>(null);
    const reconnectTimer = useRef<number | null>(null);

    const clearReconnect = () => {
        if (reconnectTimer.current !== null) {
            window.clearTimeout(reconnectTimer.current);
            reconnectTimer.current = null;
        }
    };

    const open = useCallback(() => {
        clearReconnect();
        const { close } = createRaceEventSource({
            onOpen: () => {
                setConnected(true);
                setLastError(undefined);
                opts.onOpen?.();
            },
            onClose: () => {
                setConnected(false);
                opts.onClose?.();
            },
            onError: (ev) => {
                setLastError('SSE connection error');
                opts.onError?.(ev);
                // programar reconexión si corresponde
                if (!connected && (opts.reconnectDelayMs ?? 0) > 0 && reconnectTimer.current === null) {
                    reconnectTimer.current = window.setTimeout(() => {
                        reconnectTimer.current = null;
                        open();
                    }, opts.reconnectDelayMs);
                }
            },
            onRaceUpdate: (payload) => {
                opts.onRaceUpdate?.(payload);
            },
            onPing: () => {
                opts.onPing?.();
            },
        });

        closerRef.current = close;
    }, [opts, connected]);

    const close = useCallback(() => {
        clearReconnect();
        closerRef.current?.();
        closerRef.current = null;
        setConnected(false);
    }, []);

    useEffect(() => {
        // abrir al montar
        open();
        return () => {
            close();
        };
    }, [open, close]);

    return {
        connected,
        lastError,
        close,
        reconnect: open,
    };
}
