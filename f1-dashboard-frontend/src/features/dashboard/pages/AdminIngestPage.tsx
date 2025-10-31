import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { createPilot, ingestRaceEvent } from '@/shared/api/admin.api';
import type { PilotCreateDto } from '@/shared/types/pilots.dto';
import type { IngestEventDto } from '@/shared/types/ingest.dto';

type Busy = 'idle' | 'creatingPilot' | 'ingesting';

const cardClass =
    'rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-xl shadow-black/30';

// Opciones de escuderías (UI). Envío sigue usando la propiedad `team`.
const SCUDERIAS = [
    'Ferrari',
    'Mercedes',
    'RedBull',
    'McLaren',
    'AstonMartin',
    'Alpine',
    'Williams',
    'RB',
    'Sauber',
    'Haas',
] as const;

export default function AdminIngestPage() {
    const [busy, setBusy] = useState<Busy>('idle');

    // ---- Form: Crear Piloto ----
    const [pilot, setPilot] = useState<PilotCreateDto>({
        id: '',
        name: '',
        team: '',
    });

    const pilotValid = useMemo(
        () =>
            pilot.id.trim().length >= 2 &&
            pilot.name.trim().length >= 3 &&
            pilot.team.trim().length >= 2,
        [pilot]
    );

    const submitPilot = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!pilotValid) {
                toast.error('Completa id, nombre y escudería.');
                return;
            }
            setBusy('creatingPilot');
            try {
                const res = await createPilot(pilot);
                if (res.ok) {
                    toast.success(`Piloto ${pilot.name} creado.`);
                    setPilot({ id: '', name: '', team: '' });
                } else {
                    toast.error(res.error?.message ?? 'Error creando piloto');
                }
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Error creando piloto');
            } finally {
                setBusy('idle');
            }
        },
        [pilot, pilotValid]
    );

    // ---- Form: Ingestar Evento ----
    const [eventDto, setEventDto] = useState<IngestEventDto>({
        pilotId: '',
        pilotName: '',
        team: '',
        currentPosition: 1,
        lastLapTime: '1:21.000',
        anomalyDetected: false,
    });

    const eventValid = useMemo(() => {
        const okId = eventDto.pilotId.trim().length >= 2;
        const okName = eventDto.pilotName.trim().length >= 3;
        const okTeam = eventDto.team.trim().length >= 2;
        const okPos = Number.isFinite(eventDto.currentPosition) && eventDto.currentPosition > 0;
        const okLap = /^(\d+):([0-5]?\d)\.\d{3}$/.test(eventDto.lastLapTime.trim());
        return okId && okName && okTeam && okPos && okLap;
    }, [eventDto]);

    const submitIngest = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!eventValid) {
                toast.error(
                    'Revisa los campos. Formato de vuelta: M:SS.mmm (ej. 1:21.345) y posición > 0.'
                );
                return;
            }
            setBusy('ingesting');
            try {
                const res = await ingestRaceEvent(eventDto);
                if (res.ok) {
                    toast.success('Evento ingerido. Revisa el Leaderboard (SSE).');
                    setEventDto((prev) => ({
                        ...prev,
                        currentPosition: 1,
                        lastLapTime: '1:21.000',
                        anomalyDetected: false,
                    }));
                } else {
                    toast.error(res.error?.message ?? 'Error al ingerir evento');
                }
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Error al ingerir evento');
            } finally {
                setBusy('idle');
            }
        },
        [eventDto, eventValid]
    );

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 text-neutral-200">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Administración — Alta de Pilotos &amp; Ingesta de Eventos
                </h1>
                <p className="mt-2 text-sm text-neutral-400">
                    Crea pilotos en el catálogo y publica eventos de carrera que se
                    propagan al Leaderboard por SSE.
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Card: Crear Piloto */}
                <section className={cardClass}>
                    <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                        <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                        Crear Piloto
                    </h2>

                    <form onSubmit={submitPilot} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm text-neutral-300" htmlFor="pilot-id">
                                ID
                            </label>
                            <input
                                id="pilot-id"
                                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="lec16"
                                value={pilot.id}
                                onChange={(e) => setPilot((p) => ({ ...p, id: e.target.value }))}
                                required
                            />
                            <p className="mt-1 text-xs text-neutral-500">
                                Identificador único (min 2 caracteres).
                            </p>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm text-neutral-300" htmlFor="pilot-name">
                                Nombre
                            </label>
                            <input
                                id="pilot-name"
                                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Charles Leclerc"
                                value={pilot.name}
                                onChange={(e) => setPilot((p) => ({ ...p, name: e.target.value }))}
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm text-neutral-300" htmlFor="pilot-team">
                                Escudería
                            </label>
                            <select
                                id="pilot-team"
                                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                                value={pilot.team}
                                onChange={(e) => setPilot((p) => ({ ...p, team: e.target.value }))}
                                required
                            >
                                <option value="" disabled>
                                    Selecciona una escudería…
                                </option>
                                {SCUDERIAS.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={!pilotValid || busy !== 'idle'}
                                className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-500 disabled:opacity-50"
                            >
                                {busy === 'creatingPilot' ? 'Creando…' : 'Crear piloto'}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Card: Ingestar Evento */}
                <section className={cardClass}>
                    <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        Ingestar Evento de Carrera
                    </h2>

                    <form onSubmit={submitIngest} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm text-neutral-300" htmlFor="event-pilot-id">
                                    Pilot ID
                                </label>
                                <input
                                    id="event-pilot-id"
                                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="lec16"
                                    value={eventDto.pilotId}
                                    onChange={(e) => setEventDto((p) => ({ ...p, pilotId: e.target.value }))}
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-neutral-300" htmlFor="event-position">
                                    Posición
                                </label>
                                <input
                                    id="event-position"
                                    type="number"
                                    min={1}
                                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={eventDto.currentPosition}
                                    onChange={(e) =>
                                        setEventDto((p) => ({
                                            ...p,
                                            currentPosition: Number(e.target.value || 1),
                                        }))
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-neutral-300" htmlFor="event-pilot-name">
                                    Nombre
                                </label>
                                <input
                                    id="event-pilot-name"
                                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Charles Leclerc"
                                    value={eventDto.pilotName}
                                    onChange={(e) => setEventDto((p) => ({ ...p, pilotName: e.target.value }))}
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-neutral-300" htmlFor="event-team">
                                    Escudería
                                </label>
                                <select
                                    id="event-team"
                                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={eventDto.team}
                                    onChange={(e) => setEventDto((p) => ({ ...p, team: e.target.value }))}
                                    required
                                >
                                    <option value="" disabled>
                                        Selecciona una escudería…
                                    </option>
                                    {SCUDERIAS.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-neutral-300" htmlFor="event-last-lap">
                                    Última vuelta (M:SS.mmm)
                                </label>
                                <input
                                    id="event-last-lap"
                                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="1:21.345"
                                    value={eventDto.lastLapTime}
                                    onChange={(e) => setEventDto((p) => ({ ...p, lastLapTime: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-5">
                                <input
                                    id="anomaly"
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={eventDto.anomalyDetected}
                                    onChange={(e) => setEventDto((p) => ({ ...p, anomalyDetected: e.target.checked }))}
                                />
                                <label htmlFor="anomaly" className="text-sm text-neutral-300">
                                    Anomalía detectada
                                </label>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={!eventValid || busy !== 'idle'}
                                className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                            >
                                {busy === 'ingesting' ? 'Enviando…' : 'Ingestar evento'}
                            </button>
                        </div>

                        <p className="pt-2 text-xs text-neutral-500">
                            *Recuerda: /ingest <strong>no</strong> crea pilotos; para eso usa el formulario de la
                            izquierda.
                        </p>
                    </form>
                </section>
            </div>
        </div>
    );
}
