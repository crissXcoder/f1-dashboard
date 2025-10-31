import type { Millis } from '@/config/constants.js';

/**
 * Rellena a 3 dígitos (milisegundos).
 */
function pad3(n: number): string {
    if (n < 10) return `00${n}`;
    if (n < 100) return `0${n}`;
    return String(n);
}

/**
 * Convierte un string de tiempo de vuelta a milisegundos (Millis).
 * Formatos soportados:
 *  - "81345"                  → milisegundos crudos
 *  - "M:SS.mmm"               → minutos:segundos.milisegundos
 *  - "SSS.mmm"                → segundos.milisegundos
 *
 * Lanza Error si el formato no es válido.
 */
export function lapStrToMs(s: string): Millis {
    const ss = s.trim();

    // Caso 1: milisegundos crudos "81345"
    if (/^[0-9]+$/.test(ss)) {
        const ms = Number.parseInt(ss, 10);
        if (!Number.isFinite(ms) || ms < 0) throw new Error(`Invalid millis: "${s}"`);
        return ms as Millis;
    }

    // Caso 2: "M:SS.mmm"  -> grupos: minutes, seconds, millis
    // Aseguramos seconds en [00..59] y millis en exactamente 3 dígitos.
    {
        const re = /^(\d+):([0-5]\d)\.(\d{3})$/;
        const match = re.exec(ss);
        if (match) {
            const minutes = Number.parseInt(match[1]!, 10);
            const seconds = Number.parseInt(match[2]!, 10);
            const millis = Number.parseInt(match[3]!, 10);

            if (
                [minutes, seconds, millis].some(n => !Number.isFinite(n) || n < 0) ||
                seconds > 59 || millis > 999
            ) {
                throw new Error(`Invalid lap time: "${s}"`);
            }
            return (minutes * 60_000 + seconds * 1_000 + millis) as Millis;
        }
    }

    // Caso 3: "SSS.mmm"  -> grupos: seconds, frac(1..3)
    {
        const re = /^(\d+)\.(\d{1,3})$/;
        const match = re.exec(ss);
        if (match) {
            const seconds = Number.parseInt(match[1]!, 10);
            // normalizamos la fracción a 3 dígitos a la derecha
            const frac = (match[2]! + '000').slice(0, 3);
            const millis = Number.parseInt(frac, 10);

            if (!Number.isFinite(seconds) || seconds < 0 || !Number.isFinite(millis)) {
                throw new Error(`Invalid seconds format: "${s}"`);
            }
            return (seconds * 1_000 + millis) as Millis;
        }
    }

    throw new Error(`Unsupported lap time format: "${s}"`);
}

/**
 * Utilidad inversa: ms → "M:SS.mmm"
 * (Ya tienes una versión en utils/time.ts; esta se mantiene aquí por conveniencia
 * en tests del pipeline. Si prefieres evitar duplicidad, importa desde utils/time.ts.)
 */
export function msToLapStr(ms: Millis): string {
    const totalMs = Number(ms);
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const millis = totalMs % 1000;
    const sec2 = seconds < 10 ? `0${seconds}` : String(seconds);
    return `${minutes}:${sec2}.${pad3(millis)}`;
}
