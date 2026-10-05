/**
 * Conteúdo da página Relatório no idioma ativo. Fica fora de `./index.ts`
 * para que os textos longos só sejam baixados com o chunk da página.
 */

import { usePreferencias } from '@/hooks/usePreferencias';
import * as relatorioPt from './relatorio';
import * as relatorioEn from './relatorio.en';

export type ConteudoRelatorio = Pick<
  typeof relatorioPt,
  | 'INTRODUCAO_CONSIDERACOES'
  | 'BLOCOS_CONSIDERACOES'
  | 'CONSIDERACOES_FINAIS'
  | 'AGRADECIMENTOS_INTRO'
  | 'GRUPO_TRABALHO'
  | 'NOTA_LICENCA'
>;

const RELATORIO: Record<'pt' | 'en', ConteudoRelatorio> = { pt: relatorioPt, en: relatorioEn };

/** Conteúdo da página de relatório no idioma ativo. */
export function useConteudoRelatorio(): ConteudoRelatorio {
  return RELATORIO[usePreferencias().idioma];
}
