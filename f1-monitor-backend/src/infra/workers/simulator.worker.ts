import { parentPort } from 'worker_threads';
import { setInterval as setNodeInterval, clearInterval as clearNodeInterval } from 'timers';
import type { Team, Position } from '@/config/constants.js';
import type { SampleInput } from '@/pipeline/types.js';

// Aseguramos que existe parentPort (este archivo se ejecuta como worker)
if (!parentPort) {
    throw new Error('simulator.worker must be run as a worker thread');
}

// ----- Datos base para simulación -----
const TEAMS_SIM: readonly Team[] = [
    'Ferrari', 'Mercedes', 'RedBull', 'McLaren',
    'AstonMartin', 'Alpine', 'Williams', 'RB', 'Sauber', 'Haas',
];

interface PilotSeed {
    readonly pilotId: string;
    readonly pilotName: string;
    readonly team: Team;
}

const PILOTS: readonly PilotSeed[] = [
    { pilotId: 'lec16', pilotName: 'Charles Leclerc', team: 'Ferrari' },
    { pilotId: 'sai55', pilotName: 'Carlos Sainz', team: 'Ferrari' },
    { pilotId: 'ver33', pilotName: 'Max Verstappen', team: 'RedBull' },
    { pilotId: 'per11', pilotName: 'Sergio Pérez', team: 'RedBull' },
    { pilotId: 'ham44', pilotName: 'Lewis Hamilton', team: 'Mercedes' },
    { pilotId: 'rus63', pilotName: 'George Russell', team: 'Mercedes' },
    { pilotId: 'nor04', pilotName: 'Lando Norris', team: 'McLaren' },
    { pilotId: 'pia81', pilotName: 'Oscar Piastri', team: 'McLaren' },
];

/** Estado interno mínimo por piloto para oscilar tiempos. */
type PilotState = {
    lastLapMs: number; // usamos number sin marca; el branding se aplica en el pipeline
    position: Position;
};

const state: Map<string, PilotState> = new Map<string, PilotState>();

for (let i = 0; i < PILOTS.length; i += 1) {
    // tiempos base entre 78s y 92s
    const pilot = PILOTS[i]!; // afirmar que el elemento existe
    const base = 78_000 + Math.floor(Math.random() * 14_000);
    const pos = (i + 1) as Position;
    state.set(pilot.pilotId, { lastLapMs: base, position: pos });
}

// ----- Generación de muestras -----

function msToLapStrRaw(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    const sec2 = seconds < 10 ? `0${seconds}` : String(seconds);
    const mil3 = millis < 10 ? `00${millis}` : millis < 100 ? `0${millis}` : String(millis);
    return `${minutes}:${sec2}.${mil3}`;
}

/** Genera una muestra basada en el estado del piloto con pequeñas variaciones. */
function generateSample(seed: PilotSeed): SampleInput {
    const st = state.get(seed.pilotId)!;

    // Variación aleatoria pequeña ±600 ms, con ocasionales picos
    const jitter = Math.floor((Math.random() - 0.5) * 1200);
    let next = st.lastLapMs + jitter;

    // Anomalía ocasional ~2%: salto grande
    let anomaly = false;
    if (Math.random() < 0.02) {
        next += 4_000 + Math.floor(Math.random() * 2_000);
        anomaly = true;
    }

    // Asegura límites razonables
    if (next < 60_000) next = 60_000;
    if (next > 150_000) next = 150_000;

    st.lastLapMs = next;

    // Posición fluctúa levemente (1 paso) en ~10% de casos
    if (Math.random() < 0.1) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        const newPos = Math.min(20, Math.max(1, st.position + dir)) as Position;
        st.position = newPos;
    }

    const sample: SampleInput = {
        pilotId: seed.pilotId,
        pilotName: seed.pilotName,
        team: seed.team,
        currentPosition: st.position,
        lastLapTime: msToLapStrRaw(st.lastLapMs),
        // currentRacePoints opcional; el pipeline recalcula por posición
        anomalyDetected: anomaly,
    };
    return sample;
}

// ----- Loop de simulación -----

let timer: ReturnType<typeof setNodeInterval> | null = null;

function start(periodMs: number, pilots: readonly PilotSeed[]): void {
    stop();
    timer = setNodeInterval(() => {
        for (const p of pilots) {
            const sample = generateSample(p);
            // Enviamos la muestra al hilo principal
            parentPort!.postMessage({ type: 'sample', payload: sample });
        }
    }, periodMs);
}

function stop(): void {
    if (timer) {
        clearNodeInterval(timer);
        timer = null;
    }
}

// Comandos desde el hilo principal (iniciar/detener con periodo custom)
parentPort.on('message', (msg: unknown) => {
    const m = msg as { cmd?: 'start' | 'stop'; periodMs?: number };
    if (m && m.cmd === 'start') {
        const period = Number.isFinite(m.periodMs) && (m.periodMs as number) > 0 ? (m.periodMs as number) : 2_000;
        start(period, PILOTS);
        parentPort!.postMessage({ type: 'status', payload: { running: true, periodMs: period } });
        return;
    }
    if (m && m.cmd === 'stop') {
        stop();
        parentPort!.postMessage({ type: 'status', payload: { running: false } });
    }
});
