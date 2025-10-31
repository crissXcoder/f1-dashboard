import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';

import type { SampleInput } from '@/pipeline/types.js';

export interface SimulationStatus {
    readonly running: boolean;
    readonly periodMs?: number;
}

/**
 * Service OO que administra un Worker de simulación de muestras.
 * Emite eventos:
 *  - 'sample' -> (sample: SampleInput)
 *  - 'status' -> (status: SimulationStatus)
 *  - 'error'  -> (err: Error)
 */
export class SimulationService extends EventEmitter {
    private worker: Worker | null = null;
    private running = false;
    private periodMs = 2000;

    constructor() {
        super();
    }

    /** Indica si el worker está activo. */
    isRunning(): boolean {
        return this.running;
    }

    /** Periodo actual de generación (ms). */
    getPeriodMs(): number {
        return this.periodMs;
    }

    /**
     * Arranca el worker. En dev intenta cargar el .ts con el loader `tsx`.
     * En prod carga el .js compilado desde `dist/`.
     */
    start(periodMs?: number): void {
        if (this.worker) return; // ya corriendo
        if (typeof periodMs === 'number' && Number.isFinite(periodMs) && periodMs > 0) {
            this.periodMs = Math.floor(periodMs);
        }

        const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';

        // Ruta del worker:
        // - Dev: archivo TypeScript (necesita loader tsx en execArgv).
        // - Prod: archivo JavaScript compilado en dist (mismo layout de carpetas).
        const workerUrl = new URL(
            isDev
                ? '../infra/workers/simulator.worker.ts'
                : '../infra/workers/simulator.worker.js',
            import.meta.url,
        );

        this.worker = new Worker(workerUrl, {
            // `type` may be missing from some @types/node versions; cast to any to allow 'module'
            type: 'module',
            execArgv: isDev ? ['--loader', 'tsx'] : [], // permite .ts en dev sin bundlers
        } as any);

        this.worker.on('message', (msg: unknown) => {
            const m = msg as { type?: 'sample' | 'status'; payload?: unknown };
            if (!m || !m.type) return;

            if (m.type === 'sample') {
                const sample = m.payload as SampleInput;
                this.emit('sample', sample);
                return;
            }

            if (m.type === 'status') {
                const status = m.payload as SimulationStatus;
                this.running = status.running;
                if (typeof status.periodMs === 'number') {
                    this.periodMs = status.periodMs;
                }
                this.emit('status', status);
            }
        });

        this.worker.on('error', (err) => {
            this.emit('error', err);
        });

        this.worker.on('exit', (code) => {
            // Si sale inesperadamente, marcamos como no corriendo
            this.worker = null;
            this.running = false;
            this.emit('status', { running: false } satisfies SimulationStatus);
            if (code !== 0) {
                this.emit('error', new Error(`Simulation worker exited with code ${code}`));
            }
        });

        // Orden de inicio con periodo
        this.worker.postMessage({ cmd: 'start', periodMs: this.periodMs });
    }

    /** Detiene el worker si está activo. */
    stop(): void {
        if (!this.worker) return;
        try {
            this.worker.postMessage({ cmd: 'stop' });
        } catch {
            // ignorar
        }
        // Damos un pequeño tiempo y luego terminamos el worker si sigue vivo
        const w = this.worker;
        this.worker = null;
        this.running = false;

        // Terminar el worker (no bloqueante en la mayoría de casos)
        w.terminate().catch(() => undefined);
        this.emit('status', { running: false } satisfies SimulationStatus);
    }
}
