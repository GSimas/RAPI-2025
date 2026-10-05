/**
 * Estabilidade de layout no celular (412 × 823), página a página:
 *  - CLS acumulado no carregamento, com os elementos que se deslocaram;
 *  - overflow horizontal (página mais larga que a tela, o que faz o
 *    navegador dar zoom-out e desloca as camadas fixas do fundo).
 * Sai com código 1 se houver deslocamento ou overflow.
 *
 *   node scripts/auditoria/layout.mjs
 */

import { abrirNavegador, espera, PAGINAS, urlDe } from './navegador.mjs';

const LARGURA = 412;
const navegador = await abrirNavegador();
let problemas = 0;

for (const id of PAGINAS) {
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: LARGURA, height: 823, deviceScaleFactor: 1.75, isMobile: true });
  await pagina.evaluateOnNewDocument(() => {
    window.__deslocamentos = [];
    new PerformanceObserver((lista) => {
      for (const e of lista.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__deslocamentos.push({
          valor: e.value,
          origens: e.sources.map((s) => (s.node ? `${s.node.nodeName}.${s.node.className?.baseVal ?? s.node.className}` : '?')),
        });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await pagina.goto(urlDe(id), { waitUntil: 'networkidle0' });
  await espera(3000);

  const r = await pagina.evaluate((W) => {
    // Só os culpados mais internos; o fundo fixo (overflow: hidden) é ignorado.
    const vazando = [];
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('.fundo-animado')) continue;
      const caixa = el.getBoundingClientRect();
      if (caixa.right <= W + 1 || caixa.width === 0) continue;
      if ([...el.children].some((c) => c.getBoundingClientRect().right > W + 1)) continue;
      vazando.push(`${el.tagName}.${String(el.className?.baseVal ?? el.className).slice(0, 60)} (right=${Math.round(caixa.right)})`);
    }
    return {
      larguraDocumento: document.documentElement.scrollWidth,
      cls: window.__deslocamentos.reduce((soma, d) => soma + d.valor, 0),
      deslocamentos: window.__deslocamentos,
      vazando: vazando.slice(0, 5),
    };
  }, LARGURA);

  const overflow = r.larguraDocumento > LARGURA;
  if (overflow || r.cls > 0) problemas++;
  console.log(`${overflow || r.cls > 0 ? '✗' : '✓'} ${id.padEnd(13)} CLS ${r.cls.toFixed(3)}  largura ${r.larguraDocumento}px`);
  for (const d of r.deslocamentos) console.log(`    deslocamento ${d.valor.toFixed(4)}: ${d.origens.join(', ')}`);
  // Elementos fora da tela dentro de contêineres com rolagem própria são normais; só importam com overflow.
  if (overflow) for (const v of r.vazando) console.log(`    vaza: ${v}`);
  await pagina.close();
}

await navegador.close();
process.exitCode = problemas > 0 ? 1 : 0;
