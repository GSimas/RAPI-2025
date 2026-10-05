# Auditoria de desempenho e acessibilidade

Scripts usados na auditoria de Core Web Vitals e WCAG 2.1 AA (PR #3).
Rodam contra o build de produção servido pelo `vite preview` e usam o
Chrome instalado na máquina (`puppeteer-core` não baixa navegador).

```bash
npm run build
npm run preview          # em outro terminal: http://localhost:4173
npm run auditoria        # bundle + axe + layout + funcional
```

| Script | Mede | Falha (exit 1) quando |
| :--- | :--- | :--- |
| `npm run auditoria:bundle` | JS inicial e total (sem compressão / gzip / brotli), nº de chunks | — |
| `npm run auditoria:axe` | axe-core WCAG 2.0/2.1 A+AA + best-practice: 5 páginas × 2 temas × desktop/celular | há violação ou erro de console |
| `npm run auditoria:layout` | CLS e overflow horizontal no celular, por página, com os elementos culpados | CLS > 0 ou página mais larga que a tela |
| `npm run auditoria:funcional` | skip link, anúncio de página, foco do popover, busca, Error Boundary | alguma verificação falha |
| `npm run auditoria:inp` | latência de interações (Event Timing, base do INP) com CPU 4× mais lenta | — |
| `npm run auditoria:lighthouse` | Lighthouse perf + a11y (mediana de 3 rodadas, throttling DevTools) | — |

O INP e o Lighthouse variam entre rodadas: compare sempre medianas, com o
mesmo servidor e a mesma máquina.

Variáveis de ambiente:

- `URL`: alvo (padrão `http://localhost:4173`). Para comparar com outro build: `npx vite preview --outDir <pasta> --port 4174` e `URL=http://localhost:4174`.
- `CHROME_PATH`: caminho do Chrome, se não estiver no local padrão.

Para ver a composição do bundle por pacote: `npx vite-bundle-visualizer`.
