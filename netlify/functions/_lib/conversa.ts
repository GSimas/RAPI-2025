/**
 * ==========================================================
 * Chamada em streaming aos provedores de IA
 * ==========================================================
 *
 * Normaliza dois formatos de API num único gerador assíncrono de
 * trechos de texto:
 *
 * - **OpenAI-compatível** (`/chat/completions`, SSE com
 *   `choices[0].delta.content`) — OpenRouter, OpenAI, Gemini, DeepSeek,
 *   Mistral, Groq e xAI;
 * - **Anthropic** (`/messages`, SSE com eventos `content_block_delta`).
 *
 * Alguns modelos (de raciocínio, por exemplo) rejeitam `temperature` ou
 * `max_tokens`; nesse caso a requisição é refeita, uma única vez, apenas
 * com os parâmetros essenciais.
 */

import { cabecalhosAutenticacao, type Provedor } from './provedores';
import { LIMITES } from './guardrails';

/** Turno de conversa já higienizado. */
export interface Turno {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

/** Um evento do gerador: texto novo e/ou o modelo efetivamente usado. */
export interface EventoGeracao {
  readonly texto?: string;
  readonly modelo?: string;
}

/** Falha do provedor com o status HTTP original. */
export class ErroProvedor extends Error {
  constructor(readonly status: number) {
    super(`Provedor respondeu HTTP ${status}`);
    this.name = 'ErroProvedor';
  }
}

/** Temperatura baixa: respostas fiéis ao relatório. */
const TEMPERATURA = 0.2;

/**
 * Lê um corpo SSE e produz o campo `data` de cada evento.
 */
async function* lerSse(corpo: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const leitor = corpo.getReader();
  const decodificador = new TextDecoder();
  let pendente = '';

  try {
    for (;;) {
      const { value, done } = await leitor.read();
      if (done) break;
      pendente += decodificador.decode(value, { stream: true });

      let quebra = pendente.indexOf('\n');
      while (quebra !== -1) {
        const linha = pendente.slice(0, quebra).replace(/\r$/, '');
        pendente = pendente.slice(quebra + 1);
        if (linha.startsWith('data:')) yield linha.slice(5).trim();
        quebra = pendente.indexOf('\n');
      }
    }
    if (pendente.startsWith('data:')) yield pendente.slice(5).trim();
  } finally {
    leitor.releaseLock();
  }
}

/** Lê uma propriedade aninhada de um JSON desconhecido. */
function caminho(objeto: unknown, ...chaves: (string | number)[]): unknown {
  let atual = objeto;
  for (const chave of chaves) {
    if (typeof atual !== 'object' || atual === null) return undefined;
    atual = (atual as Record<string | number, unknown>)[chave];
  }
  return atual;
}

/**
 * A Anthropic exige alternância estrita user/assistant começando por
 * `user`: turnos consecutivos do mesmo papel são fundidos.
 */
function alternarPapeis(turnos: readonly Turno[]): Turno[] {
  const resultado: Turno[] = [];
  for (const turno of turnos) {
    const ultimo = resultado[resultado.length - 1];
    if (ultimo && ultimo.role === turno.role) {
      resultado[resultado.length - 1] = { role: turno.role, content: `${ultimo.content}\n\n${turno.content}` };
    } else {
      resultado.push(turno);
    }
  }
  while (resultado[0]?.role === 'assistant') resultado.shift();
  return resultado;
}

/** Envia a requisição e devolve a resposta, lançando `ErroProvedor` se não for 2xx. */
async function postar(url: string, cabecalhos: Record<string, string>, corpo: unknown, sinal: AbortSignal): Promise<Response> {
  const resposta = await fetch(url, {
    method: 'POST',
    headers: cabecalhos,
    body: JSON.stringify(corpo),
    signal: sinal,
    redirect: 'error',
  });
  if (!resposta.ok || !resposta.body) {
    // Descarta o corpo do erro sem repassá-lo (pode conter detalhes internos).
    await resposta.body?.cancel().catch(() => undefined);
    throw new ErroProvedor(resposta.status);
  }
  return resposta;
}

/**
 * Gera a resposta do modelo em streaming.
 *
 * @param provedor Provedor do catálogo (URL fixa no servidor).
 * @param chave Credencial do usuário — usada só no cabeçalho de autenticação.
 * @param modelo Identificador validado do modelo.
 * @param sistema Instrução de sistema (guardrails).
 * @param turnos Histórico + pergunta atual, já higienizados.
 * @param origem Origem do site, para atribuição na OpenRouter.
 * @param sinal Cancelamento (tempo limite ou cliente desconectado).
 */
export async function* gerarResposta(
  provedor: Provedor,
  chave: string,
  modelo: string,
  sistema: string,
  turnos: readonly Turno[],
  origem: string,
  sinal: AbortSignal,
): AsyncGenerator<EventoGeracao> {
  const cabecalhos = cabecalhosAutenticacao(provedor, chave, origem);

  // --- Anthropic -------------------------------------------------------
  if (provedor.formato === 'anthropic') {
    const corpo = {
      model: modelo,
      system: sistema,
      messages: alternarPapeis(turnos),
      max_tokens: LIMITES.tokensSaida,
      temperature: TEMPERATURA,
      stream: true,
    };

    let resposta: Response;
    try {
      resposta = await postar(`${provedor.base}/messages`, cabecalhos, corpo, sinal);
    } catch (erro) {
      if (!(erro instanceof ErroProvedor) || erro.status !== 400) throw erro;
      const { temperature: _t, ...essencial } = corpo;
      resposta = await postar(`${provedor.base}/messages`, cabecalhos, essencial, sinal);
    }

    for await (const dados of lerSse(resposta.body as ReadableStream<Uint8Array>)) {
      let evento: unknown;
      try {
        evento = JSON.parse(dados);
      } catch {
        continue;
      }
      const tipo = caminho(evento, 'type');
      if (tipo === 'message_start') {
        const usado = caminho(evento, 'message', 'model');
        if (typeof usado === 'string') yield { modelo: usado };
      } else if (tipo === 'content_block_delta') {
        const texto = caminho(evento, 'delta', 'text');
        if (typeof texto === 'string' && texto) yield { texto };
      } else if (tipo === 'error') {
        throw new ErroProvedor(502);
      }
    }
    return;
  }

  // --- OpenAI-compatível ------------------------------------------------
  const mensagens = [{ role: 'system', content: sistema }, ...turnos];
  const limiteTokens =
    provedor.id === 'openai'
      ? { max_completion_tokens: LIMITES.tokensSaida }
      : { max_tokens: LIMITES.tokensSaida };

  const url = `${provedor.base}/chat/completions`;
  let resposta: Response;
  try {
    resposta = await postar(
      url,
      cabecalhos,
      { model: modelo, messages: mensagens, stream: true, temperature: TEMPERATURA, ...limiteTokens },
      sinal,
    );
  } catch (erro) {
    if (!(erro instanceof ErroProvedor) || (erro.status !== 400 && erro.status !== 422)) throw erro;
    resposta = await postar(url, cabecalhos, { model: modelo, messages: mensagens, stream: true }, sinal);
  }

  let modeloInformado = false;
  for await (const dados of lerSse(resposta.body as ReadableStream<Uint8Array>)) {
    if (dados === '[DONE]') break;

    let pedaco: unknown;
    try {
      pedaco = JSON.parse(dados);
    } catch {
      continue;
    }

    // A OpenRouter informa erros no meio do stream como `{ error: { code } }`.
    const erroNoStream = caminho(pedaco, 'error');
    if (erroNoStream) {
      const codigo = Number(caminho(erroNoStream, 'code'));
      throw new ErroProvedor(Number.isInteger(codigo) && codigo >= 400 ? codigo : 502);
    }

    if (!modeloInformado) {
      const usado = caminho(pedaco, 'model');
      if (typeof usado === 'string' && usado) {
        modeloInformado = true;
        yield { modelo: usado };
      }
    }

    const texto = caminho(pedaco, 'choices', 0, 'delta', 'content');
    if (typeof texto === 'string' && texto) yield { texto };
  }
}
