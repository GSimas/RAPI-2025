/**
 * ==========================================================
 * Conteúdo editorial no idioma ativo
 * ==========================================================
 *
 * Cada texto longo do relatório existe em dois arquivos com a mesma
 * forma (`*.ts` em português e `*.en.ts` em inglês). Os componentes
 * pedem o conteúdo por aqui, nunca importando um idioma diretamente.
 *
 * O texto do relatório vive em `./conteudoRelatorio`, separado, para entrar
 * só no chunk (lazy) da página Relatório.
 */

import { usePreferencias } from '@/hooks/usePreferencias';
import * as apresentacaoPt from './apresentacao';
import * as apresentacaoEn from './apresentacao.en';

export type ConteudoApresentacao = Pick<
  typeof apresentacaoPt,
  'SECOES_INTRODUTORIAS' | 'LEGENDA_SEMAFORO' | 'SERIES_SEMAFORO' | 'CARDS_DIMENSOES' | 'EVOLUCAO_SEMAFORIZACAO'
>;

const APRESENTACAO: Record<'pt' | 'en', ConteudoApresentacao> = { pt: apresentacaoPt, en: apresentacaoEn };

/** Conteúdo da página inicial no idioma ativo. */
export function useConteudoApresentacao(): ConteudoApresentacao {
  return APRESENTACAO[usePreferencias().idioma];
}
