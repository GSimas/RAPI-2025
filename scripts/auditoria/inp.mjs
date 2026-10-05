/**
 * Latência de interações reais (Event Timing API, a base do INP) com CPU
 * 4× mais lenta, como o perfil móvel do Lighthouse:
 * digitar na busca do Explorador, trocar de página e trocar sub-abas do
 * Dashboard. Repete N vezes e informa a mediana do p98.
 *
 *   node scripts/auditoria/inp.mjs [rodadas=3]
 */

import { abrirNavegador, espera, mediana, urlDe } from './navegador.mjs';

const RODADAS = Number(process.argv[2] ?? 3);

async function observar(pagina) {
  await pagina.evaluate(() => {
    window.__eventos = [];
    new PerformanceObserver((lista) => {
      for (const e of lista.getEntries()) if (e.interactionId) window.__eventos.push(e.duration);
    }).observe({ type: 'event', durationThreshold: 16 });
  });
}

async function p98(pagina) {
  await espera(800);
  const duracoes = (await pagina.evaluate(() => window.__eventos)).sort((a, b) => a - b);
  return duracoes.length ? duracoes[Math.min(duracoes.length - 1, Math.floor(duracoes.length * 0.98))] : 0;
}

async function abrir(pagina, id) {
  await pagina.goto(urlDe(id), { waitUntil: 'networkidle0' });
  await espera(1500);
  await observar(pagina);
}

const CENARIOS = {
  'Explorador: digitar na busca': async (pagina) => {
    await abrir(pagina, 'explorador');
    await pagina.click('input[type=search]');
    for (const termo of ['agua potavel', 'educacao', 'saude basica']) {
      await pagina.type('input[type=search]', termo, { delay: 60 });
      for (let i = 0; i < termo.length; i++) await pagina.keyboard.press('Backspace', { delay: 30 });
    }
  },
  'Troca de páginas (menu)': async (pagina) => {
    await abrir(pagina, 'apresentacao');
    for (const id of ['dashboard', 'relatorio', 'explorador', 'apresentacao', 'dashboard', 'apresentacao']) {
      await pagina.click(`nav a[href="#${id}"]`);
      await espera(1600);
    }
  },
  'Dashboard: sub-abas': async (pagina) => {
    await abrir(pagina, 'dashboard');
    for (let i = 0; i < 3; i++) {
      for (const aba of ['regras', 'dados', 'grafico']) {
        await pagina.click(`#detalhe-aba-${aba}`);
        await espera(900);
      }
    }
  },
};

const navegador = await abrirNavegador();
const pagina = await navegador.newPage();
await pagina.setViewport({ width: 1366, height: 900 });
await pagina.emulateCPUThrottling(4);

for (const [nome, executar] of Object.entries(CENARIOS)) {
  const medidas = [];
  for (let r = 0; r < RODADAS; r++) {
    await executar(pagina);
    medidas.push(await p98(pagina));
  }
  console.log(`${nome.padEnd(30)} INP p98 (mediana de ${RODADAS}): ${Math.round(mediana(medidas))} ms  [${medidas.map(Math.round).join(', ')}]`);
}

await navegador.close();
