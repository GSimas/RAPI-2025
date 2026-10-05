/**
 * ==========================================================
 * POST /api/chat — Assistente RAPI (Netlify Function)
 * ==========================================================
 *
 * O usuário traz o próprio acesso ao modelo — via login OpenRouter
 * (OAuth PKCE) ou chave de um provedor (BYOK). A credencial chega no
 * cabeçalho `Authorization`, é usada apenas para chamar o provedor
 * escolhido e nunca é armazenada nem registrada.
 *
 * Pipeline de uma requisição:
 *
 *   1. origem, limite de taxa, tamanho e formato do corpo;
 *   2. validação de provedor, modelo e credencial;
 *   3. higiene da pergunta e do histórico, mascaramento de dados pessoais;
 *   4. detecção de injeção de prompt (recusa sem chamar o modelo);
 *   5. RAG por palavras-chave sobre o texto do relatório;
 *   6. chamada em streaming ao provedor, com instrução de sistema
 *      restritiva e vigilância da saída (canário + tamanho máximo).
 *
 * Resposta: `application/x-ndjson`, uma linha JSON por evento:
 *
 *   {"tipo":"aviso","mensagem":"…"}      dados pessoais mascarados
 *   {"tipo":"modelo","modelo":"…"}       modelo efetivamente usado
 *   {"tipo":"delta","texto":"…"}         trecho da resposta
 *   {"tipo":"bloqueio","mensagem":"…"}   recusa dos guardrails
 *   {"tipo":"erro","mensagem":"…"}       falha durante a geração
 *   {"tipo":"fim"}                       término normal
 *
 * Erros anteriores ao streaming voltam como JSON `{ erro }` com status HTTP.
 */

import { TEXTO_RAPI_COMPLETO } from './_lib/corpus';
import { ErroProvedor, gerarResposta, type Turno } from './_lib/conversa';
import {
  LIMITES,
  limparTexto,
  mascararDadosPessoais,
  montarInstrucoesSistema,
  montarMensagemUsuario,
  neutralizarDelimitadores,
  pareceInjecao,
  saidaVazaInstrucoes,
} from './_lib/guardrails';
import { MENSAGENS, idiomaDe, traduzirStatusProvedor } from './_lib/mensagens';
import { lerModelo, lerProvedor } from './_lib/provedores';
import { buscarContextoRelevante } from './_lib/rag';
import {
  lerCorpoJson,
  lerCredencial,
  origemDoSite,
  origemPermitida,
  responderErro,
  verificarLimite,
} from './_lib/seguranca';

/** Tamanho máximo do corpo da requisição, em bytes. */
const MAXIMO_CORPO = 96_000;

/** Tempo máximo da geração (o streaming na Netlify vai até 60 s). */
const TEMPO_LIMITE_MS = 55_000;

/** Pedidos por IP: 12 por minuto. */
const LIMITE_POR_MINUTO = 12;

/** Um evento da resposta NDJSON. */
type Evento =
  | { tipo: 'aviso'; mensagem: string }
  | { tipo: 'modelo'; modelo: string }
  | { tipo: 'delta'; texto: string }
  | { tipo: 'bloqueio'; mensagem: string }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'fim' };

const CABECALHOS_STREAM: Record<string, string> = {
  'Content-Type': 'application/x-ndjson; charset=utf-8',
  'Cache-Control': 'no-store, no-transform',
  'X-Content-Type-Options': 'nosniff',
};

/** Resposta curta, sem chamar o modelo (bloqueios dos guardrails). */
function responderEventos(eventos: readonly Evento[]): Response {
  const corpo = eventos.map((evento) => JSON.stringify(evento)).join('\n') + '\n';
  return new Response(corpo, { status: 200, headers: CABECALHOS_STREAM });
}

/**
 * Valida e higieniza o histórico enviado pelo cliente.
 * Turnos inválidos são descartados; o total respeita o orçamento.
 */
function lerHistorico(valor: unknown): { turnos: Turno[]; mascarados: string[] } {
  const mascarados = new Set<string>();
  const brutos = Array.isArray(valor) ? valor.slice(-LIMITES.turnos) : [];

  const turnos: Turno[] = [];
  for (const item of brutos) {
    if (typeof item !== 'object' || item === null) continue;
    const registro = item as Record<string, unknown>;
    if (registro['role'] !== 'user' && registro['role'] !== 'assistant') continue;
    if (typeof registro['content'] !== 'string') continue;

    const limpo = limparTexto(registro['content']).slice(0, LIMITES.turno);
    if (!limpo) continue;

    const { texto, encontrados } = mascararDadosPessoais(limpo);
    encontrados.forEach((tipo) => mascarados.add(tipo));
    turnos.push({ role: registro['role'], content: neutralizarDelimitadores(texto) });
  }

  // Orçamento total: descarta os turnos mais antigos.
  let total = turnos.reduce((soma, turno) => soma + turno.content.length, 0);
  while (total > LIMITES.historicoTotal && turnos.length > 0) {
    total -= turnos.shift()?.content.length ?? 0;
  }

  return { turnos, mascarados: [...mascarados] };
}

/**
 * Ponto de entrada da função serverless.
 */
export default async function handler(request: Request): Promise<Response> {
  const idioma = idiomaDe(request);
  const m = MENSAGENS[idioma];

  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method !== 'POST') return responderErro(m.metodo, 405, { Allow: 'POST' });

  // --- 1. Origem, taxa e corpo ------------------------------------------
  if (!origemPermitida(request)) return responderErro(m.origem, 403);

  const espera = verificarLimite(request, 'chat', LIMITE_POR_MINUTO, 60_000);
  if (espera > 0) {
    return responderErro(
      m.muitasPerguntas(espera),
      429,
      { 'Retry-After': String(espera) },
    );
  }

  const dados = await lerCorpoJson(request, MAXIMO_CORPO, idioma);
  if (dados instanceof Response) return dados;
  if (typeof dados !== 'object' || dados === null) return responderErro(m.corpoInvalido, 400);
  const corpo = dados as Record<string, unknown>;

  // --- 2. Provedor, modelo e credencial ---------------------------------
  const provedor = lerProvedor(corpo['provedor']);
  if (!provedor) return responderErro(m.provedor, 400);

  const modelo = lerModelo(corpo['modelo']);
  if (!modelo) return responderErro(m.modelo, 400);

  const chave = lerCredencial(request);
  if (!chave) return responderErro(m.conecte, 401);

  // --- 3. Higiene e dados pessoais --------------------------------------
  const perguntaBruta = typeof corpo['pergunta'] === 'string' ? limparTexto(corpo['pergunta']) : '';
  if (!perguntaBruta) return responderErro(m.pergunta, 400);
  if (perguntaBruta.length > LIMITES.pergunta) {
    return responderErro(m.perguntaLonga(LIMITES.pergunta), 413);
  }

  const { texto: perguntaMascarada, encontrados } = mascararDadosPessoais(perguntaBruta);
  const historico = lerHistorico(corpo['historico']);
  const mascarados = [...new Set([...encontrados, ...historico.mascarados])];

  const avisos: Evento[] =
    mascarados.length > 0
      ? [
          {
            tipo: 'aviso',
            mensagem: m.mascarados(mascarados.map((tipo) => m.tipos[tipo] ?? tipo).join(', ')),
          },
        ]
      : [];

  // --- 4. Injeção de prompt ---------------------------------------------
  if (pareceInjecao(perguntaMascarada)) {
    return responderEventos([...avisos, { tipo: 'bloqueio', mensagem: m.injecao }, { tipo: 'fim' }]);
  }

  // --- 5. RAG ------------------------------------------------------------
  const pergunta = neutralizarDelimitadores(perguntaMascarada);
  const trechos = buscarContextoRelevante(pergunta, TEXTO_RAPI_COMPLETO);
  const turnos: Turno[] = [...historico.turnos, { role: 'user', content: montarMensagemUsuario(pergunta, trechos) }];

  // --- 6. Geração em streaming -----------------------------------------
  const controlador = new AbortController();
  const tempoLimite = setTimeout(() => controlador.abort(), TEMPO_LIMITE_MS);
  request.signal.addEventListener('abort', () => controlador.abort(), { once: true });

  const codificador = new TextEncoder();
  const origem = origemDoSite(request);

  const fluxo = new ReadableStream<Uint8Array>({
    async start(saida) {
      const emitir = (evento: Evento): void => {
        saida.enqueue(codificador.encode(`${JSON.stringify(evento)}\n`));
      };

      avisos.forEach(emitir);
      let acumulado = '';

      try {
        for await (const evento of gerarResposta(
          provedor,
          chave,
          modelo,
          montarInstrucoesSistema(idioma),
          turnos,
          origem,
          controlador.signal,
        )) {
          if (evento.modelo) emitir({ tipo: 'modelo', modelo: evento.modelo });
          if (!evento.texto) continue;

          acumulado += evento.texto;
          if (saidaVazaInstrucoes(acumulado)) {
            emitir({ tipo: 'bloqueio', mensagem: m.saidaBloqueada });
            controlador.abort();
            break;
          }
          if (acumulado.length > LIMITES.resposta) {
            emitir({ tipo: 'aviso', mensagem: m.tamanhoMaximo });
            controlador.abort();
            break;
          }
          emitir({ tipo: 'delta', texto: evento.texto });
        }

        if (!acumulado && !controlador.signal.aborted) {
          emitir({ tipo: 'erro', mensagem: m.semConteudo });
        }
        emitir({ tipo: 'fim' });
      } catch (erro) {
        if (erro instanceof ErroProvedor) {
          console.warn(`[chat] ${provedor.id} respondeu HTTP ${erro.status}`);
          emitir({ tipo: 'erro', mensagem: traduzirStatusProvedor(erro.status, provedor.nome, idioma) });
        } else if (controlador.signal.aborted) {
          emitir({ tipo: 'erro', mensagem: m.demorou });
        } else {
          console.error(`[chat] falha inesperada com ${provedor.id}: ${erro instanceof Error ? erro.name : 'erro'}`);
          emitir({ tipo: 'erro', mensagem: m.falhaGeral });
        }
        emitir({ tipo: 'fim' });
      } finally {
        clearTimeout(tempoLimite);
        saida.close();
      }
    },
    cancel() {
      controlador.abort();
      clearTimeout(tempoLimite);
    },
  });

  return new Response(fluxo, { status: 200, headers: CABECALHOS_STREAM });
}
