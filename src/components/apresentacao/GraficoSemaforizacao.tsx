/**
 * ==========================================================
 * <GraficoSemaforizacao /> - evolução histórica da semaforização
 * ==========================================================
 *
 * Porte do `go.Figure` com `barmode="stack"` da aba de Apresentação:
 * cinco séries empilhadas (2020-2024) com as cores oficiais do semáforo.
 *
 * Todas as cores de eixo, grade e tooltip derivam do tema ativo, para
 * manter contraste adequado nos modos claro e escuro.
 */

import type { JSX } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EVOLUCAO_SEMAFORIZACAO, SERIES_SEMAFORO } from '@/content/apresentacao';
import { paletaGrafico } from '@/lib/paletaGrafico';

interface GraficoSemaforizacaoProps {
  /** Se o tema escuro está ativo. */
  readonly escuro: boolean;
}

/**
 * Gráfico de barras empilhadas com a distribuição anual dos indicadores
 * por cor de semaforização.
 */
export function GraficoSemaforizacao({ escuro }: GraficoSemaforizacaoProps): JSX.Element {
  const paleta = paletaGrafico(escuro);

  return (
    <div className="h-[360px] w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...EVOLUCAO_SEMAFORIZACAO]}
          margin={{ top: 8, right: 8, left: -12, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={paleta.grade} vertical={false} />

          <XAxis
            dataKey="ano"
            stroke={paleta.eixo}
            tick={{ fill: paleta.texto, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: paleta.grade }}
            label={{
              value: 'Ano de Avaliação',
              position: 'insideBottom',
              offset: -2,
              fill: paleta.textoSuave,
              fontSize: 11,
            }}
          />

          <YAxis
            stroke={paleta.eixo}
            tick={{ fill: paleta.texto, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />

          <Tooltip
            cursor={{ fill: paleta.destaque }}
            contentStyle={{
              backgroundColor: paleta.fundoTooltip,
              border: `1px solid ${paleta.bordaTooltip}`,
              borderRadius: 8,
              color: paleta.texto,
              fontSize: 12,
            }}
            labelStyle={{ color: paleta.texto, fontWeight: 600 }}
            itemStyle={{ color: paleta.texto }}
          />

          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={9}
            wrapperStyle={{ fontSize: 11, color: paleta.texto, paddingBottom: 12 }}
          />

          {SERIES_SEMAFORO.map((serie) => (
            <Bar
              key={serie.chave}
              dataKey={serie.chave}
              name={serie.rotulo}
              stackId="semaforo"
              fill={serie.cor}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
