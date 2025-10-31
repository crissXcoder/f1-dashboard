/** Limpia espacios y colapsa interiores simples (sin mutilar nombres reales). */
export function sanitizeString(s: string): string {
    const trimmed = s.trim();
    // Colapsa espacios múltiples a uno solo, sin tocar diacríticos
    return trimmed.replace(/\s{2,}/g, ' ');
}

/** Convierte una cadena numérica a entero (lanza si no es entero válido). */
export function toInt(s: string): number {
    const n = Number.parseInt(s, 10);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
        throw new Error(`Invalid integer: "${s}"`);
    }
    return n;
}

/** Convierte una cadena numérica a float (lanza si no es número válido). */
export function toFloat(s: string): number {
    const n = Number.parseFloat(s);
    if (!Number.isFinite(n)) {
        throw new Error(`Invalid float: "${s}"`);
    }
    return n;
}
