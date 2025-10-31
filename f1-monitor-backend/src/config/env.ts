import { DEFAULT_CORS_ORIGIN, DEFAULT_HISTORY_WINDOW_MS, DEFAULT_PORT, DEFAULT_RATE_LIMIT_RPS, MAX_PORT, MIN_PORT } from './constants';
import type { Millis } from './constants.ts'; // También aquí, ya que es una importación del mismo archivo.
// ========= Utilidades de parseo/validación (nativas) =========

function isFiniteInteger(n: number): boolean {
    return Number.isFinite(n) && Number.isInteger(n);
}

function parseIntStrict(value: string | undefined, defaultValue: number, min?: number, max?: number): number {
    if (value === undefined || value.trim() === '') return defaultValue;
    const parsed = Number.parseInt(value, 10);
    if (!isFiniteInteger(parsed)) {
        throw new Error(`Invalid integer env value: "${value}"`);
    }
    if (min !== undefined && parsed < min) {
        throw new Error(`Env integer below minimum (${min}): ${parsed}`);
    }
    if (max !== undefined && parsed > max) {
        throw new Error(`Env integer above maximum (${max}): ${parsed}`);
    }
    return parsed;
}

function parseMillis(value: string | undefined, defaultValue: Millis, min?: number, max?: number): Millis {
    if (value === undefined || value.trim() === '') return defaultValue;
    const parsed = Number.parseInt(value, 10);
    if (!isFiniteInteger(parsed)) {
        throw new Error(`Invalid millis env value: "${value}"`);
    }
    if (min !== undefined && parsed < min) {
        throw new Error(`Millis below minimum (${min}): ${parsed}`);
    }
    if (max !== undefined && parsed > max) {
        throw new Error(`Millis above maximum (${max}): ${parsed}`);
    }
    return parsed as Millis;
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined || value.trim() === '') return defaultValue;
    const v = value.toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes') return true;
    if (v === 'false' || v === '0' || v === 'no') return false;
    throw new Error(`Invalid boolean env value: "${value}"`);
}

function isValidCorsOrigin(origin: string): boolean {
    if (origin === '*') return true;
    // permitimos una lista separada por comas de origins válidos (http/https)
    const items = origin.split(',').map(s => s.trim()).filter(Boolean);
    if (items.length === 0) return false;
    return items.every(item => {
        try {
            const u = new URL(item);
            return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
            return false;
        }
    });
}

// ========= Interfaz de configuración =========

export interface Config {
    readonly PORT: number;
    readonly CORS_ORIGIN: string;        // '*' o lista separada por comas
    readonly RATE_LIMIT_RPS: number;     // rate limit simple por IP
    readonly HISTORY_WINDOW_MS: Millis;  // ventana de histórico en memoria
    readonly RING_BUFFER_CAPACITY: number;
    readonly METRICS_ENABLED: boolean;
    readonly NODE_ENV: 'development' | 'test' | 'production' | 'staging' | 'other';
}

// ========= Lectura y validación de variables =========

const rawPort = process.env.PORT;
const rawCors = process.env.CORS_ORIGIN;
const rawRate = process.env.RATE_LIMIT_RPS;
const rawHistory = process.env.HISTORY_WINDOW_MS;
const rawCapacity = process.env.RING_BUFFER_CAPACITY;
const rawMetrics = process.env.METRICS_ENABLED;
const rawEnv = process.env.NODE_ENV;

const PORT = parseIntStrict(rawPort, DEFAULT_PORT, MIN_PORT, MAX_PORT);

const CORS_ORIGIN = ((): string => {
    const candidate = (rawCors ?? DEFAULT_CORS_ORIGIN).trim();
    if (!isValidCorsOrigin(candidate)) {
        throw new Error(`Invalid CORS_ORIGIN: "${candidate}". Use "*" or comma-separated http(s) origins.`);
    }
    return candidate;
})();

const RATE_LIMIT_RPS = parseIntStrict(rawRate, DEFAULT_RATE_LIMIT_RPS, 1, 10_000);
const HISTORY_WINDOW_MS = parseMillis(rawHistory, DEFAULT_HISTORY_WINDOW_MS, 1_000, 24 * 60 * 60 * 1000 as number);
const RING_BUFFER_CAPACITY = parseIntStrict(rawCapacity, 1_000, 10, 1_000_000);
const METRICS_ENABLED = parseBoolean(rawMetrics, true);

const NODE_ENV: Config['NODE_ENV'] = ((): Config['NODE_ENV'] => {
    const v = (rawEnv ?? 'development').toLowerCase();
    if (v === 'development' || v === 'test' || v === 'production' || v === 'staging') return v;
    return 'other';
})();

// ========= Objeto de configuración inmutable =========

export const config: Readonly<Config> = Object.freeze({
    PORT,
    CORS_ORIGIN,
    RATE_LIMIT_RPS,
    HISTORY_WINDOW_MS,
    RING_BUFFER_CAPACITY,
    METRICS_ENABLED,
    NODE_ENV,
});
