export interface LatencySnapshot {
    readonly mean: number;
    readonly p50: number;
    readonly p95: number;
    readonly count: number;
}

/**
 * Almacena las últimas N latencias (ms) en un ring buffer acotado.
 * - `record(ms)` O(1).
 * - `snapshot()` hace una copia y ordena para percentiles simples.
 */
export class LatencyTracker {
    private readonly capacity: number;
    private readonly buffer: Float64Array;
    private index = 0;
    private filled = 0;
    private sum = 0; // suma de valores actualmente en buffer

    constructor(capacity: number = 1024) {
        if (!Number.isFinite(capacity) || capacity <= 0) {
            throw new Error('capacity must be > 0');
        }
        this.capacity = Math.floor(capacity);
        this.buffer = new Float64Array(this.capacity);
    }

    record(ms: number): void {
        if (!Number.isFinite(ms) || ms < 0) return;
        // actualizar suma eliminando el valor expulsado si el buffer ya estaba lleno
        if (this.filled === this.capacity) {
            const old = this.buffer[this.index] ?? 0;
            this.sum -= old;
        } else {
            this.filled += 1;
        }
        this.buffer[this.index] = ms;
        this.sum += ms;

        this.index = (this.index + 1) % this.capacity;
    }

    snapshot(): LatencySnapshot {
        if (this.filled === 0) {
            return { mean: 0, p50: 0, p95: 0, count: 0 };
        }
        // Copiamos solo la porción utilizada
        const arr = Array.from(this.buffer.slice(0, this.filled));
        arr.sort((a, b) => a - b);

        const mean = this.sum / this.filled;
        const p50 = percentile(arr, 0.5);
        const p95 = percentile(arr, 0.95);

        return { mean, p50, p95, count: this.filled };
    }
}

function percentile(sortedAsc: number[], p: number): number {
    if (sortedAsc.length === 0) return 0;
    const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.floor(p * (sortedAsc.length - 1))));
    return sortedAsc[idx] ?? 0;
}
