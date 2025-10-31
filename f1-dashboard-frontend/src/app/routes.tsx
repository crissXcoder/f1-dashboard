import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

// Code-splitting de las páginas
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const MetricsPage = lazy(() => import('@/features/metrics/pages/MetricsPage'));
const AdminIngestPage = lazy(() => import('@/features/dashboard/pages/AdminIngestPage'));

const NotFound = () => (
    <main className="min-h-[50vh] p-6 text-center">
        <h1 className="text-2xl font-semibold">404</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">Página no encontrada.</p>
    </main>
);

/** Rutas hijas de "/" declaradas para react-router */
export const routes: RouteObject[] = [
    { index: true, element: <DashboardPage /> },
    { path: 'metrics', element: <MetricsPage /> },
    { path: 'admin/ingest', element: <AdminIngestPage /> },
    { path: '*', element: <NotFound /> },
];
