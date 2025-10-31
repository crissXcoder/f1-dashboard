import crypto from 'crypto';
import type { ServerResponse } from 'http';
import { setInterval as setNodeInterval, clearInterval as clearNodeInterval } from 'timers';
import { applySSEHeaders } from '@/utils/response.js';
import type { SSEClient, SSEEvent } from '@/sse/types.js';

function writeLine(res: ServerResponse, line: string): void {
    // write no finaliza la respuesta; mantenemos el stream abierto
    res.write(`${line}\n`, 'utf8');
}

function writeEvent<T>(res: ServerResponse, e: SSEEvent<T>): void {
    writeLine(res, `event: ${e.event}`);
    writeLine(res, `data: ${JSON.stringify(e.data)}`);
    writeLine(res, ''); // línea en blanco separadora por protocolo SSE
}

/**
 * Hub SSE: administra suscriptores y permite difundir eventos en tiempo real.
 * - Aplica cabeceras SSE al suscribirse.
 * - Envía heartbeats para mantener viva la conexión en proxies intermedios.
 */
export class SSEHub {
    private readonly clients: Set<SSEClient> = new Set();
    private heartbeatTimer: ReturnType<typeof setNodeInterval> | null = null;

    constructor(
        private readonly heartbeatIntervalMs: number = 15_000, // 15s por defecto
    ) { }

    /** Suscribe un nuevo cliente y devuelve su id. */
    subscribe(res: ServerResponse): string {
        applySSEHeaders(res);
        const id = crypto.randomUUID();
        const client: SSEClient = { id, res };
        this.clients.add(client);

        // Mensaje inicial (opcional)
        writeLine(res, `id: ${id}`);
        writeEvent(res, { event: 'connected', data: { id } });

        // Si es el primer cliente, arrancamos heartbeats
        if (this.clients.size === 1) this.startHeartbeats();

        // Cierre del cliente: si la conexión se cierra, desuscribir
        res.on('close', () => {
            this.unsubscribeById(id);
        });

        return id;
    }

    /** Difunde un evento a todos los clientes conectados. */
    broadcast<T>(event: string, data: T): void {
        const payload: SSEEvent<T> = { event, data };
        for (const c of this.clients) {
            try {
                writeEvent(c.res, payload);
            } catch {
                // Si hubo error al escribir, desuscribir el cliente
                this.unsubscribeById(c.id);
            }
        }
    }

    /** Desuscribe un cliente por referencia de respuesta. */
    unsubscribe(res: ServerResponse): void {
        for (const c of this.clients) {
            if (c.res === res) {
                this.clients.delete(c);
                this.maybeStopHeartbeats();
                return;
            }
        }
    }

    /** Desuscribe un cliente por id. */
    unsubscribeById(id: string): void {
        for (const c of this.clients) {
            if (c.id === id) {
                // Intentamos cerrar limpiamente
                try {
                    writeEvent(c.res, { event: 'disconnected', data: { id } });
                } catch {
                    // ignorar
                }
                try {
                    c.res.end();
                } catch {
                    // ignorar
                }
                this.clients.delete(c);
                this.maybeStopHeartbeats();
                return;
            }
        }
    }

    /** Número de clientes conectados. */
    get size(): number {
        return this.clients.size;
    }

    private startHeartbeats(): void {
        if (this.heartbeatTimer) return;
        this.heartbeatTimer = setNodeInterval(() => {
            // Heartbeat estándar: comentario ":" o event "ping"
            for (const c of this.clients) {
                try {
                    writeLine(c.res, ': ping');
                    // Alternativamente:
                    // writeEvent(c.res, { event: 'ping', data: { ts: Date.now() } });
                } catch {
                    this.unsubscribeById(c.id);
                }
            }
        }, this.heartbeatIntervalMs);
    }

    private maybeStopHeartbeats(): void {
        if (this.clients.size > 0) return;
        if (this.heartbeatTimer) {
            clearNodeInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
}
