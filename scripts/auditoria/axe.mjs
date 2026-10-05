/**
 * Varredura axe-core (WCAG 2.0/2.1 A + AA e best-practice) em todas as
 * páginas, nos temas escuro e claro, em desktop e celular. Também acusa
 * erros de console. Sai com código 1 se houver violação.
 *
 *   node scripts/auditoria/axe.mjs
 */

import { createRequire } from 'node:module';
import { abrirNavegador, definirPreferencias, espera, PAGINAS, urlDe } from './navegador.mjs';

const require = createRequire(import.meta.url);
const CAMINHO_AXE = require.resolve('axe-core/axe.min.js');

const CENARIOS = [
  { nome: 'desktop', largura: 1366, altura: 900 },
  { nome: 'celular', largura: 390, altura: 844, isMobile: true },
];

const navegador = await abrirNavegador();
const erros = [];
let total = 0;

for (const cenario of CENARIOS) {
  for (const tema of ['dark', 'light']) {
    const pagina = await navegador.newPage();
    const rotulo = `${cenario.nome}/${tema}`;
    pagina.on('console', (m) => m.type() === 'error' && erros.push(`${rotulo}: ${m.text()}`));
    pagina.on('pageerror', (e) => erros.push(`${rotulo}: ${e.message}`));
    await pagina.setViewport({ width: cenario.largura, height: cenario.altura, isMobile: !!cenario.isMobile });
    await definirPreferencias(pagina, { tema });

    for (const id of PAGINAS) {
      await pagina.goto(urlDe(id), { waitUntil: 'networkidle0' });
      // Rola até o fim para revelar o conteúdo animado e os gráficos lazy.
      await pagina.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      await espera(1500);
      await pagina.addScriptTag({ path: CAMINHO_AXE });

      const violacoes = await pagina.evaluate(async () => {
        const resultado = await window.axe.run(document, {
          runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
        });
        return resultado.violations.map((v) => ({
          regra: v.id,
          impacto: v.impact,
          nos: v.nodes.length,
          exemplos: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
        }));
      });

      const nos = violacoes.reduce((soma, v) => soma + v.nos, 0);
      total += nos;
      console.log(`${nos === 0 ? '✓' : '✗'} ${rotulo}/${id}: ${nos} nó(s)`);
      for (const v of violacoes) console.log(`    ${v.regra} (${v.impacto}) ×${v.nos}: ${v.exemplos.join(' | ')}`);
    }
    await pagina.close();
  }
}

await navegador.close();
console.log(`\nTotal de nós com violação: ${total}`);
console.log(`Erros de console: ${erros.length ? `\n  ${erros.join('\n  ')}` : 'nenhum'}`);
process.exitCode = total > 0 || erros.length > 0 ? 1 : 0;
