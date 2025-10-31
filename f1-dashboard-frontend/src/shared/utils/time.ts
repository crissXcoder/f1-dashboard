import type { Millis } from '@/shared/types/domain';

function pad3(n: number): string {
    if (n < 10) return `00${n}`;
    if (n < 100) return `0${n}`;
    return String(n);
}

/** Timestamp actual en ms (brandeado). */
export function nowMs(): Millis {
    return Date.now() as Millis;
}

/** Convierte ms → "M:SS.mmm" (p. ej., 81345 → "1:21.345"). */
export function msToLapStr(ms: Millis): string {
    const totalMs = Number(ms);
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const millis = totalMs % 1000;
    const sec2 = seconds < 10 ? `0${seconds}` : String(seconds);
    return `${minutes}:${sec2}.${pad3(millis)}`;
}

/**
 * Convierte:
 *  - "81345" → 81345 ms
 *  - "M:SS.mmm" → ms
 *  - "SSS.mmm"  → ms
 */
export function lapStrToMs(s: string): Millis {
    const ss = s.trim();

    // Caso 1: sólo milisegundos
    if (/^[0-9]+$/.test(ss)) {
        const ms = Number.parseInt(ss, 10);
        if (!Number.isFinite(ms) || ms < 0) throw new Error(`Invalid millis: "${s}"`);
        return ms as Millis;
    }

    // Caso 2: M:SS.mmm
    if (/^[0-9]+:[0-9]{2}\.[0-9]{3}$/.test(ss)) {
        const [mmStr, rest] = ss.split(':');
        const [secStr, msStr] = rest.split('.');
        const minutes = Number.parseInt(mmStr, 10);
        const seconds = Number.parseInt(secStr, 10);
        const millis = Number.parseInt(msStr, 10);
        if ([minutes, seconds, millis].some(n => !Number.isFinite(n) || n < 0) || seconds > 59 || millis > 999) {
            throw new Error(`Invalid lap time: "${s}"`);
        }
        return (minutes * 60_000 + seconds * 1_000 + millis) as Millis;
    }

    // Caso 3: SSS.mmm (segundos con milésimas)
    if (/^[0-9]+(\.[0-9]{1,3})$/.test(ss)) {
        const [secPart, fracPart] = ss.split('.');
        const seconds = Number.parseInt(secPart, 10);
        const millis = Number.parseInt((fracPart + '000').slice(0, 3), 10);
        if (!Number.isFinite(seconds) || !Number.isFinite(millis) || seconds < 0) {
            throw new Error(`Invalid seconds format: "${s}"`);
        }
        return (seconds * 1_000 + millis) as Millis;
    }

    throw new Error(`Unsupported lap time format: "${s}"`);
}
