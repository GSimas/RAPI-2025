/**
 * ==========================================================
 * Cliente da função serverless do assistente
 * ==========================================================
 *
 * O navegador nunca conversa diretamente com a API do Gemini: a chave
 * vive apenas em `netlify/functions/chat.ts`. Aqui apenas encapsulamos a
 * chamada HTTP para `/api/chat`, incluindo timeout e tratamento de erro.
 */

import type { MensagemChat } from '@/types/rapi';

/** Rota da função serverless (ver o redirect em `netlify.toml`). */
const ENDPOINT = '/api/chat';

/** Tempo máximo de espera pela resposta do modelo. */
const TIMEOUT_MS = 45_000;

/** Turno de conversa enviado à função (formato mínimo, sem metadados). */
export interface TurnoConversa {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

/** Corpo da requisição aceito pela função serverless. */
export interface RequisicaoChat {
  readonly pergunta: string;
  readonly historico: readonly TurnoConversa[];
}

/** Resposta bem-sucedida da função serverless. */
export interface RespostaChat {
  readonly resposta: string;
  /** Modelo efetivamente utilizado (útil quando o fallback é acionado). */
  readonly modelo: string;
}

/** Erro tipado para diferenciar falhas de rede das falhas do modelo. */
export class ErroChat extends Error {
  constructor(
    message: string,
    /** Código HTTP, quando houver. */
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ErroChat';
  }
}

/**
 * Converte o histórico exibido na interface para o formato da API,
 * descartando mensagens de erro (que não fazem parte da conversa real).
 */
export function prepararHistorico(mensagens: readonly MensagemChat[]): TurnoConversa[] {
  return mensagens
    .filter((mensagem) => !mensagem.erro)
    .map((mensagem) => ({ role: mensagem.role, content: mensagem.content }));
}

/**
 * Envia uma pergunta ao assistente.
 *
 * @param pergunta Texto digitado pelo usuário.
 * @param historico Turnos anteriores da conversa.
 * @param sinal `AbortSignal` externo, para cancelar a requisição.
 * @throws {ErroChat} Quando a rede falha, o tempo esgota ou a função
 *         responde com erro.
 */
export async function enviarPergunta(
  pergunta: string,
  historico: readonly TurnoConversa[],
  sinal?: AbortSignal,
): Promise<RespostaChat> {
  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  // Encadeia o cancelamento externo ao controlador interno do timeout.
  sinal?.addEventListener('abort', () => controlador.abort(), { once: true });

  try {
    const resposta = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pergunta, historico } satisfies RequisicaoChat),
      signal: controlador.signal,
    });

    const corpo: unknown = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      const mensagem =
        (typeof corpo === 'object' && corpo !== null && 'erro' in corpo
          ? String((corpo as { erro: unknown }).erro)
          : null) ?? `A requisição falhou (HTTP ${resposta.status}).`;
      throw new ErroChat(mensagem, resposta.status);
    }

    if (typeof corpo !== 'object' || corpo === null || !('resposta' in corpo)) {
      throw new ErroChat('Resposta em formato inesperado do servidor.');
    }

    const dados = corpo as { resposta: unknown; modelo?: unknown };
    return {
      resposta: String(dados.resposta),
      modelo: typeof dados.modelo === 'string' ? dados.modelo : 'desconhecido',
    };
  } catch (erro) {
    if (erro instanceof ErroChat) throw erro;

    if (erro instanceof DOMException && erro.name === 'AbortError') {
      throw new ErroChat(
        'A resposta demorou mais que o esperado. Tente reformular a pergunta.',
      );
    }

    throw new ErroChat('Não foi possível falar com o assistente. Verifique sua conexão.');
  } finally {
    clearTimeout(timeout);
  }
}
