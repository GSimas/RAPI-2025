/**
 * ==========================================================
 * POST /api/chat — Assistente RAPI (Netlify Function)
 * ==========================================================
 *
 * Substitui a `chat_session` que vivia no `st.session_state` do Streamlit.
 * Como funções serverless são stateless, o histórico chega do cliente a
 * cada turno e é remontado aqui no formato `contents` do Gemini.
 *
 * Pipeline de uma requisição:
 *
 *   1. valida o método, o corpo e o tamanho da pergunta;
 *   2. monta a instrução de sistema com o CSV enxuto dos indicadores;
 *   3. recupera, via RAG por palavras-chave, só os trechos do relatório
 *      relevantes à pergunta (economia de tokens / Free Tier);
 *   4. chama o Gemini, caindo para um modelo de fallback se o preview
 *      estiver indisponível;
 *   5. devolve JSON com a resposta ou um erro tratado.
 *
 * A `GEMINI_API_KEY` é lida somente de `process.env` e jamais sai daqui.
 */

import { GoogleGenAI } from '@google/genai';
import { TEXTO_RAPI_COMPLETO } from './_lib/corpus';
import { montarCsvIndicadores } from './_lib/indicadoresCsv';
import { buscarContextoRelevante } from './_lib/rag';

// ==========================================================
// Configuração
// ==========================================================

/** Modelo preferencial, sobrescrevível por variável de ambiente. */
const MODELO_PADRAO = process.env['GEMINI_MODEL'] ?? 'gemini-3.1-flash-lite-preview';

/** Modelo estável usado se o preferencial não estiver disponível. */
const MODELO_FALLBACK = 'gemini-2.5-flash';

/** Temperatura baixa: respostas fiéis ao relatório, pouco criativas. */
const TEMPERATURA = 0.2;

/** Limite de caracteres de uma pergunta. */
const TAMANHO_MAXIMO_PERGUNTA = 2_000;

/** Quantidade de turnos anteriores reenviados ao modelo. */
const MAXIMO_TURNOS_HISTORICO = 12;

/** Cabeçalhos CORS e de conteúdo aplicados a todas as respostas. */
const CABECALHOS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

// ==========================================================
// Tipos do contrato HTTP
// ==========================================================

/** Um turno de conversa recebido do cliente. */
interface TurnoConversa {
  role: 'user' | 'assistant';
  content: string;
}

/** Corpo esperado na requisição. */
interface CorpoRequisicao {
  pergunta: string;
  historico: TurnoConversa[];
}

// ==========================================================
// Utilitários
// ==========================================================

/** Monta uma resposta JSON com os cabeçalhos padrão. */
function responder(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status, headers: CABECALHOS });
}

/** Resposta de erro padronizada. */
function erro(mensagem: string, status: number): Response {
  return responder({ erro: mensagem }, status);
}

/**
 * Valida e normaliza o corpo da requisição.
 *
 * @returns O corpo tipado, ou uma `Response` de erro pronta para retorno.
 */
function validarCorpo(dados: unknown): CorpoRequisicao | Response {
  if (typeof dados !== 'object' || dados === null) {
    return erro('Corpo da requisição inválido: era esperado um objeto JSON.', 400);
  }

  const bruto = dados as Record<string, unknown>;
  const pergunta = typeof bruto['pergunta'] === 'string' ? bruto['pergunta'].trim() : '';

  if (pergunta === '') {
    return erro('Informe uma pergunta.', 400);
  }
  if (pergunta.length > TAMANHO_MAXIMO_PERGUNTA) {
    return erro(
      `A pergunta excede o limite de ${TAMANHO_MAXIMO_PERGUNTA} caracteres.`,
      413,
    );
  }

  // O histórico é opcional; entradas malformadas são simplesmente ignoradas.
  const historicoBruto = Array.isArray(bruto['historico']) ? bruto['historico'] : [];

  const historico: TurnoConversa[] = historicoBruto
    .filter((turno): turno is Record<string, unknown> => typeof turno === 'object' && turno !== null)
    .map((turno) => ({
      role: turno['role'] === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: typeof turno['content'] === 'string' ? turno['content'] : '',
    }))
    .filter((turno) => turno.content.trim() !== '')
    .slice(-MAXIMO_TURNOS_HISTORICO);

  return { pergunta, historico };
}

/**
 * Instrução de sistema do assistente.
 *
 * Mantém as três regras do prompt original e embute o CSV enxuto dos
 * indicadores (montado uma vez por instância da função).
 */
function montarInstrucoes(): string {
  return `Você é o Especialista Analítico do RAPI 2024-2025 de Florianópolis.

REGRAS:
1. Responda às perguntas baseando-se no CSV de indicadores abaixo e no Contexto Adicional que o usuário enviará a cada pergunta.
2. Seja técnico, fiel ao texto e analítico.
3. Se a informação não estiver no CSV nem no contexto fornecido, diga que não possui essa informação.
4. Responda sempre em português do Brasil, usando Markdown simples (parágrafos, listas e negrito).

DADOS DOS INDICADORES (CSV, separado por ponto e vírgula):
${montarCsvIndicadores()}`;
}

/** Formato de conteúdo aceito pelo SDK do Gemini. */
interface ConteudoGemini {
  role: 'user' | 'model';
  parts: { text: string }[];
}

/**
 * Converte o histórico do cliente e a pergunta enriquecida no formato
 * `contents` esperado pelo SDK.
 */
function montarConteudos(
  historico: readonly TurnoConversa[],
  perguntaEnriquecida: string,
): ConteudoGemini[] {
  const conteudos: ConteudoGemini[] = historico.map((turno) => ({
    role: turno.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: turno.content }],
  }));

  conteudos.push({ role: 'user', parts: [{ text: perguntaEnriquecida }] });
  return conteudos;
}

// ==========================================================
// Handler
// ==========================================================

/**
 * Ponto de entrada da função serverless.
 */
export default async function handler(request: Request): Promise<Response> {
  // --- Preflight CORS ---------------------------------------------------
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CABECALHOS });
  }

  if (request.method !== 'POST') {
    return erro('Método não permitido. Use POST.', 405);
  }

  // --- Chave de API ------------------------------------------------------
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    console.error('[chat] GEMINI_API_KEY não configurada no ambiente.');
    return erro(
      'Assistente indisponível: a chave da API do Gemini não está configurada no servidor.',
      503,
    );
  }

  // --- Corpo da requisição ----------------------------------------------
  let dados: unknown;
  try {
    dados = await request.json();
  } catch {
    return erro('Não foi possível interpretar o corpo da requisição como JSON.', 400);
  }

  const validado = validarCorpo(dados);
  if (validado instanceof Response) return validado;

  const { pergunta, historico } = validado;

  // --- RAG: injeta apenas os trechos relevantes -------------------------
  const trecho = buscarContextoRelevante(pergunta, TEXTO_RAPI_COMPLETO);
  const perguntaEnriquecida = trecho
    ? `Pergunta: ${pergunta}\n\n[TRECHOS DO RELATÓRIO PARA TE AJUDAR NA RESPOSTA]:\n${trecho}`
    : pergunta;

  // --- Chamada ao Gemini -------------------------------------------------
  const ai = new GoogleGenAI({ apiKey });
  const conteudos = montarConteudos(historico, perguntaEnriquecida);
  const configuracao = {
    systemInstruction: montarInstrucoes(),
    temperature: TEMPERATURA,
  };

  /** Executa uma tentativa contra um modelo específico. */
  const tentar = async (modelo: string): Promise<string> => {
    const resposta = await ai.models.generateContent({
      model: modelo,
      contents: conteudos,
      config: configuracao,
    });

    const texto = resposta.text?.trim();
    if (!texto) {
      throw new Error('O modelo retornou uma resposta vazia.');
    }
    return texto;
  };

  try {
    const texto = await tentar(MODELO_PADRAO);
    return responder({ resposta: texto, modelo: MODELO_PADRAO });
  } catch (falhaPrimaria) {
    console.warn(
      `[chat] Falha com o modelo "${MODELO_PADRAO}": ${descreverErro(falhaPrimaria)}. ` +
        `Tentando o fallback "${MODELO_FALLBACK}".`,
    );

    // O modelo preview pode não estar liberado para a chave em uso;
    // nesse caso, o fallback estável assume sem quebrar a experiência.
    if (MODELO_PADRAO === MODELO_FALLBACK) {
      return erro(traduzirErro(falhaPrimaria), 502);
    }

    try {
      const texto = await tentar(MODELO_FALLBACK);
      return responder({ resposta: texto, modelo: MODELO_FALLBACK });
    } catch (falhaFallback) {
      console.error(`[chat] Falha também no fallback: ${descreverErro(falhaFallback)}`);
      return erro(traduzirErro(falhaFallback), 502);
    }
  }
}

// ==========================================================
// Tratamento de erros
// ==========================================================

/** Extrai uma descrição textual de um erro desconhecido, para log. */
function descreverErro(erroDesconhecido: unknown): string {
  if (erroDesconhecido instanceof Error) return erroDesconhecido.message;
  return String(erroDesconhecido);
}

/**
 * Converte a falha da API em uma mensagem apresentável ao usuário,
 * sem vazar detalhes internos nem a chave de acesso.
 */
function traduzirErro(erroDesconhecido: unknown): string {
  const detalhe = descreverErro(erroDesconhecido).toLowerCase();

  if (detalhe.includes('quota') || detalhe.includes('resource_exhausted') || detalhe.includes('429')) {
    return 'O limite de uso da API do Gemini foi atingido. Tente novamente em alguns minutos.';
  }
  if (detalhe.includes('api key') || detalhe.includes('unauthenticated') || detalhe.includes('401')) {
    return 'A chave da API do Gemini é inválida ou expirou. Verifique a configuração do servidor.';
  }
  if (detalhe.includes('safety') || detalhe.includes('blocked')) {
    return 'A resposta foi bloqueada pelos filtros de segurança do modelo. Tente reformular a pergunta.';
  }
  if (detalhe.includes('deadline') || detalhe.includes('timeout')) {
    return 'O modelo demorou demais para responder. Tente uma pergunta mais objetiva.';
  }

  return 'Ops! Tivemos um problema ao consultar o assistente. Tente novamente em instantes.';
}
