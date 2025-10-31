import React from 'react';
import type { LeaderboardRowDTO } from '@/shared/types/dto';
import { Badge } from '@/components/ui/Badge';
import { fmtLap, fmtPos, fmtTeam } from '../utils/formatters';

export interface PilotRowProps {
    readonly row: LeaderboardRowDTO;
}

const AnomalyIcon: React.FC<{ active: boolean }> = ({ active }) => {
    if (!active) return null;
    return (
        <svg
            className="ml-2 h-4 w-4 text-red-600"
            viewBox="0 0 24 24"
            aria-label="Anomalía"
        >
            <path
                fill="currentColor"
                d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
            />
        </svg>
    );
};

export const PilotRow: React.FC<PilotRowProps> = ({ row }) => {
    return (
        <>
            {/* Posición */}
            <div className="px-4 py-2">
                <Badge tone="accent">{fmtPos(row.position)}</Badge>
            </div>

            {/* Piloto + Equipo */}
            <div className="px-4 py-2">
                <div className="flex items-center gap-3">
                    {/* “marca” roja sutil estilo F1 */}
                    <span className="inline-block h-3 w-3 rounded-sm bg-red-600" aria-hidden />
                    <div className="flex flex-col">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {row.pilotName}
                            <AnomalyIcon active={row.anomaly === true} />
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {fmtTeam(row.team)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Última vuelta */}
            <div className="px-4 py-2 tabular-nums">{fmtLap(row.lastLapMs)}</div>

            {/* Puntos acumulados */}
            <div className="px-4 py-2 font-semibold tabular-nums">{row.points}</div>
        </>
    );
};
