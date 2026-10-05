/**
 * ==========================================================
 * Mensagens das funções do assistente (PT / EN)
 * ==========================================================
 *
 * O idioma vem do cabeçalho `Accept-Language`, que o cliente preenche com
 * o idioma escolhido no painel de configurações (e não o do navegador).
 */

export type Idioma = 'pt' | 'en';

/** Idioma da requisição: inglês se `Accept-Language` começar com `en`. */
export function idiomaDe(request: Request): Idioma {
  return (request.headers.get('accept-language') ?? '').trim().toLowerCase().startsWith('en') ? 'en' : 'pt';
}

const pt = {
  metodo: 'Método não permitido. Use POST.',
  origem: 'Origem não autorizada.',
  muitasPerguntas: (s: number) => `Muitas perguntas em sequência. Aguarde ${s} s e tente novamente.`,
  aguarde: (s: number) => `Aguarde ${s} s e tente novamente.`,
  corpoInvalido: 'Corpo da requisição inválido.',
  corpoGrande: 'Requisição grande demais.',
  corpoTipo: 'Envie o corpo como application/json.',
  corpoJson: 'Corpo da requisição não é um JSON válido.',
  provedor: 'Provedor de IA não suportado.',
  modelo: 'Identificador de modelo inválido.',
  conecte: 'Conecte-se a um provedor de IA para usar o assistente.',
  informeChave: 'Informe a chave de API do provedor.',
  pergunta: 'Informe uma pergunta.',
  mascarados: (tipos: string) => `Por segurança, removemos dados sensíveis antes do envio (${tipos}).`,
  tipos: {
    credencial: 'credencial',
    'e-mail': 'e-mail',
    CNPJ: 'CNPJ',
    CPF: 'CPF',
    telefone: 'telefone',
    'número de cartão': 'número de cartão',
  } as Record<string, string>,
  injecao:
    'Não posso alterar minhas regras de funcionamento nem revelar instruções internas. ' +
    'Posso ajudar com perguntas sobre os indicadores, a semaforização e as recomendações do RAPI 2024-2025 — ' +
    'por exemplo: *"Quais indicadores de saneamento estão em situação crítica?"*',
  saidaBloqueada:
    'A resposta foi interrompida pelos controles de segurança do assistente. Reformule a pergunta com foco nos dados do relatório.',
  semConteudo: 'O modelo não retornou conteúdo. Tente novamente ou troque de modelo.',
  demorou: 'O modelo demorou demais para responder. Tente uma pergunta mais objetiva.',
  falhaGeral: 'Não foi possível concluir a resposta. Tente novamente em instantes.',
  semModelos: (provedor: string) => `Nenhum modelo de chat disponível para esta chave na ${provedor}.`,
  falhaModelos: (provedor: string) => `Não foi possível consultar os modelos da ${provedor}. Tente novamente.`,
  roteadorGratis: 'Roteamento automático de modelos grátis',
  status: {
    401: (p: string) =>
      `A chave de acesso foi recusada pela ${p} (inválida, expirada ou sem permissão para este modelo). Conecte-se novamente.`,
    402: (p: string) =>
      `Sua conta na ${p} não tem créditos para este modelo. Escolha um modelo gratuito ou adicione créditos.`,
    404: (p: string) => `O modelo escolhido não foi encontrado na ${p}. Selecione outro modelo.`,
    408: (p: string) => `A ${p} demorou demais para responder. Tente novamente.`,
    429: (p: string) =>
      `Limite de uso da ${p} atingido. Aguarde alguns instantes ou troque de modelo — modelos gratuitos têm limites baixos.`,
    400: (p: string) => `A ${p} recusou a requisição para este modelo. Tente outro modelo.`,
    500: (p: string) => `A ${p} está instável no momento. Tente novamente em instantes.`,
    outro: (p: string, s: number) => `Falha ao consultar a ${p} (HTTP ${s}).`,
  },
};

export type Mensagens = typeof pt;

const en: Mensagens = {
  metodo: 'Method not allowed. Use POST.',
  origem: 'Origin not allowed.',
  muitasPerguntas: (s: number) => `Too many questions in a row. Wait ${s} s and try again.`,
  aguarde: (s: number) => `Wait ${s} s and try again.`,
  corpoInvalido: 'Invalid request body.',
  corpoGrande: 'Request too large.',
  corpoTipo: 'Send the body as application/json.',
  corpoJson: 'The request body is not valid JSON.',
  provedor: 'Unsupported AI provider.',
  modelo: 'Invalid model identifier.',
  conecte: 'Connect to an AI provider to use the assistant.',
  informeChave: 'Enter the provider API key.',
  pergunta: 'Please enter a question.',
  mascarados: (tipos: string) => `For your safety, sensitive data was removed before sending (${tipos}).`,
  tipos: {
    credencial: 'credential',
    'e-mail': 'e-mail',
    CNPJ: 'CNPJ',
    CPF: 'CPF',
    telefone: 'phone number',
    'número de cartão': 'card number',
  },
  injecao:
    'I cannot change my operating rules or reveal internal instructions. ' +
    'I can help with questions about the RAPI 2024-2025 indicators, ratings and recommendations — ' +
    'for example: *"Which sanitation indicators are in a critical situation?"*',
  saidaBloqueada:
    'The response was stopped by the assistant safety controls. Please rephrase the question focusing on the report data.',
  semConteudo: 'The model returned no content. Try again or switch models.',
  demorou: 'The model took too long to respond. Try a more focused question.',
  falhaGeral: 'The response could not be completed. Please try again shortly.',
  semModelos: (provedor: string) => `No chat model is available for this key at ${provedor}.`,
  falhaModelos: (provedor: string) => `Could not load ${provedor} models. Please try again.`,
  roteadorGratis: 'Automatic routing across free models',
  status: {
    401: (p: string) => `${p} rejected the access key (invalid, expired or not allowed for this model). Please reconnect.`,
    402: (p: string) => `Your ${p} account has no credits for this model. Pick a free model or add credits.`,
    404: (p: string) => `The selected model was not found at ${p}. Pick another model.`,
    408: (p: string) => `${p} took too long to respond. Please try again.`,
    429: (p: string) => `${p} usage limit reached. Wait a moment or switch models — free models have low limits.`,
    400: (p: string) => `${p} rejected the request for this model. Try another model.`,
    500: (p: string) => `${p} is unstable right now. Please try again shortly.`,
    outro: (p: string, s: number) => `Failed to query ${p} (HTTP ${s}).`,
  },
};

export const MENSAGENS: Readonly<Record<Idioma, Mensagens>> = { pt, en };

/**
 * Mensagem amigável para um status HTTP devolvido pelo provedor.
 * Nunca repassa o corpo do erro original (pode conter detalhes internos).
 */
export function traduzirStatusProvedor(status: number, nomeProvedor: string, idioma: Idioma): string {
  const s = MENSAGENS[idioma].status;
  if (status === 401 || status === 403) return s[401](nomeProvedor);
  if (status === 402) return s[402](nomeProvedor);
  if (status === 404) return s[404](nomeProvedor);
  if (status === 408 || status === 504) return s[408](nomeProvedor);
  if (status === 429) return s[429](nomeProvedor);
  if (status === 400 || status === 422) return s[400](nomeProvedor);
  if (status >= 500) return s[500](nomeProvedor);
  return s.outro(nomeProvedor, status);
}
