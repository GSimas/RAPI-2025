/**
 * ==========================================================
 * POST /api/modelos — modelos disponíveis por provedor
 * ==========================================================
 *
 * Lista os modelos de chat de um provedor do catálogo. Serve a dois
 * propósitos:
 *
 * - **OpenRouter**: catálogo público completo, com a marcação dos
 *   modelos gratuitos (não exige chave; em cache por 10 minutos);
 * - **BYOK**: lista os modelos visíveis para a chave informada — o que
 *   também valida a chave antes de o usuário conversar.
 *
 * A credencial, quando necessária, vem no cabeçalho `Authorization` e
 * nunca é armazenada nem registrada.
 */

import { MENSAGENS, idiomaDe, traduzirStatusProvedor } from './_lib/mensagens';
import { cabecalhosAutenticacao, lerProvedor, type Provedor } from './_lib/provedores';
import {
  lerCorpoJson,
  lerCredencial,
  origemDoSite,
  origemPermitida,
  responderErro,
  responderJson,
  verificarLimite,
} from './_lib/seguranca';

/** Um modelo como devolvido ao cliente. */
interface ModeloResumo {
  id: string;
  nome: string;
  gratis?: boolean;
  contexto?: number;
}

/** Modelo virtual da OpenRouter que roteia entre os modelos gratuitos. */
const ROTEADOR_GRATIS: ModeloResumo = {
  id: 'openrouter/free',
  nome: 'Roteamento automático de modelos grátis',
  gratis: true,
};

/** Modelos que não servem para chat (embeddings, áudio, imagem…). */
const NAO_CHAT =
  /embed|whisper|tts|transcri|dall-e|image|imagen|moderation|realtime|audio|speech|search-preview|computer-use|davinci|babbage|rerank|guard|veo|lyria|aqa/i;

let cacheOpenRouter: { expira: number; modelos: ModeloResumo[] } | null = null;

/** Lê uma propriedade de um objeto desconhecido. */
function prop(objeto: unknown, chave: string): unknown {
  return typeof objeto === 'object' && objeto !== null ? (objeto as Record<string, unknown>)[chave] : undefined;
}

/** Catálogo público da OpenRouter. */
async function modelosOpenRouter(): Promise<ModeloResumo[]> {
  if (cacheOpenRouter && cacheOpenRouter.expira > Date.now()) return cacheOpenRouter.modelos;

  const resposta = await fetch('https://openrouter.ai/api/v1/models', {
    signal: AbortSignal.timeout(15_000),
    redirect: 'error',
  });
  if (!resposta.ok) throw new Error(String(resposta.status));

  const corpo: unknown = await resposta.json();
  const lista = Array.isArray(prop(corpo, 'data')) ? (prop(corpo, 'data') as unknown[]) : [];

  const modelos: ModeloResumo[] = [];
  for (const item of lista) {
    const id = prop(item, 'id');
    if (typeof id !== 'string') continue;

    // Somente modelos que produzem texto.
    const saidas = prop(prop(item, 'architecture'), 'output_modalities');
    if (Array.isArray(saidas) && !saidas.includes('text')) continue;

    const preco = prop(item, 'pricing');
    const gratis = prop(preco, 'prompt') === '0' && prop(preco, 'completion') === '0';
    const nome = prop(item, 'name');
    const contexto = prop(item, 'context_length');

    modelos.push({
      id,
      nome: typeof nome === 'string' ? nome : id,
      gratis,
      ...(typeof contexto === 'number' ? { contexto } : {}),
    });
  }

  modelos.sort((a, b) => a.nome.localeCompare(b.nome, 'en'));
  const semRoteador = modelos.filter((modelo) => modelo.id !== ROTEADOR_GRATIS.id);
  const resultado = [ROTEADOR_GRATIS, ...semRoteador];

  cacheOpenRouter = { expira: Date.now() + 10 * 60_000, modelos: resultado };
  return resultado;
}

/** Modelos visíveis para a chave do usuário (BYOK). */
async function modelosDoProvedor(provedor: Provedor, chave: string, origem: string): Promise<ModeloResumo[] | number> {
  const cabecalhos = cabecalhosAutenticacao(provedor, chave, origem);
  delete cabecalhos['content-type'];

  const url = provedor.formato === 'anthropic' ? `${provedor.base}/models?limit=1000` : `${provedor.base}/models`;
  const resposta = await fetch(url, { headers: cabecalhos, signal: AbortSignal.timeout(15_000), redirect: 'error' });
  if (!resposta.ok) return resposta.status;

  const corpo: unknown = await resposta.json();
  const lista = prop(corpo, 'data') ?? prop(corpo, 'models');
  if (!Array.isArray(lista)) return [];

  return lista
    .map((item): ModeloResumo | null => {
      const bruto = prop(item, 'id') ?? prop(item, 'name');
      if (typeof bruto !== 'string') return null;
      const id = bruto.replace(/^models\//, '');
      const nome = prop(item, 'display_name') ?? prop(item, 'displayName');
      return { id, nome: typeof nome === 'string' ? nome : id };
    })
    .filter((modelo): modelo is ModeloResumo => modelo !== null && !NAO_CHAT.test(modelo.id))
    .sort((a, b) => a.id.localeCompare(b.id, 'en'));
}

/**
 * Ponto de entrada da função serverless.
 */
export default async function handler(request: Request): Promise<Response> {
  const idioma = idiomaDe(request);
  const m = MENSAGENS[idioma];

  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method !== 'POST') return responderErro(m.metodo, 405, { Allow: 'POST' });
  if (!origemPermitida(request)) return responderErro(m.origem, 403);

  const espera = verificarLimite(request, 'modelos', 20, 60_000);
  if (espera > 0) return responderErro(m.aguarde(espera), 429, { 'Retry-After': String(espera) });

  const dados = await lerCorpoJson(request, 2_000, idioma);
  if (dados instanceof Response) return dados;

  const provedor = lerProvedor(prop(dados, 'provedor'));
  if (!provedor) return responderErro(m.provedor, 400);

  try {
    if (!provedor.modelosExigemChave) {
      const modelos = (await modelosOpenRouter()).map((modelo) =>
        modelo.id === ROTEADOR_GRATIS.id ? { ...modelo, nome: m.roteadorGratis } : modelo,
      );
      return responderJson({ modelos }, 200, { 'Cache-Control': 'private, max-age=600' });
    }

    const chave = lerCredencial(request);
    if (!chave) return responderErro(m.informeChave, 401);

    const resultado = await modelosDoProvedor(provedor, chave, origemDoSite(request));
    if (typeof resultado === 'number') {
      console.warn(`[modelos] ${provedor.id} respondeu HTTP ${resultado}`);
      return responderErro(traduzirStatusProvedor(resultado, provedor.nome, idioma), resultado === 401 || resultado === 403 ? 401 : 502);
    }
    if (resultado.length === 0) return responderErro(m.semModelos(provedor.nome), 404);

    return responderJson({ modelos: resultado });
  } catch {
    console.warn(`[modelos] falha ao consultar ${provedor.id}`);
    return responderErro(m.falhaModelos(provedor.nome), 502);
  }
}
