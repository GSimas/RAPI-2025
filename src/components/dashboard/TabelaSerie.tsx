/**
 * ==========================================================
 * <TabelaSerie /> - dados brutos do indicador
 * ==========================================================
 *
 * Equivalente ao `st.dataframe(df_hist)` da sub-aba "Dados Brutos":
 * ano, valor original do relatório, valor numérico extraído e a cor
 * resultante da semaforização — com filtros, ordenação e exportação.
 */

import { useMemo, type JSX } from 'react';
import { TabelaDados } from '@/components/ui/tabela/TabelaDados';
import type { ColunaTabela } from '@/components/ui/tabela/modelo';
import { usePreferencias } from '@/hooks/usePreferencias';
import { slugArquivo } from '@/lib/csv';
import { formatarNumeroCompacto, TEXTO_SEM_DADO } from '@/lib/format';
import type { PontoHistorico } from '@/types/rapi';

interface TabelaSerieProps {
  readonly serie: readonly PontoHistorico[];
  /** Nome do indicador, usado no arquivo exportado. */
  readonly indicador: string;
}

/**
 * Tabela compacta da série histórica de um único indicador.
 */
export function TabelaSerie({ serie, indicador }: TabelaSerieProps): JSX.Element {
  const { t, idioma } = usePreferencias();
  const ts = t.serie;

  const colunas = useMemo<readonly ColunaTabela<PontoHistorico>[]>(
    () => [
      {
        id: 'ano',
        titulo: ts.ano,
        tipo: 'categoria',
        valor: (ponto) => ponto.ano,
        render: (ponto) => <span className="font-mono font-medium text-ink">{ponto.ano}</span>,
        larguraMinima: 'min-w-24',
      },
      {
        id: 'original',
        titulo: ts.original,
        tipo: 'texto',
        valor: (ponto) => ponto.valorOriginal ?? null,
        exibir: (ponto) => ponto.valorOriginal ?? TEXTO_SEM_DADO,
        larguraMinima: 'min-w-48',
      },
      {
        id: 'numerico',
        titulo: ts.numerico,
        tipo: 'numero',
        valor: (ponto) => ponto.valorNumerico,
        exibir: (ponto) => (ponto.valorNumerico === null ? '' : formatarNumeroCompacto(ponto.valorNumerico)),
        larguraMinima: 'min-w-36',
      },
      {
        id: 'semaforo',
        titulo: ts.semaforo,
        tipo: 'categoria',
        valor: (ponto) => t.semaforo.rotulos[ponto.status],
        render: (ponto) => (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="inline-block size-2 shrink-0" style={{ backgroundColor: ponto.cor }} />
            {t.semaforo.rotulos[ponto.status]}
          </span>
        ),
        larguraMinima: 'min-w-40',
      },
    ],
    // `idioma` também muda o formato dos números exibidos.
    [t, idioma],
  );

  return (
    <TabelaDados
      // Recria a tabela (e seus filtros) ao trocar de idioma: os valores categóricos mudam.
      key={idioma}
      colunas={colunas}
      linhas={serie}
      chaveLinha={(ponto) => String(ponto.ano)}
      legenda={ts.legenda}
      nomeArquivo={`rapi-serie-${slugArquivo(indicador, 50)}`}
      tituloPlanilha={ts.planilha}
      alturaMaxima="max-h-[28rem]"
    />
  );
}
