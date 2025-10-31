type Level = 'info' | 'error' | 'access' | 'debug';

interface BaseLog {
    readonly ts: number;   // epoch ms
    readonly level: Level;
    readonly msg: string;
}

interface AccessLog extends BaseLog {
    readonly route: string;
    readonly method: string;
    readonly status: number;
    readonly durationMs: number;
    readonly ip?: string;
}

interface ErrorLog extends BaseLog {
    readonly stack?: string;
    readonly code?: string;
}

function jsonLine(obj: Record<string, unknown>): string {
    return JSON.stringify(obj);
}

export function logInfo(msg: string, extra?: Record<string, unknown>): void {
    const line = jsonLine({
        ts: Date.now(),
        level: 'info',
        msg,
        ...(extra ?? {}),
    });
    // eslint-disable-next-line no-console
    console.log(line);
}

export function logDebug(msg: string, extra?: Record<string, unknown>): void {
    const line = jsonLine({
        ts: Date.now(),
        level: 'debug',
        msg,
        ...(extra ?? {}),
    });
    // eslint-disable-next-line no-console
    console.log(line);
}

export function logError(msg: string, err?: { stack?: string; code?: string }, extra?: Record<string, unknown>): void {
    const payload: ErrorLog = {
        ts: Date.now(),
        level: 'error',
        msg,
        ...(err?.stack !== undefined ? { stack: err.stack } : {}),
        ...(err?.code !== undefined ? { code: err.code } : {}),
    };
    const line = jsonLine({ ...payload, ...(extra ?? {}) });
    // eslint-disable-next-line no-console
    console.error(line);
}

export function logAccess(params: {
    route: string;
    method: string;
    status: number;
    durationMs: number;
    ip?: string;
    extra?: Record<string, unknown>;
}): void {
    const p: AccessLog = {
        ts: Date.now(),
        level: 'access',
        msg: 'request',
        route: params.route,
        method: params.method,
        status: params.status,
        durationMs: params.durationMs,
        ...(params.ip !== undefined ? { ip: params.ip } : {}),
    };
    const line = jsonLine({ ...p, ...(params.extra ?? {}) });
    // eslint-disable-next-line no-console
    console.log(line);
}
