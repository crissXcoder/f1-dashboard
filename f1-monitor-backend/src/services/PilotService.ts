import { RaceDataStore, type RaceDataStoreConfig } from '@/domain/data/RaceDataStore.js';
import { Pilot } from '@/domain/entities/Pilot.js';
import { RaceSample } from '@/domain/entities/RaceSample.js';
import { asPilotId, type Millis, type PilotId, type Position, type Team } from '@/domain/types/index.js';
import type { SampleProcessed } from '@/pipeline/types.js';

export class PilotService {
    private readonly store: RaceDataStore;

    constructor(config: RaceDataStoreConfig) {
        this.store = new RaceDataStore({ ringBufferCapacity: config.ringBufferCapacity });
    }

    /** Alta o actualización de un piloto (asegura índices y su RingBuffer). */
    upsertPilot(id: string, name: string, team: Team): void {
        const pilot = new Pilot(asPilotId(id), name, team);
        this.store.upsertPilot(pilot);
    }

    /** True si la store conoce a este piloto. */
    hasPilot(id: string): boolean {
        return this.store.hasPilot(asPilotId(id));
    }

    /** Obtiene un piloto por id (si existe). */
    getPilot(id: string): Pilot | undefined {
        return this.store.getPilot(asPilotId(id));
    }

    /** Lista todos los pilotos. */
    listPilots(): ReadonlyArray<Pilot> {
        return this.store.listPilots();
    }

    /** Lista pilotos por equipo. */
    listPilotsByTeam(team: Team): ReadonlyArray<Pilot> {
        return this.store.listPilotsByTeam(team);
    }

    /**
     * Inyecta una muestra procesada (del pipeline) al almacenamiento en memoria.
     * - Crea el piloto si no existe, usando (pilotName, team) como fallback.
     * - Devuelve la RaceSample creada para posible difusión (SSE) o logs.
     */
    ingestProcessedSample(sp: SampleProcessed): RaceSample {
        const sample = new RaceSample({
            pilotId: asPilotId(sp.pilotId),
            position: sp.position as Position,
            lastLapMs: sp.lastLapMs,
            points: sp.points,
            anomaly: sp.anomaly,
            ts: sp.ts,
        });

        this.store.append(sample, { name: sp.pilotName, team: sp.team });
        return sample;
    }

    /** Últimas muestras de un piloto dentro de una ventana (ms). */
    getRecentByPilot(pilotId: string, windowMs: Millis) {
        return this.store.getRecentByPilot(asPilotId(pilotId), windowMs);
    }

    /** Última muestra (si existe) de un piloto. */
    getLatestByPilot(pilotId: string) {
        return this.store.getLatestByPilot(asPilotId(pilotId));
    }

    /**
     * Última muestra de todos los pilotos conocidos + su entidad.
     * Útil para renderizar el “estado actual” (tabla de posiciones/puntos).
     */
    getAllLatest() {
        return this.store.getAllLatest();
    }

    /**
     * Vista agregada simple: “leaderboard” ordenado por puntos (desc),
     * usando la última muestra disponible de cada piloto.
     */
    getLeaderboard(): ReadonlyArray<{
        pilotId: PilotId;
        pilotName: string;
        team: Team;
        position?: Position;
        lastLapMs?: Millis;
        points: number;
        anomaly?: boolean;
        ts?: Millis;
    }> {
        const rows: Array<{
            pilotId: PilotId;
            pilotName: string;
            team: Team;
            position?: Position;
            lastLapMs?: Millis;
            points: number;
            anomaly?: boolean;
            ts?: Millis;
        }> = [];

        for (const { pilot, latest } of this.store.getAllLatest()) {
            const row: {
                pilotId: PilotId;
                pilotName: string;
                team: Team;
                position?: Position;
                lastLapMs?: Millis;
                points: number;
                anomaly?: boolean;
                ts?: Millis;
            } = {
                pilotId: pilot.id,
                pilotName: pilot.name,
                team: pilot.team,
                points: latest?.points ?? 0,
            };
            if (latest?.position !== undefined) row.position = latest.position;
            if (latest?.lastLapMs !== undefined) row.lastLapMs = latest.lastLapMs;
            if (latest?.anomaly !== undefined) row.anomaly = latest.anomaly;
            if (latest?.ts !== undefined) row.ts = latest.ts;
            rows.push(row);
        }

        rows.sort((a, b) => b.points - a.points);
        return rows;
    }
}
