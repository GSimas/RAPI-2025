/**
 * ==========================================================
 * Cliente das funções serverless do assistente
 * ==========================================================
 *
 * - `listarModelos`: modelos de um provedor (e validação da chave BYOK);
 * - `enviarPergunta`: envia a pergunta e consome a resposta em streaming
 *   (NDJSON), repassando cada evento à interface.
 *
 * A credencial do usuário viaja apenas no cabeçalho `Authorization` para
 * as rotas `/api/*` deste site; nunca em URL nem no corpo.
 */

import type { Conexao } from '@/lib/ia/sessao';
import type { IdProvedor } from '@/lib/ia/provedores';
import { idiomaAtual, textosAtuais } from '@/i18n/textos';
import type { MensagemChat } from '@/types/rapi';

/** Tempo máximo de espera de uma resposta completa. */
const TIMEOUT_MS = 65_000;

/** Turno de conversa enviado à função (formato mínimo, sem metadados). */
export interface TurnoConversa {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

/** Um modelo disponível num provedor. */
export interface ModeloIA {
  readonly id: string;
  readonly nome: string;
  readonly gratis?: boolean;
  readonly contexto?: number;
}

/** Eventos do streaming (espelham `netlify/functions/chat.ts`). */
export type EventoChat =
  | { readonly tipo: 'aviso'; readonly mensagem: string }
  | { readonly tipo: 'modelo'; readonly modelo: string }
  | { readonly tipo: 'delta'; readonly texto: string }
  | { readonly tipo: 'bloqueio'; readonly mensagem: string }
  | { readonly tipo: 'erro'; readonly mensagem: string }
  | { readonly tipo: 'fim' };

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
 * descartando erros, recusas dos guardrails e respostas incompletas.
 */
export function prepararHistorico(mensagens: readonly MensagemChat[]): TurnoConversa[] {
  return mensagens
    .filter((mensagem) => !mensagem.erro && !mensagem.bloqueio && !mensagem.transmitindo && mensagem.content.trim())
    .map((mensagem) => ({ role: mensagem.role, content: mensagem.content }));
}

/** Extrai a mensagem `{ erro }` de uma resposta JSON de erro. */
async function mensagemDeErro(resposta: Response): Promise<string> {
  const corpo: unknown = await resposta.json().catch(() => null);
  if (typeof corpo === 'object' && corpo !== null && 'erro' in corpo) {
    return String((corpo as { erro: unknown }).erro);
  }
  return textosAtuais().chat.erros.requisicao(resposta.status);
}

/**
 * Lista os modelos de um provedor.
 *
 * @param chave Obrigatória para BYOK; dispensada na OpenRouter.
 * @throws {ErroChat} Chave inválida, provedor indisponível etc.
 */
export async function listarModelos(provedor: IdProvedor, chave?: string): Promise<ModeloIA[]> {
  let resposta: Response;
  try {
    resposta = await fetch('/api/modelos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Idioma das mensagens do servidor (o escolhido no painel, não o do navegador).
        'Accept-Language': idiomaAtual() === 'en' ? 'en' : 'pt-BR',
        ...(chave ? { Authorization: `Bearer ${chave}` } : {}),
      },
      body: JSON.stringify({ provedor }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    throw new ErroChat(textosAtuais().chat.erros.consultarModelos);
  }

  if (!resposta.ok) throw new ErroChat(await mensagemDeErro(resposta), resposta.status);

  const corpo: unknown = await resposta.json().catch(() => null);
  const lista = typeof corpo === 'object' && corpo !== null ? (corpo as { modelos?: unknown }).modelos : null;
  if (!Array.isArray(lista)) throw new ErroChat(textosAtuais().chat.erros.respostaModelos);

  return lista.filter(
    (item): item is ModeloIA =>
      typeof item === 'object' && item !== null && typeof (item as ModeloIA).id === 'string',
  );
}

interface OpcoesEnvio {
  readonly pergunta: string;
  readonly historico: readonly TurnoConversa[];
  readonly conexao: Conexao;
  readonly aoEvento: (evento: EventoChat) => void;
  readonly sinal?: AbortSignal;
  /** Idioma da resposta e das mensagens do servidor. */
  readonly idioma: 'pt' | 'en';
}

/** Valida um evento NDJSON recebido. */
function lerEvento(linha: string): EventoChat | null {
  try {
    const bruto = JSON.parse(linha) as Record<string, unknown>;
    switch (bruto['tipo']) {
      case 'delta':
        return typeof bruto['texto'] === 'string' ? { tipo: 'delta', texto: bruto['texto'] } : null;
      case 'modelo':
        return typeof bruto['modelo'] === 'string' ? { tipo: 'modelo', modelo: bruto['modelo'] } : null;
      case 'aviso':
      case 'bloqueio':
      case 'erro':
        return typeof bruto['mensagem'] === 'string' ? { tipo: bruto['tipo'], mensagem: bruto['mensagem'] } : null;
      case 'fim':
        return { tipo: 'fim' };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Envia uma pergunta e repassa os eventos do streaming.
 *
 * @throws {ErroChat} Quando a rede falha, o tempo esgota ou a função
 *         recusa a requisição antes do streaming.
 */
export async function enviarPergunta({ pergunta, historico, conexao, aoEvento, sinal, idioma }: OpcoesEnvio): Promise<void> {
  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), TIMEOUT_MS);
  sinal?.addEventListener('abort', () => controlador.abort(), { once: true });

  try {
    const resposta = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Idioma da resposta do modelo e das mensagens do servidor.
        'Accept-Language': idioma === 'en' ? 'en' : 'pt-BR',
        Authorization: `Bearer ${conexao.chave}`,
      },
      body: JSON.stringify({ pergunta, historico, provedor: conexao.provedor, modelo: conexao.modelo }),
      signal: controlador.signal,
    });

    if (!resposta.ok || !resposta.body) throw new ErroChat(await mensagemDeErro(resposta), resposta.status);

    const leitor = resposta.body.getReader();
    const decodificador = new TextDecoder();
    let pendente = '';

    for (;;) {
      const { value, done } = await leitor.read();
      if (done) break;
      pendente += decodificador.decode(value, { stream: true });

      let quebra = pendente.indexOf('\n');
      while (quebra !== -1) {
        const evento = lerEvento(pendente.slice(0, quebra));
        pendente = pendente.slice(quebra + 1);
        if (evento) aoEvento(evento);
        quebra = pendente.indexOf('\n');
      }
    }
    const final = lerEvento(pendente);
    if (final) aoEvento(final);
  } catch (erro) {
    if (erro instanceof ErroChat) throw erro;
    if (erro instanceof DOMException && erro.name === 'AbortError') {
      if (sinal?.aborted) throw new ErroChat(textosAtuais().chat.interrompida, 499);
      throw new ErroChat(textosAtuais().chat.erros.demorou);
    }
    throw new ErroChat(textosAtuais().chat.erros.semConexao);
  } finally {
    clearTimeout(timeout);
  }
}
