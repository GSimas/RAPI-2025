/**
 * ==========================================================
 * Ponto de entrada da aplicacao
 * ==========================================================
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { PreferenciasProvider } from './hooks/usePreferencias';
import './index.css';

const raiz = document.getElementById('root');

if (!raiz) {
  throw new Error('Elemento #root nao encontrado no index.html.');
}

createRoot(raiz).render(
  <StrictMode>
    <PreferenciasProvider>
      <App />
    </PreferenciasProvider>
  </StrictMode>,
);
