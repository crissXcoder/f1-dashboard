import { Suspense } from 'react';
import {
    createBrowserRouter,
    RouterProvider,
} from 'react-router-dom';
import { routes } from '@/app/routes';
import App from '@/app/App';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: routes,
    },
]);

export function AppRouter() {
    // Suspense global por si usas lazy en páginas
    return (
        <Suspense fallback={<div className="p-6 text-sm">Cargando…</div>}>
            <RouterProvider router={router} />
        </Suspense>
    );
}
