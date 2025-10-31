import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Table } from '@/components/ui/Table';
import type { MetricsSnapshot } from '../hooks/useMetrics';

export interface MetricsPanelProps {
    readonly loading: boolean;
    readonly error?: string;
    readonly data?: MetricsSnapshot;
    readonly lastUpdated?: number;
    readonly onRefresh?: () => void;
}

function fmt(n: number, digits = 2): string {
    return Number.isFinite(n) ? n.toFixed(digits) : '—';
}

function fmtTs(ts?: number): string {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleTimeString();
}

/**
 * Panel compacto con:
 * - Tarjetas KPI (TPS y Count)
 * - Mini tabla de latencias (mean/p50/p95)
 */
export const MetricsPanel: React.FC<MetricsPanelProps> = ({
    loading,
    error,
    data,
    lastUpdated,
    onRefresh,
}) => {
    const rows =
        data?.latency
            ? [
                { metric: 'Mean (ms)', value: fmt(data.latency.mean, 1) },
                { metric: 'P50 (ms)', value: fmt(data.latency.p50, 1) },
                { metric: 'P95 (ms)', value: fmt(data.latency.p95, 1) },
                { metric: 'Samples', value: `${data.latency.count}` },
            ]
            : [];

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* KPI TPS */}
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>
                        <span className="inline-flex items-center gap-2">
                            <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
                            Throughput (TPS)
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex h-20 items-center justify-center">
                            <Spinner />
                        </div>
                    ) : error ? (
                        <div className="text-sm text-red-600">{error}</div>
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                                {fmt(data?.tps ?? 0, 2)}
                            </span>
                            <Badge tone="accent">req/s</Badge>
                        </div>
                    )}
                    <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        Actualizado: {fmtTs(lastUpdated)}
                    </div>
                </CardContent>
            </Card>

            {/* KPI Count */}
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>
                        <span className="inline-flex items-center gap-2">
                            <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
                            Muestras (count)
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex h-20 items-center justify-center">
                            <Spinner />
                        </div>
                    ) : error ? (
                        <div className="text-sm text-red-600">{error}</div>
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                                {data?.latency.count ?? 0}
                            </span>
                            <Badge tone="neutral">obs</Badge>
                        </div>
                    )}
                    <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        Actualizado: {fmtTs(lastUpdated)}
                    </div>
                </CardContent>
            </Card>

            {/* Tabla latencias */}
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>
                        <span className="inline-flex items-center gap-2">
                            <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
                            Latencias
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex h-20 items-center justify-center">
                            <Spinner />
                        </div>
                    ) : error ? (
                        <div className="text-sm text-red-600">{error}</div>
                    ) : (
                        <Table
                            dense
                            className="text-sm"
                            columns={[
                                { key: 'metric', header: 'Métrica' },
                                { key: 'value', header: 'Valor' },
                            ]}
                            data={rows}
                            keySelector={(r, i) => `${r.metric}-${i}`}
                        />
                    )}
                    <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            Actualizado: {fmtTs(lastUpdated)}
                        </div>
                        <button
                            type="button"
                            onClick={onRefresh}
                            className="text-xs font-medium text-red-600 hover:underline"
                        >
                            Refrescar
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
