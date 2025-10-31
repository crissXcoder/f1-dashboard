import { nowMs } from '@/utils/time.js';
import type { Millis, Position, Team } from '@/config/constants.js';
import { validateSample } from '@/pipeline/validators/validateSample.js';
import type { SampleInput, SampleProcessed, ValidationResult } from '@/pipeline/types.js';
import { sanitizeString } from '@/pipeline/transforms/sanitize.js';
import { lapStrToMs } from '@/pipeline/transforms/normalizeTime.js';
import { pointsForPosition } from '@/pipeline/transforms/computePoints.js';
import { detectAnomaly } from '@/pipeline/transforms/detectAnomaly.js';

/**
 * Paso 1: Validar shape y dominios básicos.
 */
function stepValidate(input: unknown): ValidationResult<SampleInput> {
    return validateSample(input);
}

/**
 * Paso 2: Sanitizar strings (sin mutar semántica).
 */
function stepSanitize(value: SampleInput): SampleInput {
    return {
        pilotId: sanitizeString(value.pilotId),
        pilotName: sanitizeString(value.pilotName),
        team: value.team as Team,
        currentPosition: value.currentPosition as Position,
        lastLapTime: sanitizeString(value.lastLapTime),
        ...(value.currentRacePoints ? { currentRacePoints: sanitizeString(value.currentRacePoints) } : {}),
        ...(value.anomalyDetected !== undefined ? { anomalyDetected: value.anomalyDetected } : {}),
    };
}

/**
 * Paso 3: Normalizar tiempo de vuelta a milisegundos.
 */
function stepNormalizeTime(value: SampleInput): { value: SampleInput; lastLapMs: Millis } {
    const lastLapMs = lapStrToMs(value.lastLapTime);
    return { value, lastLapMs };
}

/**
 * Paso 4: Calcular puntos (derivado de la posición actual).
 */
function stepComputePoints(position: Position): number {
    return pointsForPosition(position);
}

/**
 * Paso 5: Detectar anomalía (rangos razonables y/o flag de fuente).
 */
function stepDetectAnomaly(lastLapMs: Millis, sourceFlag: boolean | undefined): boolean {
    return detectAnomaly(lastLapMs, sourceFlag);
}

/**
 * Orquestador puro del pipeline:
 * input (unknown) -> validate -> sanitize -> normalizeTime -> computePoints -> detectAnomaly -> SampleProcessed
 */
export function processIncomingSample(input: unknown): ValidationResult<SampleProcessed> {
    const v = stepValidate(input);
    if (!v.ok) return v;

    const sanitized = stepSanitize(v.value);
    const { lastLapMs } = stepNormalizeTime(sanitized);
    const points = stepComputePoints(sanitized.currentPosition);
    const anomaly = stepDetectAnomaly(lastLapMs, sanitized.anomalyDetected);

    const processed: SampleProcessed = {
        pilotId: sanitized.pilotId,
        pilotName: sanitized.pilotName,
        team: sanitized.team,
        position: sanitized.currentPosition,
        lastLapMs,
        points,
        anomaly,
        ts: nowMs(),
    };

    return { ok: true, value: processed };
}
