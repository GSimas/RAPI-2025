/**
 * ==========================================================
 * Catálogo de provedores de IA (lado do servidor)
 * ==========================================================
 *
 * Fonte única e fixa dos endpoints aceitos. O cliente informa apenas o
 * *identificador* do provedor; a URL vem sempre daqui. Isso impede que a
 * função seja usada como proxy para hosts arbitrários (SSRF).
 *
 * Quase todos os provedores expõem uma API compatível com a da OpenAI
 * (`/chat/completions`); a Anthropic usa o formato próprio `/messages`.
 */

/** Formato de API do provedor. */
export type FormatoApi = 'openai' | 'anthropic';

/** Definição de um provedor. */
export interface Provedor {
  readonly id: IdProvedor;
  readonly nome: string;
  /** URL base, sem barra final. */
  readonly base: string;
  readonly formato: FormatoApi;
  /** A listagem de modelos exige a chave do usuário? */
  readonly modelosExigemChave: boolean;
}

export const IDS_PROVEDORES = [
  'openrouter',
  'openai',
  'anthropic',
  'gemini',
  'deepseek',
  'mistral',
  'groq',
  'xai',
] as const;

export type IdProvedor = (typeof IDS_PROVEDORES)[number];

export const PROVEDORES: Readonly<Record<IdProvedor, Provedor>> = {
  openrouter: {
    id: 'openrouter',
    nome: 'OpenRouter',
    base: 'https://openrouter.ai/api/v1',
    formato: 'openai',
    modelosExigemChave: false,
  },
  openai: {
    id: 'openai',
    nome: 'OpenAI',
    base: 'https://api.openai.com/v1',
    formato: 'openai',
    modelosExigemChave: true,
  },
  anthropic: {
    id: 'anthropic',
    nome: 'Anthropic',
    base: 'https://api.anthropic.com/v1',
    formato: 'anthropic',
    modelosExigemChave: true,
  },
  gemini: {
    id: 'gemini',
    nome: 'Google Gemini',
    base: 'https://generativelanguage.googleapis.com/v1beta/openai',
    formato: 'openai',
    modelosExigemChave: true,
  },
  deepseek: {
    id: 'deepseek',
    nome: 'DeepSeek',
    base: 'https://api.deepseek.com',
    formato: 'openai',
    modelosExigemChave: true,
  },
  mistral: {
    id: 'mistral',
    nome: 'Mistral',
    base: 'https://api.mistral.ai/v1',
    formato: 'openai',
    modelosExigemChave: true,
  },
  groq: {
    id: 'groq',
    nome: 'Groq',
    base: 'https://api.groq.com/openai/v1',
    formato: 'openai',
    modelosExigemChave: true,
  },
  xai: {
    id: 'xai',
    nome: 'xAI',
    base: 'https://api.x.ai/v1',
    formato: 'openai',
    modelosExigemChave: true,
  },
};

/** Valida e devolve o provedor a partir de um valor desconhecido. */
export function lerProvedor(valor: unknown): Provedor | null {
  return typeof valor === 'string' && (IDS_PROVEDORES as readonly string[]).includes(valor)
    ? PROVEDORES[valor as IdProvedor]
    : null;
}

/** Identificadores de modelo: letras, dígitos e `. _ : / @ + ~ -`. */
const PADRAO_MODELO = /^[\w.:/@+~-]{1,128}$/;

/** Valida o identificador de modelo informado pelo cliente. */
export function lerModelo(valor: unknown): string | null {
  return typeof valor === 'string' && PADRAO_MODELO.test(valor) ? valor : null;
}

/** Cabeçalhos de autenticação de cada formato. */
export function cabecalhosAutenticacao(provedor: Provedor, chave: string, origem: string): Record<string, string> {
  if (provedor.formato === 'anthropic') {
    return {
      'x-api-key': chave,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    };
  }

  const cabecalhos: Record<string, string> = {
    authorization: `Bearer ${chave}`,
    'content-type': 'application/json',
  };

  // Atribuição recomendada pela OpenRouter para identificar o app.
  if (provedor.id === 'openrouter') {
    cabecalhos['HTTP-Referer'] = origem;
    cabecalhos['X-Title'] = 'RAPI 2024-2025 - Florianopolis';
  }

  return cabecalhos;
}
