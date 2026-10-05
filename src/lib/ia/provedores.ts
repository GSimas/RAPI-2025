/**
 * ==========================================================
 * Provedores de IA (lado do cliente)
 * ==========================================================
 *
 * Metadados de exibição dos provedores aceitos pelo assistente. As URLs
 * das APIs NÃO ficam aqui: o servidor mantém o catálogo autoritativo
 * (`netlify/functions/_lib/provedores.ts`) e o cliente envia apenas o id.
 */

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

export interface ProvedorIA {
  readonly id: IdProvedor;
  readonly nome: string;
  /** Onde o usuário gera a chave de API. */
  readonly urlChave: string;
  /** Dica do formato da chave, para o placeholder. */
  readonly exemploChave: string;
  /** Padrões de modelo preferidos como padrão, em ordem. */
  readonly preferidos: readonly RegExp[];
}

export const PROVEDORES: Readonly<Record<IdProvedor, ProvedorIA>> = {
  openrouter: {
    id: 'openrouter',
    nome: 'OpenRouter',
    urlChave: 'https://openrouter.ai/settings/keys',
    exemploChave: 'sk-or-v1-…',
    preferidos: [/^openrouter\/free$/],
  },
  openai: {
    id: 'openai',
    nome: 'OpenAI',
    urlChave: 'https://platform.openai.com/api-keys',
    exemploChave: 'sk-…',
    preferidos: [/^gpt-5(\.\d+)?-mini$/, /^gpt-4\.1-mini$/, /^gpt-4o-mini$/, /mini/],
  },
  anthropic: {
    id: 'anthropic',
    nome: 'Anthropic',
    urlChave: 'https://console.anthropic.com/settings/keys',
    exemploChave: 'sk-ant-…',
    preferidos: [/sonnet/, /haiku/],
  },
  gemini: {
    id: 'gemini',
    nome: 'Google Gemini',
    urlChave: 'https://aistudio.google.com/apikey',
    exemploChave: 'AIza…',
    preferidos: [/^gemini-[\d.]+-flash$/, /flash-lite/, /flash/],
  },
  deepseek: {
    id: 'deepseek',
    nome: 'DeepSeek',
    urlChave: 'https://platform.deepseek.com/api_keys',
    exemploChave: 'sk-…',
    preferidos: [/^deepseek-chat$/],
  },
  mistral: {
    id: 'mistral',
    nome: 'Mistral',
    urlChave: 'https://console.mistral.ai/api-keys',
    exemploChave: 'chave de 32 caracteres',
    preferidos: [/^mistral-small-latest$/, /^mistral-medium-latest$/, /small/],
  },
  groq: {
    id: 'groq',
    nome: 'Groq',
    urlChave: 'https://console.groq.com/keys',
    exemploChave: 'gsk_…',
    preferidos: [/llama-3\.3-70b/, /llama/],
  },
  xai: {
    id: 'xai',
    nome: 'xAI',
    urlChave: 'https://console.x.ai',
    exemploChave: 'xai-…',
    preferidos: [/grok.*mini/, /grok/],
  },
};

/** Provedores oferecidos na opção BYOK (todos, inclusive a OpenRouter por chave). */
export const PROVEDORES_BYOK: readonly ProvedorIA[] = [
  PROVEDORES.openai,
  PROVEDORES.anthropic,
  PROVEDORES.gemini,
  PROVEDORES.deepseek,
  PROVEDORES.mistral,
  PROVEDORES.groq,
  PROVEDORES.xai,
  PROVEDORES.openrouter,
];

/** É um id de provedor conhecido? */
export function ehProvedor(valor: unknown): valor is IdProvedor {
  return typeof valor === 'string' && (IDS_PROVEDORES as readonly string[]).includes(valor);
}

/** Escolhe o modelo padrão de uma lista, segundo as preferências do provedor. */
export function escolherModeloPadrao(provedor: IdProvedor, ids: readonly string[]): string | undefined {
  for (const padrao of PROVEDORES[provedor].preferidos) {
    const encontrado = ids.find((id) => padrao.test(id));
    if (encontrado) return encontrado;
  }
  return ids[0];
}
