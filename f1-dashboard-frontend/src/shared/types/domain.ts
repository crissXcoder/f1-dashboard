// ====== Dominios base (calcan el backend) ======

// Equipos válidos
export type Team =
    | 'Ferrari'
    | 'Mercedes'
    | 'RedBull'
    | 'McLaren'
    | 'AstonMartin'
    | 'Alpine'
    | 'Williams'
    | 'RB'
    | 'Sauber'
    | 'Haas';

// Posiciones válidas 1..20
export type Position =
    | 1 | 2 | 3 | 4 | 5
    | 6 | 7 | 8 | 9 | 10
    | 11 | 12 | 13 | 14 | 15
    | 16 | 17 | 18 | 19 | 20;

// Marca nominal para milisegundos (evita confundir con number genérico)
declare const __millisBrand: unique symbol;
export type Millis = number & { readonly [__millisBrand]: 'ms' };

// Marca nominal para PilotId (string con identidad de piloto)
declare const __pilotIdBrand: unique symbol;
export type PilotId = string & { readonly [__pilotIdBrand]: 'pilotId' };

// ====== Listas y constantes útiles (solo lectura) ======
export const TEAMS: readonly Team[] = Object.freeze([
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
]);

export const MIN_POSITION: Position = 1;
export const MAX_POSITION: Position = 20;

// ====== Helpers de branding / guards ======
export function asMillis(n: number): Millis {
    if (!Number.isFinite(n) || n < 0) {
        throw new Error('Millis must be a non-negative finite number');
    }
    return n as Millis;
}

export function asPilotId(id: string): PilotId {
    const trimmed = id.trim();
    if (trimmed.length === 0) throw new Error('PilotId must be a non-empty string');
    return trimmed as PilotId;
}

// Type guards
export function isTeam(x: unknown): x is Team {
    return typeof x === 'string' && (TEAMS as readonly string[]).includes(x);
}

export function isPosition(x: unknown): x is Position {
    return Number.isInteger(x) && (x as number) >= 1 && (x as number) <= 20;
}

// ====== (Opcional) formateo simple de laps ======
function pad3(n: number): string {
    if (n < 10) return `00${n}`;
    if (n < 100) return `0${n}`;
    return String(n);
}

export function msToLapStr(ms: Millis): string {
    const totalMs = Number(ms);
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const millis = totalMs % 1000;
    const sec2 = seconds < 10 ? `0${seconds}` : String(seconds);
    return `${minutes}:${sec2}.${pad3(millis)}`;
}
