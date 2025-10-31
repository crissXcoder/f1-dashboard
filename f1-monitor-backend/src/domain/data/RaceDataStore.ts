import { nowMs } from '@/utils/time.js';
import type { Millis, Position, Team } from '@/domain/types/index.js';
import { asPilotId, type PilotId } from '@/domain/types/index.js';
import { RingBuffer, type TimeStamped } from '@/domain/data/RingBuffer.js';
import { Pilot } from '@/domain/entities/Pilot.js';
import { RaceSample } from '@/domain/entities/RaceSample.js';

/**
 * Config de la store: tamaño del buffer por piloto.
 */
export interface RaceDataStoreConfig {
    readonly ringBufferCapacity: number;
}

/**
 * Estructura en memoria:
 * - pilots: PilotId -> Pilot
 * - samples: PilotId -> RingBuffer<RaceSample>
 * - teamIndex: Team -> Set<PilotId>
 */
export class RaceDataStore {
    private readonly pilots = new Map<PilotId, Pilot>();
    private readonly samples = new Map<PilotId, RingBuffer<RaceSample>>();
    private readonly teamIndex = new Map<Team, Set<PilotId>>();
    private readonly capacity: number;

    constructor(config: RaceDataStoreConfig) {
        this.capacity = config.ringBufferCapacity;
        if (!Number.isFinite(this.capacity) || this.capacity <= 0) {
            throw new Error('RaceDataStore.ringBufferCapacity must be > 0');
        }
    }

    /** Alta/actualización de piloto (crea RingBuffer si no existe). */
    upsertPilot(pilot: Pilot): void {
        const exists = this.pilots.get(pilot.id);
        this.pilots.set(pilot.id, pilot);

        // Índice por equipo
        if (exists && exists.team !== pilot.team) {
            // remover del equipo anterior
            const prevSet = this.teamIndex.get(exists.team);
            prevSet?.delete(pilot.id);
        }
        let set = this.teamIndex.get(pilot.team);
        if (!set) {
            set = new Set<PilotId>();
            this.teamIndex.set(pilot.team, set);
        }
        set.add(pilot.id);

        // Asegurar buffer
        if (!this.samples.has(pilot.id)) {
            this.samples.set(pilot.id, new RingBuffer<RaceSample>(this.capacity));
        }
    }

    /** True si la store conoce a este piloto. */
    hasPilot(id: PilotId): boolean {
        return this.pilots.has(id);
    }

    /** Obtiene un piloto por id. */
    getPilot(id: PilotId): Pilot | undefined {
        return this.pilots.get(id);
    }

    /** Lista de pilotos (copiada). */
    listPilots(): ReadonlyArray<Pilot> {
        return Array.from(this.pilots.values());
    }

    /** Lista de pilotos por equipo. */
    listPilotsByTeam(team: Team): ReadonlyArray<Pilot> {
        const set = this.teamIndex.get(team);
        if (!set) return [];
        const out: Pilot[] = [];
        for (const id of set) {
            const p = this.pilots.get(id);
            if (p) out.push(p);
        }
        return out;
    }

    /**
     * Añade una muestra al buffer del piloto; si el piloto no existe, lo crea con datos mínimos.
     * Útil para demos donde primero llegan muestras y luego el alta formal del piloto.
     */
    append(sample: RaceSample, fallbackPilot?: { name: string; team: Team }): void {
        // Asegurar piloto
        if (!this.pilots.has(sample.pilotId)) {
            if (!fallbackPilot) {
                throw new Error(`Unknown pilot "${sample.pilotId}" and no fallback provided`);
            }
            const pilot = new Pilot(sample.pilotId, fallbackPilot.name, fallbackPilot.team);
            this.upsertPilot(pilot);
        }

        let buf = this.samples.get(sample.pilotId);
        if (!buf) {
            buf = new RingBuffer<RaceSample>(this.capacity);
            this.samples.set(sample.pilotId, buf);
        }
        buf.push(sample);
    }

    /** Últimas muestras de un piloto dentro de una ventana de tiempo (ms). */
    getRecentByPilot(id: PilotId, windowMs: Millis): ReadonlyArray<RaceSample> {
        const buf = this.samples.get(id);
        if (!buf) return [];
        const cutoff = (Number(nowMs()) - Number(windowMs)) as Millis;
        return buf.since(cutoff);
    }

    /** Última muestra de un piloto. */
    getLatestByPilot(id: PilotId): RaceSample | undefined {
        return this.samples.get(id)?.last();
    }

    /**
     * Última muestra de todos los pilotos conocidos (puede faltar para algunos si aún no hay muestras).
     * Útil para renderizar el “estado actual” de la carrera.
     */
    getAllLatest(): ReadonlyArray<{ pilot: Pilot; latest: RaceSample | undefined }> {
        const out: Array<{ pilot: Pilot; latest: RaceSample | undefined }> = [];
        for (const pilot of this.pilots.values()) {
            out.push({ pilot, latest: this.samples.get(pilot.id)?.last() });
        }
        return out;
    }
}
