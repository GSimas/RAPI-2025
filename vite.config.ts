import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * Configuracao do Vite para o Dashboard RAPI 2024-2025.
 *
 * - `@`   -> `src`, para imports absolutos e legiveis.
 * - `@dados` -> raiz do repositorio, onde vive o `dados_rapi_completo.json`
 *   compartilhado entre o frontend e a funcao serverless.
 * - Durante `netlify dev`, as chamadas a `/api/*` sao servidas pelas
 *   Netlify Functions; em `vite dev` puro elas sao encaminhadas via proxy.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@dados': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Permite rodar `vite dev` isolado apontando para `netlify dev` (porta 8888).
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          // Isola a biblioteca de graficos do bundle principal.
          recharts: ['recharts'],
        },
      },
    },
  },
});
