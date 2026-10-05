/**
 * ==========================================================
 * Login na OpenRouter com OAuth PKCE
 * ==========================================================
 *
 * Fluxo (https://openrouter.ai/docs — OAuth PKCE):
 *
 * 1. gera um `code_verifier` aleatório e o `code_challenge` (SHA-256,
 *    base64url), além de um `state` contra CSRF;
 * 2. redireciona para `https://openrouter.ai/auth` com o desafio e a
 *    URL de retorno `/auth/openrouter` deste site;
 * 3. no retorno, confere o `state`, troca o `code` + `code_verifier` por
 *    uma chave de API em `POST /api/v1/auth/keys` e limpa a URL.
 *
 * O verificador fica só em `sessionStorage`, vale por 10 minutos (o mesmo
 * prazo do código) e é apagado após o uso — com sucesso ou não.
 */

import { textosAtuais } from '@/i18n/textos';
import type { Conexao } from './sessao';

export const CAMINHO_RETORNO = '/auth/openrouter';

const CHAVE_PKCE = 'rapi-pkce';
const VALIDADE_MS = 10 * 60_000;

interface EstadoPkce {
  readonly verificador: string;
  readonly state: string;
  readonly criadoEm: number;
  readonly lembrar: boolean;
}

/** Codifica bytes em base64url, sem preenchimento. */
function base64url(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Bytes aleatórios criptograficamente seguros. */
function aleatorio(tamanho: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(tamanho));
}

/**
 * Inicia o login: guarda o verificador e redireciona para a OpenRouter.
 *
 * @param lembrar Se a chave obtida deve persistir neste navegador.
 */
export async function iniciarLoginOpenRouter(lembrar: boolean): Promise<void> {
  if (!window.isSecureContext || !crypto.subtle) {
    throw new Error(textosAtuais().chat.pkce.https);
  }

  const verificador = base64url(aleatorio(64));
  const resumo = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificador));
  const desafio = base64url(new Uint8Array(resumo));
  const state = base64url(aleatorio(16));

  const estado: EstadoPkce = { verificador, state, criadoEm: Date.now(), lembrar };
  sessionStorage.setItem(CHAVE_PKCE, JSON.stringify(estado));

  const url = new URL('https://openrouter.ai/auth');
  url.searchParams.set('callback_url', `${window.location.origin}${CAMINHO_RETORNO}`);
  url.searchParams.set('code_challenge', desafio);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  url.searchParams.set('key_label', 'RAPI 2024-2025 - Florianopolis');

  window.location.assign(url.toString());
}

/** A página atual é o retorno do login da OpenRouter? */
export function ehRetornoOpenRouter(): boolean {
  return window.location.pathname === CAMINHO_RETORNO;
}

/** Lê e apaga o estado PKCE salvo. */
function consumirEstado(): EstadoPkce | null {
  try {
    const texto = sessionStorage.getItem(CHAVE_PKCE);
    sessionStorage.removeItem(CHAVE_PKCE);
    if (!texto) return null;
    const bruto = JSON.parse(texto) as Partial<EstadoPkce>;
    if (typeof bruto.verificador !== 'string' || typeof bruto.state !== 'string' || typeof bruto.criadoEm !== 'number') {
      return null;
    }
    return { verificador: bruto.verificador, state: bruto.state, criadoEm: bruto.criadoEm, lembrar: bruto.lembrar === true };
  } catch {
    return null;
  }
}

let conclusaoEmAndamento: Promise<Conexao> | null = null;

/**
 * Conclui o login no retorno da OpenRouter.
 * Idempotente: chamadas repetidas (StrictMode) compartilham a mesma promessa.
 */
export function concluirLoginOpenRouter(): Promise<Conexao> {
  conclusaoEmAndamento ??= trocarCodigo().finally(() => {
    // Remove `code` e `state` da barra de endereços e do histórico.
    window.history.replaceState(null, '', '/#assistente');
  });
  return conclusaoEmAndamento;
}

async function trocarCodigo(): Promise<Conexao> {
  const tp = textosAtuais().chat.pkce;
  const parametros = new URLSearchParams(window.location.search);
  const estado = consumirEstado();

  if (parametros.get('error')) throw new Error(tp.cancelado);

  const codigo = parametros.get('code');
  if (!codigo) throw new Error(tp.semCodigo);
  if (!estado) throw new Error(tp.semSessao);
  if (Date.now() - estado.criadoEm > VALIDADE_MS) throw new Error(tp.expirou);
  if (parametros.get('state') !== estado.state) {
    throw new Error(tp.state);
  }

  const resposta = await fetch('https://openrouter.ai/api/v1/auth/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: codigo, code_verifier: estado.verificador, code_challenge_method: 'S256' }),
    referrerPolicy: 'no-referrer',
  });

  if (!resposta.ok) throw new Error(tp.recusou(resposta.status));

  const corpo: unknown = await resposta.json().catch(() => null);
  const chave = typeof corpo === 'object' && corpo !== null ? (corpo as { key?: unknown }).key : undefined;
  if (typeof chave !== 'string' || chave.length < 16) throw new Error(tp.inesperada);

  return { provedor: 'openrouter', chave, modelo: 'openrouter/free', origem: 'pkce', lembrar: estado.lembrar };
}
