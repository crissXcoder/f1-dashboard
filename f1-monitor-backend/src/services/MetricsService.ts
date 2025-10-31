import { TPSCounter } from '@/infra/metrics/tpsCounter.js';
import { LatencyTracker, type LatencySnapshot } from '@/infra/metrics/latencyTracker.js';

/**
 * Métricas básicas del servidor:
 *  - TPS (ventana móvil)
 *  - Latencia (mean, p50, p95) sobre las últimas N peticiones
 */
export class MetricsService {
    private readonly tps: TPSCounter;
    private readonly latency: LatencyTracker;

    constructor(params?: { tpsWindowSeconds?: number; latencyCapacity?: number }) {
        this.tps = new TPSCounter(params?.tpsWindowSeconds ?? 60);
        this.latency = new LatencyTracker(params?.latencyCapacity ?? 1024);
    }

    /** Marca un request atendido (para TPS). */
    tick(): void {
        this.tps.tick();
    }

    /** Registra latencia de un request (ms). */
    recordLatency(ms: number): void {
        this.latency.record(ms);
    }

    /** Métrica única de TPS (promedio en la ventana). */
    getTPS(): number {
        return this.tps.getTPS();
    }

    /** Snapshot de latencias. */
    getLatencySnapshot(): LatencySnapshot {
        return this.latency.snapshot();
    }

    /** Estructura lista para `/metrics` (JSON). */
    getMetrics(): {
        readonly tps: number;
        readonly latency: LatencySnapshot;
    } {
        return {
            tps: this.getTPS(),
            latency: this.getLatencySnapshot(),
        };
    }
}
