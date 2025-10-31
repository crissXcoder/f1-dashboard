import type { Millis } from '@/config/constants.js';

function pad3(n: number): string {
  if (n < 10) return `00${n}`;
  if (n < 100) return `0${n}`;
  return String(n);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Convierte milisegundos a el formato de vuelta "M:SS.mmm".
 * Ej: 81345 ms -> "1:21.345"
 */
export function msToLapStr(ms: Millis): string {
  const totalMs = Number(ms);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const millis = totalMs % 1000;
  return `${minutes}:${pad2(seconds)}.${pad3(millis)}`;
}

/** Timestamp actual (ms) con branding de tipo Millis */
export function nowMs(): Millis {
  return Date.now() as Millis;
}
