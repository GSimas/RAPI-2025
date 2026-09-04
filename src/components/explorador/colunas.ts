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
 */

import { ANOS, type AnoRAPI, type IndicadorRAPI } from '@/types/rapi';
import { formatarNumeroCompacto } from '@/lib/format';

/** Como uma coluna deve ser alinhada e ordenada. */
export type TipoColuna = 'texto' | 'numero';

/** Descrição de uma coluna da tabela. */
export interface ColunaExplorador {
  readonly id: string;
  readonly titulo: string;
  readonly tipo: TipoColuna;
  /** Valor bruto usado para ordenar e exportar. */
  readonly valor: (indicador: IndicadorRAPI) => string | number | null;
  /** Texto exibido na célula. */
  readonly exibir: (indicador: IndicadorRAPI) => string;
  /** Largura mínima sugerida (classe utilitária do Tailwind). */
  readonly larguraMinima: string;
}

/** Anos do mais recente para o mais antigo, como na tabela original. */
const ANOS_DECRESCENTES: readonly AnoRAPI[] = [...ANOS].reverse();

/** Coluna de texto simples a partir de um campo do indicador. */
function colunaTexto(
  id: string,
  titulo: string,
  extrair: (i: IndicadorRAPI) => string | null,
  larguraMinima = 'min-w-40',
): ColunaExplorador {
  return {
    id,
    titulo,
    tipo: 'texto',
    valor: (i) => extrair(i),
    exibir: (i) => extrair(i) ?? '',
    larguraMinima,
  };
}

/**
 * Todas as colunas do Explorador, na ordem de exibição.
 */
export const COLUNAS: readonly ColunaExplorador[] = [
  // --- Identificação -----------------------------------------------------
  colunaTexto('dimensao', 'Dimensão', (i) => i.dimensao, 'min-w-28'),
  colunaTexto('pilar', 'Pilar', (i) => i.pilar, 'min-w-52'),
  colunaTexto('tema', 'Tema', (i) => i.tema, 'min-w-44'),
  colunaTexto('subtema', 'Subtema', (i) => i.subtema, 'min-w-44'),
  colunaTexto('orgao', 'Órgão Responsável', (i) => i.orgaoResponsavel, 'min-w-40'),
  colunaTexto('indicador', 'Indicador', (i) => i.indicador, 'min-w-96'),

  // --- Séries anuais intercaladas ---------------------------------------
  ...ANOS_DECRESCENTES.flatMap((ano): ColunaExplorador[] => [
    {
      id: `${ano}-original`,
      titulo: `${ano} (Original)`,
      tipo: 'texto',
      valor: (i) => i.dadosAnuais[ano] ?? null,
      exibir: (i) => i.dadosAnuais[ano] ?? '',
      larguraMinima: 'min-w-32',
    },
    {
      id: `${ano}-numerico`,
      titulo: `${ano} (Numérico)`,
      tipo: 'numero',
      valor: (i) => i.valoresNumericos[ano],
      exibir: (i) => formatarNumeroCompacto(i.valoresNumericos[ano]),
      larguraMinima: 'min-w-28',
    },
  ]),

  // --- Regras de semaforização ------------------------------------------
  colunaTexto('faixa-verde', 'Faixa Verde', (i) => i.faixas.verde ?? i.faixas.geral ?? null, 'min-w-40'),
  colunaTexto('faixa-amarela', 'Faixa Amarela', (i) => i.faixas.amarelo ?? null, 'min-w-40'),
  colunaTexto('faixa-vermelha', 'Faixa Vermelha', (i) => i.faixas.vermelho ?? null, 'min-w-40'),
];
