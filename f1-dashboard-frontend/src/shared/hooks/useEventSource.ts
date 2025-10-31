import { useEffect, useRef, useState, useCallback } from 'react';
import type { RaceUpdateEventPayload } from '@/shared/types/dto';
import { createRaceEventSource } from '@/shared/api/sse.client';

export interface UseEventSourceOptions {
    /** Habilita/inhabilita la suscripción. Default: true */
    readonly enabled?: boolean;

    /** Callbacks opcionales (se leen desde refs para evitar cierres obsoletos) */
    readonly onOpen?: () => void;
    readonly onClose?: () => void;
    readonly onError?: (ev: Event) => void;
    readonly onRaceUpdate?: (payload: RaceUpdateEventPayload) => void;
    readonly onPing?: () => void;

    /**
     * Reintentos automáticos con backoff exponencial.
     * retryBaseMs: 1000 ms por defecto; retryMaxMs: 30000 ms por defecto.
     * Si retryBaseMs = 0 => sin reintentos automáticos.
     */
    readonly retryBaseMs?: number;
    readonly retryMaxMs?: number;
}

/**
 * Hook SSE robusto:
 * - Asegura UNA sola conexión activa.
 * - Backoff exponencial al fallar (con techo).
 * - Reconecta al volver la pestaña a visible.
 * - Evita dependencias inestables (usa refs para callbacks y flags).
 */
export function useEventSource(opts: UseEventSourceOptions = {}) {
    const {
        enabled = true,
        onOpen,
        onClose,
        onError,
        onRaceUpdate,
        onPing,
        retryBaseMs = 1000,
        retryMaxMs = 30000,
    } = opts;

    const [connected, setConnected] = useState<boolean>(false);
    const [lastError, setLastError] = useState<string | undefined>(undefined);

    /** Refs para estado/handlers estables */
    const connectedRef = useRef<boolean>(false);
    const openRef = useRef<(() => void) | null>(null);
    const closeRef = useRef<(() => void) | null>(null);

    const onOpenRef = useRef(onOpen);
    const onCloseRef = useRef(onClose);
    const onErrorRef = useRef(onError);
    const onRaceUpdateRef = useRef(onRaceUpdate);
    const onPingRef = useRef(onPing);

    useEffect(() => { onOpenRef.current = onOpen; }, [onOpen]);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);
    useEffect(() => { onRaceUpdateRef.current = onRaceUpdate; }, [onRaceUpdate]);
    useEffect(() => { onPingRef.current = onPing; }, [onPing]);

    /** Timers y backoff */
    const reconnectTimerRef = useRef<number | null>(null);
    const backoffRef = useRef<number>(Math.max(0, retryBaseMs));

    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current !== null) {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    }, []);

    const scheduleReconnect = useCallback(() => {
        // Sin reintentos configurados o hook deshabilitado → nada
        if (!enabled || retryBaseMs <= 0) return;

        // No reconectar si ya hay conexión viva
        if (connectedRef.current) return;

        // Evita programar múltiples timers
        if (reconnectTimerRef.current !== null) return;

        // Solo reconectar si la pestaña está visible
        if (document.visibilityState !== 'visible') return;

        const delay = Math.min(backoffRef.current, retryMaxMs);
        reconnectTimerRef.current = window.setTimeout(() => {
            reconnectTimerRef.current = null;
            // Doble chequeo antes de abrir
            if (!connectedRef.current && enabled && typeof openRef.current === 'function') {
                openRef.current();
            }
        }, delay);

        // Exponencial con techo
        backoffRef.current = Math.min(delay * 2, retryMaxMs);
    }, [enabled, retryBaseMs, retryMaxMs]);

    const handleOpened = useCallback(() => {
        connectedRef.current = true;
        setConnected(true);
        setLastError(undefined);
        backoffRef.current = Math.max(0, retryBaseMs); // reset backoff
        onOpenRef.current?.();
    }, [retryBaseMs]);

    const handleClosed = useCallback(() => {
        connectedRef.current = false;
        setConnected(false);
        onCloseRef.current?.();
    }, []);

    const handleErrored = useCallback((ev: Event) => {
        // Marca error, cierra (si no se cerró ya) y programa reconexión con backoff
        setLastError('SSE connection error');
        onErrorRef.current?.(ev);

        // Si hay un "close()" propio del cliente, úsalo antes de reintentar
        if (typeof closeRef.current === 'function') {
            try { closeRef.current(); } catch { /* ignore */ }
            closeRef.current = null;
        }

        connectedRef.current = false;
        setConnected(false);
        scheduleReconnect();
    }, [scheduleReconnect]);

    /** Abre una sola conexión. Evita deps inestables: no dependas de opts completos. */
    const open = useCallback(() => {
        // Evita múltiples aperturas
        if (connectedRef.current || typeof closeRef.current === 'function') return;

        // Limpia un posible timer previo
        clearReconnectTimer();

        // Crea la conexión con el cliente de la app
        const { close } = createRaceEventSource({
            onOpen: handleOpened,
            onClose: handleClosed,
            onError: handleErrored,
            onRaceUpdate: (payload) => onRaceUpdateRef.current?.(payload),
            onPing: () => onPingRef.current?.(),
        });

        closeRef.current = () => {
            try { close(); } catch { /* ignore */ }
            closeRef.current = null;
        };
    }, [clearReconnectTimer, handleOpened, handleClosed, handleErrored]);

    // Guarda la referencia a open para que scheduleReconnect la use sin re-crear
    useEffect(() => {
        openRef.current = open;
    }, [open]);

    /** Cierra explícitamente la conexión y cancela reintentos */
    const close = useCallback(() => {
        clearReconnectTimer();
        if (typeof closeRef.current === 'function') {
            try { closeRef.current(); } catch { /* ignore */ }
            closeRef.current = null;
        }
        connectedRef.current = false;
        setConnected(false);
    }, [clearReconnectTimer]);

    /** Efecto principal: conectar / desconectar según `enabled` */
    useEffect(() => {
        if (!enabled) {
            // Si se deshabilita, cerrar todo
            close();
            return;
        }
        // Si se habilita, abrir (una vez)
        open();
        return () => {
            // Unmount: limpiar timers y conexión
            clearReconnectTimer();
            if (typeof closeRef.current === 'function') {
                try { closeRef.current(); } catch { /* ignore */ }
                closeRef.current = null;
            }
            connectedRef.current = false;
            setConnected(false);
        };
    }, [enabled, open, close, clearReconnectTimer]);

    /** Reconectar cuando la pestaña vuelve a visible */
    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === 'visible' && enabled && !connectedRef.current) {
                backoffRef.current = Math.max(0, retryBaseMs);
                if (typeof openRef.current === 'function') {
                    openRef.current();
                }
            }
        };
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, [enabled, retryBaseMs]);

    /** Exponer helpers */
    const reconnect = useCallback(() => {
        clearReconnectTimer();
        // Forzar cierre de la actual (si existiera) y abrir de inmediato con backoff reiniciado
        backoffRef.current = Math.max(0, retryBaseMs);
        if (typeof closeRef.current === 'function') {
            try { closeRef.current(); } catch { /* ignore */ }
            closeRef.current = null;
        }
        connectedRef.current = false;
        setConnected(false);
        if (enabled && typeof openRef.current === 'function') openRef.current();
    }, [enabled, clearReconnectTimer, retryBaseMs]);

    return {
        connected,
        lastError,
        close,
        reconnect,
    };
}
