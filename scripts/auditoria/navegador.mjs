/**
 * Utilitários compartilhados pelos scripts de auditoria.
 *
 * Usa o Chrome instalado na máquina (puppeteer-core não baixa navegador).
 * Caminho alternativo: `CHROME_PATH=/caminho/do/chrome`.
 * Alvo: `URL=http://...` (padrão: `vite preview`, porta 4173).
 */

import puppeteer from 'puppeteer-core';

export const URL_BASE = process.env.URL ?? 'http://localhost:4173';

export const PAGINAS = ['apresentacao', 'dashboard', 'relatorio', 'explorador', 'assistente'];

export const espera = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

/** Abre o Chrome headless. */
export function abrirNavegador() {
  const caminho = process.env.CHROME_PATH;
  return puppeteer.launch({
    headless: true,
    ...(caminho ? { executablePath: caminho } : { channel: 'chrome' }),
  });
}

/** URL de uma página, com parâmetro anti-cache (o hash é a rota). */
export function urlDe(pagina) {
  return `${URL_BASE}/?t=${Date.now()}#${pagina}`;
}

/** Grava as preferências antes do primeiro script da página (tema, movimento...). */
export function definirPreferencias(pagina, preferencias) {
  return pagina.evaluateOnNewDocument(
    (p) => localStorage.setItem('rapi-preferencias', JSON.stringify(p)),
    preferencias,
  );
}

/** Mediana de uma lista de números. */
export function mediana(valores) {
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.floor(ordenados.length / 2)];
}
