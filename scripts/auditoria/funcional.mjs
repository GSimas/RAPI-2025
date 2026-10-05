/**
 * Verificações funcionais de acessibilidade e resiliência (pt-BR):
 * skip link, anúncio de troca de página, nome acessível do gráfico,
 * foco do popover de filtro, busca do Explorador e Error Boundary
 * (simulando falha no download do chunk do gráfico do Dashboard).
 * Sai com código 1 se alguma verificação falhar.
 *
 *   node scripts/auditoria/funcional.mjs
 */

import { abrirNavegador, espera, URL_BASE } from './navegador.mjs';

let falhas = 0;
const verificar = (condicao, mensagem) => {
  if (!condicao) falhas++;
  console.log(`${condicao ? '✓' : '✗'} ${mensagem}`);
};

const navegador = await abrirNavegador();
const errosPagina = [];
let pagina = await navegador.newPage();
pagina.on('pageerror', (e) => errosPagina.push(e.message));
await pagina.setViewport({ width: 1366, height: 900 });
await pagina.goto(`${URL_BASE}/#apresentacao`, { waitUntil: 'networkidle0' });
await espera(800);

// 1. Skip link
await pagina.keyboard.press('Tab');
const skip = await pagina.evaluate(() => {
  const a = document.activeElement;
  return { texto: a.textContent, largura: a.getBoundingClientRect().width };
});
verificar(skip.texto === 'Pular para o conteúdo' && skip.largura > 40, 'skip link é o 1º Tab e fica visível ao focar');
await pagina.keyboard.press('Enter');
await espera(200);
const destino = await pagina.evaluate(() => ({ id: document.activeElement.id, hash: location.hash }));
verificar(destino.id === 'conteudo' && destino.hash === '#apresentacao', 'Enter no skip link foca o <main> sem mudar a rota');

// 2. Anúncio de página e navegação lazy
const regiaoViva = 'p.sr-only[aria-live]';
verificar((await pagina.$eval(regiaoViva, (p) => p.textContent)) === '', 'carregamento inicial não anuncia nada');
await pagina.click('nav a[href="#dashboard"]');
await espera(1800);
const anuncio = await pagina.$eval(regiaoViva, (p) => p.textContent);
verificar(anuncio === 'Página: Dashboard' && !!(await pagina.$('#pagina-dashboard select')), `navegação anuncia "${anuncio}" e carrega o Dashboard`);
const nomeGrafico = await pagina
  .$eval('#pagina-dashboard svg.recharts-surface', (s) => s.querySelector('title')?.textContent ?? '')
  .catch(() => '');
verificar(nomeGrafico.length > 5, 'gráfico do Dashboard tem nome acessível (<title>)');

// 3. Popover de filtro
await pagina.click('nav a[href="#explorador"]');
await espera(1800);
await (await pagina.$('th button[aria-haspopup="dialog"]')).click();
await espera(500);
const focoDentro = await pagina.evaluate(() => !!document.activeElement.closest('[role=dialog]'));
await pagina.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].at(-1).click());
await espera(400);
const focoVolta = await pagina.evaluate(() => document.activeElement.getAttribute('aria-haspopup'));
verificar(focoDentro && focoVolta === 'dialog', 'popover recebe o foco e "Concluir" o devolve ao botão de filtro');

// 4. Busca do Explorador
await pagina.type('input[type=search]', 'agua', { delay: 30 });
await espera(800);
const linhas = await pagina.$$eval('tbody tr', (t) => t.length);
verificar(linhas > 0 && linhas < 206, `busca "agua" filtra a tabela (${linhas} linhas)`);
await pagina.close();

// 5. Error Boundary: o chunk do gráfico falha, o resto do Dashboard segue
pagina = await navegador.newPage();
pagina.on('pageerror', (e) => errosPagina.push(e.message));
await pagina.setRequestInterception(true);
pagina.on('request', (r) => (r.url().includes('GraficoEvolucao') ? r.abort() : r.continue()));
await pagina.setViewport({ width: 1366, height: 900 });
await pagina.goto(`${URL_BASE}/#dashboard`, { waitUntil: 'networkidle0' });
await espera(1500);
const alerta = await pagina.$('[role=alert]');
const filtros = await pagina.$$eval('#pagina-dashboard select', (s) => s.length);
verificar(!!alerta && filtros === 5, 'falha do gráfico mostra aviso local e o resto do Dashboard continua');
const alturaAviso = alerta ? await alerta.evaluate((a) => a.getBoundingClientRect().height) : 0;
verificar(alturaAviso >= 419, `aviso reserva a altura do gráfico (${Math.round(alturaAviso)}px)`);

await navegador.close();
verificar(errosPagina.length === 0, `sem erros de página${errosPagina.length ? `: ${errosPagina.join(' | ')}` : ''}`);
process.exitCode = falhas > 0 ? 1 : 0;
