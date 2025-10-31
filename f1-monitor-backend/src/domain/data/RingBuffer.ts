import type { Millis } from '@/domain/types/index.js';

/** Restricción para items que contienen timestamp en ms (Millis). */
export interface TimeStamped {
    readonly ts: Millis;
}

/**
 * RingBuffer eficiente y acotado para mantener los últimos N elementos.
 * - Inserción O(1).
 * - Memoria fija (capacity).
 * - Iteración en orden cronológico (del más antiguo al más reciente).
 */
export class RingBuffer<T extends TimeStamped> {
    private readonly buf: Array<T | undefined>;
    private readonly capacity: number;
    private head = 0;     // índice donde se insertará el siguiente elemento
    private filled = 0;   // cuántos elementos válidos hay (<= capacity)

    constructor(capacity: number) {
        if (!Number.isFinite(capacity) || capacity <= 0) {
            throw new Error('RingBuffer capacity must be > 0');
        }
        this.capacity = Math.floor(capacity);
        this.buf = new Array<T | undefined>(this.capacity);
    }

    /** Inserta un elemento (si está lleno, sobrescribe el más antiguo). */
    push(item: T): void {
        this.buf[this.head] = item;
        this.head = (this.head + 1) % this.capacity;
        if (this.filled < this.capacity) this.filled += 1;
    }

    /** Devuelve los elementos en orden del más antiguo al más reciente. */
    toArray(): ReadonlyArray<T> {
        if (this.filled === 0) return [];
        const out = new Array<T>(this.filled);
        const start = (this.head - this.filled + this.capacity) % this.capacity;
        for (let i = 0; i < this.filled; i += 1) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            out[i] = this.buf[(start + i) % this.capacity]!;
        }
        return out;
    }

    /** Filtra elementos cuyo `ts` sea >= `sinceTs` (orden cronológico). */
    since(sinceTs: Millis): ReadonlyArray<T> {
        const arr = this.toArray();
        if (arr.length === 0) return arr;
        // Búsqueda lineal (N pequeño). Si capacity grande, se puede optimizar por binaria.
        const out: T[] = [];
        const min = Number(sinceTs);
        for (const item of arr) {
            if (Number(item.ts) >= min) out.push(item);
        }
        return out;
    }

    /** Último elemento (más reciente) o undefined si vacío. */
    last(): T | undefined {
        if (this.filled === 0) return undefined;
        const idx = (this.head - 1 + this.capacity) % this.capacity;
        return this.buf[idx];
    }

    /** Cantidad de elementos válidos actualmente. */
    size(): number {
        return this.filled;
    }

    /** Si el buffer ya alcanzó su capacidad total. */
    isFull(): boolean {
        return this.filled === this.capacity;
    }
}
