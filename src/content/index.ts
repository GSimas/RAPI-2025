/**
 * ==========================================================
 * Conteúdo editorial no idioma ativo
 * ==========================================================
 *
 * Cada texto longo do relatório existe em dois arquivos com a mesma
 * forma (`*.ts` em português e `*.en.ts` em inglês). Os componentes
 * pedem o conteúdo por aqui, nunca importando um idioma diretamente.
 */

import { usePreferencias } from '@/hooks/usePreferencias';
import * as apresentacaoPt from './apresentacao';
import * as apresentacaoEn from './apresentacao.en';
import * as relatorioPt from './relatorio';
import * as relatorioEn from './relatorio.en';

export type ConteudoApresentacao = Pick<
  typeof apresentacaoPt,
  'SECOES_INTRODUTORIAS' | 'LEGENDA_SEMAFORO' | 'SERIES_SEMAFORO' | 'CARDS_DIMENSOES' | 'EVOLUCAO_SEMAFORIZACAO'
>;

export type ConteudoRelatorio = Pick<
  typeof relatorioPt,
  | 'INTRODUCAO_CONSIDERACOES'
  | 'BLOCOS_CONSIDERACOES'
  | 'CONSIDERACOES_FINAIS'
  | 'AGRADECIMENTOS_INTRO'
  | 'GRUPO_TRABALHO'
  | 'NOTA_LICENCA'
>;

const APRESENTACAO: Record<'pt' | 'en', ConteudoApresentacao> = { pt: apresentacaoPt, en: apresentacaoEn };
const RELATORIO: Record<'pt' | 'en', ConteudoRelatorio> = { pt: relatorioPt, en: relatorioEn };

/** Conteúdo da página inicial no idioma ativo. */
export function useConteudoApresentacao(): ConteudoApresentacao {
  return APRESENTACAO[usePreferencias().idioma];
}

/** Conteúdo da página de relatório no idioma ativo. */
export function useConteudoRelatorio(): ConteudoRelatorio {
  return RELATORIO[usePreferencias().idioma];
}
