/**
 * ==========================================================
 * Carga e normalizacao do dataset RAPI
 * ==========================================================
 *
 * O JSON e importado como `unknown` (ver `src/types/json.d.ts`) e validado
 * aqui em runtime. Isso mantem a checagem de tipos rapida e garante que o
 * restante da aplicacao trabalhe apenas com `IndicadorRAPI` bem formado.
 *
 * O modulo tambem reproduz o `fillna("Geral")` aplicado a `tema`/`subtema`
 * no `app.py` original.
 */

import brutoJson from '@dados/dados_rapi_completo.json';
import { ANOS, type AnoRAPI, type DadosAnuais, type Dimensao, type FaixasSemaforizacao, type IndicadorRAPI } from '@/types/rapi';
import { extrairSerieNumerica } from './numeroParser';
import { resolverTaxonomia } from './taxonomia';

/** Le uma propriedade de um objeto desconhecido de forma segura. */
function prop(objeto: unknown, chave: string): unknown {
  if (typeof objeto !== 'object' || objeto === null) return undefined;
  return (objeto as Record<string, unknown>)[chave];
}

/** Converte um valor desconhecido em `string` limpa, ou `null`. */
function comoTextoOuNulo(valor: unknown): string | null {
  if (typeof valor === 'string') {
    const limpo = valor.trim();
    return limpo === '' ? null : limpo;
  }
  if (typeof valor === 'number' && Number.isFinite(valor)) return String(valor);
  return null;
}

/**
 * Converte um valor desconhecido em `string`, aplicando um padrao quando
 * ausente — equivalente ao `fillna` do pandas.
 */
function comoTexto(valor: unknown, padrao: string): string {
  return comoTextoOuNulo(valor) ?? padrao;
}

/** Normaliza o bloco `faixas_semaforizacao`, descartando chaves vazias. */
function normalizarFaixas(valor: unknown): FaixasSemaforizacao {
  const faixas: FaixasSemaforizacao = {};
  if (typeof valor !== 'object' || valor === null) return faixas;

  for (const chave of ['verde', 'amarelo', 'vermelho', 'geral'] as const) {
    const texto = comoTextoOuNulo((valor as Record<string, unknown>)[chave]);
    if (texto !== null) faixas[chave] = texto;
  }
  return faixas;
}

/** Normaliza o bloco `dados_anuais`, mantendo apenas os anos conhecidos. */
function normalizarDadosAnuais(valor: unknown): DadosAnuais {
  const serie: DadosAnuais = {};
  if (typeof valor !== 'object' || valor === null) return serie;

  for (const ano of ANOS) {
    serie[ano] = comoTextoOuNulo((valor as Record<string, unknown>)[ano]);
  }
  return serie;
}

/**
 * Converte um registro bruto do JSON em um `IndicadorRAPI` completo,
 * calculando a serie numerica e a posicao na taxonomia.
 *
 * @param bruto Registro cru do JSON.
 * @param indice Posicao no arquivo, usada como parte do `id` estavel.
 */
function normalizarIndicador(bruto: unknown, indice: number): IndicadorRAPI {
  const tema = comoTexto(prop(bruto, 'tema'), 'Geral');
  const subtema = comoTexto(prop(bruto, 'subtema'), 'Geral');
  const { dimensao, pilar } = resolverTaxonomia(tema);

  const dadosAnuais = normalizarDadosAnuais(prop(bruto, 'dados_anuais'));
  const idFloripa = comoTextoOuNulo(prop(bruto, 'id_floripa'));

  return {
    // O `id_floripa` se repete em algumas linhas; o indice garante unicidade.
    id: `${idFloripa ?? 'sid'}-${indice}`,
    dimensao,
    pilar,
    tema,
    subtema,
    idCes: comoTextoOuNulo(prop(bruto, 'id_ces')),
    idNovaOrdem: comoTextoOuNulo(prop(bruto, 'id_nova_ordem')),
    idFloripa,
    ods: comoTextoOuNulo(prop(bruto, 'ods')),
    orgaoResponsavel: comoTexto(prop(bruto, 'orgao_responsavel'), 'Não informado'),
    indicador: comoTexto(prop(bruto, 'indicador'), 'Indicador sem descrição'),
    faixas: normalizarFaixas(prop(bruto, 'faixas_semaforizacao')),
    dadosAnuais,
    valoresNumericos: extrairSerieNumerica<AnoRAPI>(dadosAnuais, ANOS),
  };
}

/**
 * Base completa de indicadores do RAPI 2024-2025, normalizada uma unica vez
 * no carregamento do modulo.
 */
export const INDICADORES: readonly IndicadorRAPI[] = Array.isArray(brutoJson)
  ? brutoJson.map(normalizarIndicador)
  : [];

/** Total de indicadores carregados (206 registros no dataset atual). */
export const TOTAL_INDICADORES = INDICADORES.length;

/** Ordena strings segundo as regras do portugues brasileiro. */
const colator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

/** Devolve os valores distintos de uma lista, ordenados em pt-BR. */
function distintosOrdenados(valores: readonly string[]): string[] {
  return [...new Set(valores)].sort(colator.compare);
}

/** Dimensoes presentes no dataset, na ordem canonica do relatorio. */
export const DIMENSOES_DISPONIVEIS: readonly Dimensao[] = (
  ['Ambiental', 'Urbana', 'Fiscal'] as const
).filter((d) => INDICADORES.some((i) => i.dimensao === d));

/** Pilares de uma dimensao (ou de todas, quando `dimensao` for `null`). */
export function pilaresDe(dimensao: string | null): string[] {
  const base = dimensao ? INDICADORES.filter((i) => i.dimensao === dimensao) : INDICADORES;
  return distintosOrdenados(base.map((i) => i.pilar));
}

/** Temas de um pilar, respeitando a dimensao selecionada. */
export function temasDe(dimensao: string | null, pilar: string | null): string[] {
  const base = INDICADORES.filter(
    (i) => (!dimensao || i.dimensao === dimensao) && (!pilar || i.pilar === pilar),
  );
  return distintosOrdenados(base.map((i) => i.tema));
}

/** Subtemas de um tema, respeitando os filtros acima na hierarquia. */
export function subtemasDe(
  dimensao: string | null,
  pilar: string | null,
  tema: string | null,
): string[] {
  const base = INDICADORES.filter(
    (i) =>
      (!dimensao || i.dimensao === dimensao) &&
      (!pilar || i.pilar === pilar) &&
      (!tema || i.tema === tema),
  );
  return distintosOrdenados(base.map((i) => i.subtema));
}

/** Indicadores que satisfazem a combinacao de filtros encadeados. */
export function indicadoresDe(
  dimensao: string | null,
  pilar: string | null,
  tema: string | null,
  subtema: string | null,
): IndicadorRAPI[] {
  return INDICADORES.filter(
    (i) =>
      (!dimensao || i.dimensao === dimensao) &&
      (!pilar || i.pilar === pilar) &&
      (!tema || i.tema === tema) &&
      (!subtema || i.subtema === subtema),
  );
}

/** Busca um indicador pelo `id` estavel. */
export function buscarIndicador(id: string): IndicadorRAPI | undefined {
  return INDICADORES.find((i) => i.id === id);
}
