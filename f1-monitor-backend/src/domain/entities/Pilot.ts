import type { PilotId, Team } from '@/domain/types/index.js';

/**
 * Representa a un piloto. El id es inmutable; nombre y equipo son mutables de forma controlada.
 * Puedes exponer setters si necesitas, aquí dejamos propiedades públicas tipadas.
 */
export class Pilot {
    public name: string;
    public team: Team;

    constructor(readonly id: PilotId, name: string, team: Team) {
        if (!id) throw new Error('Pilot.id is required');
        if (!name.trim()) throw new Error('Pilot.name must be non-empty');
        this.name = name.trim();
        this.team = team;
    }
}
