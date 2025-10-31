import React from 'react';
import { Table } from '@/components/ui/Table';
import type { LeaderboardRowDTO } from '@/shared/types/dto';
import { rowKey } from '../utils/formatters';
import { PilotRow } from './PilotRow';

export interface LeaderboardTableProps {
    readonly data: ReadonlyArray<LeaderboardRowDTO>;
}

type RowShape = LeaderboardRowDTO; // para Table<T>

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ data }) => {
    // Usamos Table<T> con columnas “falsas”; renderizamos toda la fila con PilotRow
    const columns = [
        { key: 'position', header: 'Pos', className: 'w-[60px]' },
        { key: 'pilotName', header: 'Piloto' },
        { key: 'lastLapMs', header: 'Última Vuelta', className: 'w-[160px]' },
        { key: 'points', header: 'Pts', className: 'w-[80px] text-right' },
    ] as const;

    return (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Clasificación en Vivo
                </h3>
            </div>

            <Table<RowShape>
                dense
                className="text-sm"
                columns={columns.map((c) => ({
                    ...c,
                    render: (_value: RowShape[keyof RowShape], row: RowShape) => null, // renderizamos manual
                }))}
                data={data}
                keySelector={(r, i) => rowKey(r, i)}
            />

            {/* Capa que pinta las filas encima (para control total del layout por celda) */}
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {data.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">
                        Sin datos
                    </div>
                ) : (
                    data.map((r, i) => (
                        <div
                            key={rowKey(r, i)}
                            className="grid grid-cols-4 items-center border-b border-neutral-100 last:border-0 hover:bg-red-50/50 dark:border-neutral-800 dark:hover:bg-neutral-800/60"
                        >
                            <PilotRow row={r} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
