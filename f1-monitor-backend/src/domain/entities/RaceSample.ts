import type { PilotId, Position, Millis } from '@/domain/types/index.js';

/**
 * Snapshot inmutable de una muestra de carrera ya normalizada por el pipeline.
 * Mantiene consistencia: tiempos en ms, position en 1..20, points ≥ 0, ts en ms.
 */
export class RaceSample {
    readonly pilotId: PilotId;
    readonly position: Position;
    readonly lastLapMs: Millis;
    readonly points: number;
    readonly anomaly: boolean;
    readonly ts: Millis;

    constructor(params: {
        pilotId: PilotId;
        position: Position;
        lastLapMs: Millis;
        points: number;
        anomaly: boolean;
        ts: Millis;
    }) {
        const { pilotId, position, lastLapMs, points, anomaly, ts } = params;
        this.pilotId = pilotId;
        this.position = position;
        this.lastLapMs = lastLapMs;

        if (!Number.isFinite(points) || points < 0) {
            throw new Error('RaceSample.points must be a non-negative finite number');
        }
        this.points = points;

        this.anomaly = Boolean(anomaly);

        if (!Number.isFinite(Number(ts)) || Number(ts) < 0) {
            throw new Error('RaceSample.ts must be a non-negative Millis');
        }
        this.ts = ts;
    }
}
