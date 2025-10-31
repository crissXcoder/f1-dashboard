import type { Millis, Position, Team } from '@/config/constants.js';

/**
 * Entrada cruda del POST /ingest.
 * Se valida para garantizar shape y dominios. Mantiene strings numéricos permitidos.
 */
export interface SampleInput {
    pilotId: string;                // id lógico (no vacío)
    pilotName: string;              // nombre limpio (no vacío)
    team: Team;                     // uno de los declarados en constants
    currentPosition: Position;      // 1..20
    lastLapTime: string;            // "M:SS.mmm" o "SSS.mmm" (también aceptamos "81345")
    currentRacePoints?: string;     // opcional: puntos crudos como string/num (se recalculan)
    anomalyDetected?: boolean;      // opcional: bandera pre-calculada desde la fuente
}

/**
 * Muestra procesada: tiempos normalizados a milisegundos,
 * puntos calculados por posición, y bandera de anomalía definida por heurística pura.
 */
export interface SampleProcessed {
    pilotId: string;
    pilotName: string;
    team: Team;
    position: Position;
    lastLapMs: Millis;              // tiempo de vuelta en ms (tipado)
    points: number;                 // puntos actuales (derivados de la posición)
    anomaly: boolean;               // resultado final de detección de anomalía
    ts: Millis;                     // timestamp asignado durante el proceso
}

/** Error de validación con path y mensaje legible. */
export interface ValidationError {
    path: string;
    message: string;
}

/** Resultado de validación genérico y fuertemente tipado. */
export type ValidationResult<T> =
    | { ok: true; value: T }
    | { ok: false; errors: ValidationError[] };
