export interface PilotCreateDto {
    /** Identificador único del piloto (ej. "lec16"). */
    readonly id: string;
    /** Nombre completo del piloto (ej. "Charles Leclerc"). */
    readonly name: string;
    /** Equipo (ej. "Ferrari"). */
    readonly team: string;
}

export interface PilotCreateResponse {
    ok: boolean;
    pilot?: {
        id: string;
        name: string;
        team: string;
        createdAt?: string;
    };
    error?: {
        code: string;
        message: string;
    };
}
