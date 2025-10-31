import { fetchJson } from '@/shared/utils/fetchJson';
import type { PilotCreateDto, PilotCreateResponse } from '@/shared/types/pilots.dto';
import type { IngestEventDto, IngestResponse } from '@/shared/types/ingest.dto';

/**
 * Base del API REST (normalmente con prefijo /api).
 * Ej.: VITE_API_URL=http://localhost:8080/api
 */
const API_BASE =
    (import.meta.env?.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api';

/**
 * Base para /ingest. Si no se define, se usa el host del backend sin /api.
 * Ej.: VITE_INGEST_URL=http://localhost:8080
 */
const INGEST_BASE =
    (import.meta.env?.VITE_INGEST_URL as string | undefined) ?? 'http://localhost:8080';

/** POST /api/pilots */
export async function createPilot(dto: PilotCreateDto): Promise<PilotCreateResponse> {
    return fetchJson<PilotCreateResponse>(`${API_BASE}/api/pilots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
    });
}

/** POST /ingest */
export async function ingestRaceEvent(dto: IngestEventDto): Promise<IngestResponse> {
    return fetchJson<IngestResponse>(`${INGEST_BASE}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
    });
}
