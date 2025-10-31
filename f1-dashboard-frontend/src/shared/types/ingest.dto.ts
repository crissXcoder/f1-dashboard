export interface IngestEventDto {
    /** Debe coincidir con el piloto existente (ej. "lec16"). */
    readonly pilotId: string;
    /** Nombre del piloto en el momento del evento (puede redundar con catálogo). */
    readonly pilotName: string;
    /** Equipo al momento del evento. */
    readonly team: string;
    /** Posición actual (1..N). */
    readonly currentPosition: number;
    /**
     * Último tiempo de vuelta como string "M:SS.mmm" (ej. "1:21.345").
     * Mantiene compatibilidad con tu backend que lo recibe como texto.
     */
    readonly lastLapTime: string;
    /** Evento/anomalía detectada (banderas, incidentes, etc.). */
    readonly anomalyDetected: boolean;
}

export interface IngestResponse {
    ok: boolean;
    receivedAt?: string;
    error?: { code: string; message: string };
}
