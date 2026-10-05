/**
 * ==========================================================
 * Definição das colunas do Explorador Geral
 * ==========================================================
 *
 * Reproduz a montagem do `df_final` do `app.py`:
 *
 *   identificação → 2024 (Original) → 2024 (Numérico) → 2023 (Original) → …
 *   → 2019 (Numérico) → faixas de semaforização
 *
 * Os anos vêm em ordem decrescente (mais recente primeiro) e cada ano
 * ocupa duas colunas intercaladas: o texto original e o valor extraído.
 *
 * O `tipo` de cada coluna define o filtro oferecido no cabeçalho:
 * classificações (dimensão, pilar, tema…) são `categoria`; textos livres
 * são `texto`; valores extraídos são `numero`.
 */

import type { ColunaTabela, TipoColuna } from '@/components/ui/tabela/modelo';
import type { Textos } from '@/i18n/textos';
import { formatarNumeroCompacto } from '@/lib/format';
import { ANOS, type AnoRAPI, type IndicadorRAPI } from '@/types/rapi';

/** Anos do mais recente para o mais antigo, como na tabela original. */
const ANOS_DECRESCENTES: readonly AnoRAPI[] = [...ANOS].reverse();

/** Coluna textual (livre ou categórica) a partir de um campo do indicador. */
function colunaTexto(
  id: string,
  titulo: string,
  tipo: Extract<TipoColuna, 'texto' | 'categoria'>,
  extrair: (i: IndicadorRAPI) => string | null,
  larguraMinima = 'min-w-40',
): ColunaTabela<IndicadorRAPI> {
  return {
    id,
    titulo,
    tipo,
    valor: (i) => extrair(i),
    exibir: (i) => extrair(i) ?? '',
    larguraMinima,
  };
}

/**
 * Todas as colunas do Explorador, na ordem de exibição, com títulos no
 * idioma ativo.
 */
export function criarColunas(t: Textos): readonly ColunaTabela<IndicadorRAPI>[] {
  const c = t.explorador.colunas;
  return [
    // --- Identificação -----------------------------------------------------
    colunaTexto('dimensao', c.dimensao, 'categoria', (i) => i.dimensao, 'min-w-32'),
    colunaTexto('pilar', c.pilar, 'categoria', (i) => i.pilar, 'min-w-52'),
    colunaTexto('tema', c.tema, 'categoria', (i) => i.tema, 'min-w-44'),
    colunaTexto('subtema', c.subtema, 'categoria', (i) => i.subtema, 'min-w-44'),
    colunaTexto('orgao', c.orgao, 'categoria', (i) => i.orgaoResponsavel, 'min-w-48'),
    colunaTexto('indicador', c.indicador, 'texto', (i) => i.indicador, 'min-w-96'),

    // --- Séries anuais intercaladas ---------------------------------------
    ...ANOS_DECRESCENTES.flatMap((ano): ColunaTabela<IndicadorRAPI>[] => [
      {
        id: `${ano}-original`,
        titulo: c.original(ano),
        tipo: 'texto',
        valor: (i) => i.dadosAnuais[ano] ?? null,
        exibir: (i) => i.dadosAnuais[ano] ?? '',
        larguraMinima: 'min-w-36',
      },
      {
        id: `${ano}-numerico`,
        titulo: c.numerico(ano),
        tipo: 'numero',
        valor: (i) => i.valoresNumericos[ano],
        exibir: (i) => formatarNumeroCompacto(i.valoresNumericos[ano]),
        larguraMinima: 'min-w-36',
      },
    ]),

    // --- Regras de semaforização ------------------------------------------
    colunaTexto('faixa-verde', c.faixaVerde, 'texto', (i) => i.faixas.verde ?? i.faixas.geral ?? null),
    colunaTexto('faixa-amarela', c.faixaAmarela, 'texto', (i) => i.faixas.amarelo ?? null),
    colunaTexto('faixa-vermelha', c.faixaVermelha, 'texto', (i) => i.faixas.vermelho ?? null),
  ];
}
