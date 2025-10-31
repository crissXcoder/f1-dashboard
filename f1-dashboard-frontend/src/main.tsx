import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from '@/router';
import { RaceProvider } from '@/shared/state/RaceContext';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RaceProvider>
      <AppRouter />
    </RaceProvider>
  </React.StrictMode>
);
