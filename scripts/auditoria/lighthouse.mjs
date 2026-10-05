/**
 * Lighthouse (performance + acessibilidade) nas páginas principais,
 * N rodadas por página, informando a mediana. Por padrão usa throttling
 * real do DevTools (mais fiel que a simulação Lantern para SPAs animadas);
 * `--simular` usa a simulação padrão do Lighthouse.
 *
 *   node scripts/auditoria/lighthouse.mjs [rodadas=3] [--simular]
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mediana, URL_BASE } from './navegador.mjs';

const RODADAS = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 3);
const SIMULAR = process.argv.includes('--simular');
const pasta = mkdtempSync(join(tmpdir(), 'rapi-lh-'));

for (const id of ['apresentacao', 'dashboard', 'explorador']) {
  const relatorios = [];
  for (let r = 0; r < RODADAS; r++) {
    const saida = join(pasta, `${id}-${r}.json`);
    execFileSync('npx', [
      '-y', 'lighthouse@12', `${URL_BASE}/?lh=${r}#${id}`,
      '--quiet', '--chrome-flags=--headless=new',
      '--only-categories=performance,accessibility',
      `--throttling-method=${SIMULAR ? 'simulate' : 'devtools'}`,
      '--output=json', `--output-path=${saida}`,
    ], { stdio: 'ignore' });
    relatorios.push(JSON.parse(readFileSync(saida, 'utf8')));
  }

  const nota = (cat) => Math.round(mediana(relatorios.map((r) => r.categories[cat].score * 100)));
  const valor = (auditoria) => mediana(relatorios.map((r) => r.audits[auditoria].numericValue));
  console.log(
    `${id.padEnd(13)} perf ${nota('performance')}  a11y ${nota('accessibility')}` +
      `  FCP ${Math.round(valor('first-contentful-paint'))} ms` +
      `  LCP ${Math.round(valor('largest-contentful-paint'))} ms` +
      `  TBT ${Math.round(valor('total-blocking-time'))} ms` +
      `  CLS ${valor('cumulative-layout-shift').toFixed(3)}` +
      `  JS boot ${Math.round(valor('bootup-time'))} ms`,
  );
}
console.log(`\n(${RODADAS} rodadas, ${SIMULAR ? 'simulação Lantern' : 'throttling DevTools'}; JSONs em ${pasta})`);
