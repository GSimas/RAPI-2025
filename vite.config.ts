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
      /**
       * Permite rodar `vite dev` isolado, encaminhando `/api/*` para o
       * servidor de functions. O destino padrao e o `netlify dev` (8888) e
       * pode ser trocado por `NETLIFY_FUNCTIONS_URL` — util com
       * `netlify functions:serve --port 9999`.
       *
       * O `rewrite` reproduz o redirect do `netlify.toml`, traduzindo
       * `/api/chat` para o caminho nativo `/.netlify/functions/chat`,
       * que ambos os servidores atendem.
       */
      '/api': {
        target: process.env['NETLIFY_FUNCTIONS_URL'] ?? 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (caminho) => caminho.replace(/^\/api\//, '/.netlify/functions/'),
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
