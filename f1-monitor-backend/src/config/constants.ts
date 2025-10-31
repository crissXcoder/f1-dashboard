// ====== Tipos de dominio (fuertemente tipados) ======
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

export type Position =
    | 1 | 2 | 3 | 4 | 5
    | 6 | 7 | 8 | 9 | 10
    | 11 | 12 | 13 | 14 | 15
    | 16 | 17 | 18 | 19 | 20;

// Marca nominal para milisegundos (evita confundir con number genérico)
declare const __millisBrand: unique symbol;
export type Millis = number & { readonly [__millisBrand]: 'ms' };

// ====== Constantes de dominio y del sistema ======
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

// Tamaño por defecto del ring buffer (muestras) y ventana histórica en ms
export const DEFAULT_RING_BUFFER_CAPACITY = 1_000; // ajustable
export const DEFAULT_HISTORY_WINDOW_MS: Millis = 5 * 60 * 1000 as Millis; // 5 min

// Límites razonables para validaciones de entorno
export const MIN_PORT = 1;
export const MAX_PORT = 65535;

export const DEFAULT_RATE_LIMIT_RPS = 20; // requests por segundo por IP (simple)
export const DEFAULT_PORT = 8080;
export const DEFAULT_CORS_ORIGIN = '*'; // Puede cambiarse por una origin concreta
