import type { Millis } from '@/config/constants.js';

const MIN_REASONABLE_LAP_MS = 40_000 as Millis;   // 40s (depende del circuito)
const MAX_REASONABLE_LAP_MS = 180_000 as Millis;  // 3min

/**
 * Anomalía si:
 *  - viene marcada por la fuente (flag true), o
 *  - el tiempo está fuera de rangos razonables (sub 40s o > 3min).
 * Nota: Es puramente estática (sin histórico); si luego quieres detectar "picos"
 * por cambio porcentual, la función puede aceptar un `prevLapMs` opcional.
 */
export function detectAnomaly(
    lastLapMs: Millis,
    sourceFlag: boolean | undefined,
): boolean {
    if (sourceFlag === true) return true;
    const ms = Number(lastLapMs);
    if (ms < Number(MIN_REASONABLE_LAP_MS)) return true;
    if (ms > Number(MAX_REASONABLE_LAP_MS)) return true;
    return false;
}
