import React from 'react';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { MetricsPanel } from '../components/MetricsPanel';
import { useMetrics } from '../hooks/useMetrics';

const F1Divider: React.FC = () => (
    <div className="my-6 h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600" />
);

/**
 * Página de métricas (ruteable)
 * - Usa F1 theme (rojo/blanco, dark mode soportado)
 * - Presenta TPS y latencias en panel compacto
 */
const MetricsPage: React.FC = () => {
    const { loading, error, data, lastUpdated, refresh } = useMetrics({ intervalMs: 3000 });

    return (
        <main className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
            <Header title="F1 Live Dashboard — Métricas" />
            <Container className="py-6">
                <section className="mb-2">
                    <h2 className="text-xl font-semibold tracking-tight">
                        Observabilidad del Backend
                    </h2>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        Sondeo periódico de <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">/metrics</code>.
                        Muestra Throughput (TPS) y latencias (mean, p50, p95).
                    </p>
                </section>

                <F1Divider />

                <MetricsPanel
                    loading={loading}
                    error={error}
                    data={data}
                    lastUpdated={lastUpdated}
                    onRefresh={refresh}
                />
            </Container>
        </main>
    );
};

export default MetricsPage;
