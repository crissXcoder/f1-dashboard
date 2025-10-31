/**
 * TPSCounter mantiene un conteo por buckets de 1s dentro de una ventana móvil.
 * - O(1) por tick.
 * - Memoria acotada = windowSeconds buckets como máximo.
 */
export class TPSCounter {
    private readonly windowSeconds: number;
    private readonly buckets: Map<number, number>; // key = epochSeconds

    constructor(windowSeconds: number = 60) {
        if (!Number.isFinite(windowSeconds) || windowSeconds <= 0) {
            throw new Error('windowSeconds must be > 0');
        }
        this.windowSeconds = Math.floor(windowSeconds);
        this.buckets = new Map<number, number>();
    }

    /** Marca un evento (request procesado). */
    tick(nowMs: number = Date.now()): void {
        const sec = Math.floor(nowMs / 1000);
        const prev = this.buckets.get(sec) ?? 0;
        this.buckets.set(sec, prev + 1);
        this.prune(sec);
    }

    /** TPS estimado = total en ventana / windowSeconds. */
    getTPS(nowMs: number = Date.now()): number {
        const sec = Math.floor(nowMs / 1000);
        this.prune(sec);
        let total = 0;
        for (const v of this.buckets.values()) total += v;
        return total / this.windowSeconds;
    }

    /** Devuelve el total de eventos en la ventana. */
    getTotalInWindow(nowMs: number = Date.now()): number {
        const sec = Math.floor(nowMs / 1000);
        this.prune(sec);
        let total = 0;
        for (const v of this.buckets.values()) total += v;
        return total;
    }

    private prune(currentSec: number): void {
        const oldest = currentSec - this.windowSeconds + 1;
        for (const k of this.buckets.keys()) {
            if (k < oldest) this.buckets.delete(k);
        }
    }
}
