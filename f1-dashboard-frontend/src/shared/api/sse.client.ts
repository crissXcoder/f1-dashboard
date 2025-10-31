import { env } from '@/shared/config/env';
import type { RaceUpdateEventName, RaceUpdateEventPayload } from '@/shared/types/dto';

export interface RaceSSEHandlers {
    readonly onOpen?: () => void;
    readonly onError?: (ev: Event) => void;
    readonly onClose?: () => void;
    readonly onRaceUpdate?: (payload: RaceUpdateEventPayload) => void;
    readonly onPing?: () => void;
}

/**
 * Crea un EventSource al backend /sse.
 * Devuelve una función `close()` para cerrar la conexión limpiamente.
 */
export function createRaceEventSource(handlers: RaceSSEHandlers): { close: () => void } {
    const es = new EventSource(env.SSE_URL, { withCredentials: false });

    es.addEventListener('open', () => {
        handlers.onOpen?.();
    });

    es.addEventListener('error', (ev) => {
        handlers.onError?.(ev);
    });

    // Evento principal del backend: "race-update"
    es.addEventListener('race-update' satisfies RaceUpdateEventName, (ev) => {
        const e = ev as MessageEvent<string>;
        try {
            const payload = JSON.parse(e.data) as RaceUpdateEventPayload;
            handlers.onRaceUpdate?.(payload);
        } catch {
            // ignorar parse error, la conexión se mantiene
        }
    });

    // Heartbeats opcionales (comentarios ':' no llegan como event, pero si el backend emite 'ping' explícito)
    es.addEventListener('ping' satisfies RaceUpdateEventName, () => {
        handlers.onPing?.();
    });

    const close = () => {
        es.close();
        handlers.onClose?.();
    };

    return { close };
}
