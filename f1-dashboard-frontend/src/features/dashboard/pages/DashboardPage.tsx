import React from 'react';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { useDashboard } from '../hooks/useDashboard';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';

const StatusBar: React.FC<{ connected: boolean; last?: number }> = ({ connected, last }) => {
    const lastStr = last ? new Date(last).toLocaleTimeString() : '—';
    return (
        <div className="flex items-center gap-3">
            <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-600'
                    }`}
                aria-label={connected ? 'Conectado' : 'Desconectado'}
            />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
                {connected ? 'SSE conectado' : 'SSE desconectado'} · Último update: {lastStr}
            </span>
        </div>
    );
};

const F1Divider: React.FC = () => (
    <div className="my-6 h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600" />
);

const DashboardPage: React.FC = () => {
    const { loading, error, connected, lastUpdateTs, leaderboard } = useDashboard();

    return (
        <main className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
            <Header title="F1 Live Dashboard — Leaderboard" rightSlot={<StatusBar connected={connected} last={lastUpdateTs} />} />

            <Container className="py-6">
                <section className="mb-2">
                    <h2 className="text-xl font-semibold tracking-tight">
                        Clasificación y Actualizaciones en Tiempo Real
                    </h2>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        Datos de carrera simulados. Se actualizan vía{' '}
                        <Badge tone="accent">SSE</Badge> y se muestra la última vuelta y puntos.
                    </p>
                </section>

                <F1Divider />

                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-300">
                        {error}
                    </div>
                ) : (
                    <LeaderboardTable data={leaderboard} />
                )}
            </Container>
        </main>
    );
};

export default DashboardPage;
