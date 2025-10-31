// src/app/App.tsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';

/**
 * Layout raíz de la app:
 * - Header global con navegación
 * - <Outlet/> para renderizar rutas hijas
 *
 * Nota: Las páginas Dashboard/Metrics también dibujan su propio Header.
 * Si prefieres solo un Header global, elimina los Header locales en esas páginas.
 */
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <Header
        title="F1 Live Dashboard"
        rightSlot={
          <nav className="flex items-center gap-3">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                [
                  'text-sm font-medium hover:text-red-600',
                  isActive ? 'text-red-600' : 'text-neutral-700 dark:text-neutral-300',
                ].join(' ')
              }
            >
              Leaderboard
            </NavLink>

            <NavLink
              to="/metrics"
              className={({ isActive }) =>
                [
                  'text-sm font-medium hover:text-red-600',
                  isActive ? 'text-red-600' : 'text-neutral-700 dark:text-neutral-300',
                ].join(' ')
              }
            >
              Métricas
            </NavLink>
          </nav>
        }
      />

      <Container className="py-6">
        <Outlet />
      </Container>
    </div>
  );
};

export default App;
