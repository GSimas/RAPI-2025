import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

/**
 * Total de indicadores, lido do JSON no build. A página inicial só precisa
 * deste número; assim o dataset (~115 KB) fica fora do bundle inicial e só
 * é baixado com o Dashboard/Explorador.
 */
const TOTAL_INDICADORES = (
  JSON.parse(readFileSync(new URL('./dados_rapi_completo.json', import.meta.url), 'utf8')) as unknown[]
).length;

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
  define: {
    __TOTAL_INDICADORES__: JSON.stringify(TOTAL_INDICADORES),
  },
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
    // Sem `manualChunks`: as páginas e os gráficos são `React.lazy`, então o
    // Rollup já isola o recharts num chunk assíncrono. (O `manualChunks`
    // antigo arrastava o `react` para dentro do chunk do recharts e o
    // tornava obrigatório no carregamento inicial.)
  },
});
