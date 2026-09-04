/**
 * ==========================================================
 * Montagem da série histórica de um indicador
 * ==========================================================
 *
 * Equivale ao `df_hist` do `app.py`: para cada ano, reúne o valor textual
 * original, o valor numérico extraído e a cor do semáforo **daquele ano
 * específico** — avaliada contra as faixas do próprio indicador.
 */

import { ANOS, type IndicadorRAPI, type PontoHistorico } from '@/types/rapi';
import { avaliarCorSemaforo, avaliarStatusSemaforo } from './semaforo';

/**
 * Constrói a série histórica completa de um indicador.
 *
 * @param indicador Indicador já normalizado.
 * @returns Um ponto por ano, na ordem cronológica de `ANOS`.
 */
export function montarSerieHistorica(indicador: IndicadorRAPI): PontoHistorico[] {
  return ANOS.map((ano) => {
    const valorNumerico = indicador.valoresNumericos[ano];

    return {
      ano,
      valorOriginal: indicador.dadosAnuais[ano] ?? null,
      valorNumerico,
      status: avaliarStatusSemaforo(valorNumerico, indicador.faixas),
      cor: avaliarCorSemaforo(valorNumerico, indicador.faixas),
    };
  });
}

/**
 * Indica se a série possui ao menos um valor numérico plotável.
 *
 * Espelha a checagem `df_plot.dropna(subset=["Valor_Numerico"]).empty` que
 * decidia entre desenhar o gráfico ou exibir o aviso de dados textuais.
 */
export function possuiDadosPlotaveis(serie: readonly PontoHistorico[]): boolean {
  return serie.some((ponto) => ponto.valorNumerico !== null);
}
