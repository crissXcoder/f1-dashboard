interface RawEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_SSE_URL?: string;
    readonly MODE?: string; // provisto por Vite
}

interface AppEnv {
    readonly API_URL: string;
    readonly SSE_URL: string;
    readonly NODE_ENV: 'development' | 'production' | 'test';
}

function normalizeBase(url: string): string {
    // sin slash final
    return url.replace(/\/+$/, '');
}

function resolveNodeEnv(mode: string | undefined): AppEnv['NODE_ENV'] {
    if (mode === 'production') return 'production';
    if (mode === 'test') return 'test';
    return 'development';
}

const raw: RawEnv = {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_SSE_URL: import.meta.env.VITE_SSE_URL,
    MODE: import.meta.env.MODE,
};

if (!raw.VITE_API_URL || raw.VITE_API_URL.trim() === '') {
    throw new Error('Missing env VITE_API_URL for frontend');
}

const base = normalizeBase(raw.VITE_API_URL);
const sse = raw.VITE_SSE_URL && raw.VITE_SSE_URL.trim() !== ''
    ? normalizeBase(raw.VITE_SSE_URL)
    : `${base}/sse`;

export const env: AppEnv = Object.freeze({
    API_URL: base,
    SSE_URL: sse,
    NODE_ENV: resolveNodeEnv(raw.MODE),
});
