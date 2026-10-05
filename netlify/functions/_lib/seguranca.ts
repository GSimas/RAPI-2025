/**
 * ==========================================================
 * Segurança HTTP das funções do assistente
 * ==========================================================
 *
 * - **Origem**: só aceita chamadas do próprio site (ou de `localhost`
 *   em desenvolvimento, ou de origens listadas em `ALLOWED_ORIGINS`).
 *   Sem `Access-Control-Allow-Origin`, outros sites não leem respostas.
 * - **Limite de taxa** por IP, em memória (melhor esforço: cada instância
 *   da função mantém a sua janela).
 * - **Tamanho do corpo** limitado antes do parse do JSON.
 * - **Credencial** do usuário lida do cabeçalho `Authorization` —
 *   nunca do corpo, nunca registrada em log, nunca devolvida.
 */

import { MENSAGENS, type Idioma } from './mensagens';

/** Cabeçalhos aplicados às respostas JSON. */
export const CABECALHOS_JSON: Readonly<Record<string, string>> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

/** Resposta JSON padronizada. */
export function responderJson(corpo: unknown, status = 200, extras: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { ...CABECALHOS_JSON, ...extras } });
}

/** Resposta de erro padronizada. */
export function responderErro(mensagem: string, status: number, extras: Record<string, string> = {}): Response {
  return responderJson({ erro: mensagem }, status, extras);
}

/** Hosts sempre aceitos em desenvolvimento. */
const HOSTS_LOCAIS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Verifica se a requisição vem de uma origem permitida.
 *
 * Requisições sem `Origin` (mesma origem em GET, ferramentas de linha de
 * comando) são aceitas: a proteção relevante é contra páginas de
 * terceiros usando o navegador da vítima, que sempre enviam `Origin`.
 */
export function origemPermitida(request: Request): boolean {
  const origem = request.headers.get('origin');
  if (!origem) return true;

  let urlOrigem: URL;
  try {
    urlOrigem = new URL(origem);
  } catch {
    return false;
  }

  if (urlOrigem.host === new URL(request.url).host) return true;
  if (HOSTS_LOCAIS.has(urlOrigem.hostname)) return true;

  const extras = (process.env['ALLOWED_ORIGINS'] ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return extras.includes(urlOrigem.origin);
}

/** Origem a informar aos provedores (atribuição na OpenRouter). */
export function origemDoSite(request: Request): string {
  const origem = request.headers.get('origin');
  return origem ?? new URL(request.url).origin;
}

// ==========================================================
// Limite de taxa
// ==========================================================

const janelas = new Map<string, number[]>();

/** IP do cliente, conforme os cabeçalhos da Netlify. */
function ipDe(request: Request): string {
  return (
    request.headers.get('x-nf-client-connection-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'desconhecido'
  );
}

/**
 * Registra uma chamada e informa se o limite foi excedido.
 *
 * @returns Segundos de espera sugeridos, ou `0` se a chamada é permitida.
 */
export function verificarLimite(request: Request, escopo: string, maximo: number, janelaMs: number): number {
  const chave = `${escopo}:${ipDe(request)}`;
  const agora = Date.now();
  const recentes = (janelas.get(chave) ?? []).filter((instante) => agora - instante < janelaMs);

  if (recentes.length >= maximo) {
    janelas.set(chave, recentes);
    const maisAntigo = recentes[0] ?? agora;
    return Math.max(1, Math.ceil((janelaMs - (agora - maisAntigo)) / 1000));
  }

  recentes.push(agora);
  janelas.set(chave, recentes);

  // Higiene: evita que o mapa cresça indefinidamente numa instância longeva.
  if (janelas.size > 5_000) {
    for (const [k, v] of janelas) if (v.every((t) => agora - t >= janelaMs)) janelas.delete(k);
  }
  return 0;
}

// ==========================================================
// Corpo e credencial
// ==========================================================

/**
 * Lê o corpo JSON respeitando um tamanho máximo.
 *
 * @returns O valor decodificado, ou uma `Response` de erro.
 */
export async function lerCorpoJson(request: Request, maximoBytes: number, idioma: Idioma): Promise<unknown> {
  const m = MENSAGENS[idioma];
  const declarado = Number(request.headers.get('content-length') ?? '0');
  if (declarado > maximoBytes) return responderErro(m.corpoGrande, 413);

  const tipo = request.headers.get('content-type') ?? '';
  if (!tipo.toLowerCase().startsWith('application/json')) {
    return responderErro(m.corpoTipo, 415);
  }

  const texto = await request.text();
  if (texto.length > maximoBytes) return responderErro(m.corpoGrande, 413);

  try {
    return JSON.parse(texto) as unknown;
  } catch {
    return responderErro(m.corpoJson, 400);
  }
}

/** Chaves de API: 16 a 512 caracteres ASCII visíveis, sem espaços. */
const PADRAO_CHAVE = /^Bearer ([\x21-\x7E]{16,512})$/;

/** Extrai a credencial do usuário do cabeçalho `Authorization`. */
export function lerCredencial(request: Request): string | null {
  const cabecalho = request.headers.get('authorization') ?? '';
  return PADRAO_CHAVE.exec(cabecalho)?.[1] ?? null;
}
