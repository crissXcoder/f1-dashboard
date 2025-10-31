import React from 'react';
import clsx from 'clsx';

export interface TableColumn<T> {
    readonly key: keyof T & string;
    readonly header: string;
    readonly className?: string;
    readonly render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface TableProps<T> {
    readonly columns: ReadonlyArray<TableColumn<T>>;
    readonly data: ReadonlyArray<T>;
    readonly keySelector: (row: T, idx: number) => string;
    readonly emptyMessage?: string;
    readonly className?: string;
    readonly dense?: boolean;
}

export function Table<T>({
    columns,
    data,
    keySelector,
    emptyMessage = 'Sin datos',
    className,
    dense = false,
}: TableProps<T>) {
    return (
        <div className={clsx('w-full overflow-x-auto', className)}>
            <table className={clsx('min-w-full text-left', dense ? 'text-sm' : 'text-base')}>
                <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300">
                        {columns.map((c) => (
                            <th
                                key={c.key}
                                className={clsx('px-4 py-2 font-medium', c.className)}
                            >
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td
                                className="px-4 py-3 text-neutral-500 dark:text-neutral-400"
                                colSpan={columns.length}
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, idx) => (
                            <tr
                                key={keySelector(row, idx)}
                                className="border-b border-neutral-100 hover:bg-red-50/50 dark:border-neutral-800 dark:hover:bg-neutral-800/60"
                            >
                                {columns.map((c) => {
                                    const value = row[c.key];
                                    return (
                                        <td key={c.key} className={clsx('px-4 py-2', c.className)}>
                                            {c.render ? c.render(value, row) : (value as React.ReactNode)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
