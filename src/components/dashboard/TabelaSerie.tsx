/**
 * ==========================================================
 * <TabelaSerie /> - dados brutos do indicador
 * ==========================================================
 *
 * Equivalente ao `st.dataframe(df_hist)` da sub-aba "Dados Brutos":
 * ano, valor original do relatório, valor numérico extraído e a cor
 * resultante da semaforização.
 */

import type { JSX } from 'react';
import { formatarNumeroCompacto, TEXTO_SEM_DADO } from '@/lib/format';
import { ROTULOS_SEMAFORO } from '@/lib/semaforo';
import type { PontoHistorico } from '@/types/rapi';

interface TabelaSerieProps {
  readonly serie: readonly PontoHistorico[];
}

/**
 * Tabela compacta da série histórica de um único indicador.
 */
export function TabelaSerie({ serie }: TabelaSerieProps): JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-sm">
        <caption className="sr-only">
          Série histórica do indicador: valores originais, numéricos e classificação semafórica.
        </caption>

        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th scope="col" className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">
              Ano
            </th>
            <th scope="col" className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">
              Valor Original
            </th>
            <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">
              Valor Numérico
            </th>
            <th scope="col" className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">
              Semaforização
            </th>
          </tr>
        </thead>

        <tbody>
          {serie.map((ponto) => (
            <tr
              key={ponto.ano}
              className="border-b border-slate-100 last:border-0 dark:border-slate-800"
            >
              <th scope="row" className="px-3 py-2 text-left font-medium text-slate-800 dark:text-slate-100">
                {ponto.ano}
              </th>

              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                {ponto.valorOriginal ?? TEXTO_SEM_DADO}
              </td>

              <td className="px-3 py-2 text-right font-mono text-slate-700 tabular-nums dark:text-slate-300">
                {ponto.valorNumerico === null ? '—' : formatarNumeroCompacto(ponto.valorNumerico)}
              </td>

              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <span
                    aria-hidden="true"
                    className="inline-block size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: ponto.cor }}
                  />
                  {ROTULOS_SEMAFORO[ponto.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
