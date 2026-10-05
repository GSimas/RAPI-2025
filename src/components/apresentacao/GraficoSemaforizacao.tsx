/**
 * ==========================================================
 * <GraficoSemaforizacao /> - evolução histórica da semaforização
 * ==========================================================
 *
 * Porte do `go.Figure` com `barmode="stack"` da aba de Apresentação:
 * cinco séries empilhadas (2020-2024) com as cores oficiais do semáforo.
 *
 * Eixos, grade e tooltip derivam do tema ativo; as barras crescem ao
 * aparecer, em sequência de baixo para cima.
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
import { useConteudoApresentacao } from '@/content';
import { usePreferencias } from '@/hooks/usePreferencias';
import { DURACAO_ANIMACAO_GRAFICO, FONTE_GRAFICO, paletaGrafico } from '@/lib/paletaGrafico';

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
  const { reduzirMovimento } = usePreferencias();
  const { EVOLUCAO_SEMAFORIZACAO, SERIES_SEMAFORO } = useConteudoApresentacao();
  const ticks = { fill: paleta.textoSuave, fontSize: 11, fontFamily: FONTE_GRAFICO };

  return (
    <div className="h-[380px] w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...EVOLUCAO_SEMAFORIZACAO]}
          margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
          barCategoryGap="28%"
        >
          <CartesianGrid stroke={paleta.grade} vertical={false} />

          <XAxis
            dataKey="ano"
            tick={ticks}
            tickLine={false}
            axisLine={{ stroke: paleta.eixo }}
          />

          <YAxis tick={ticks} tickLine={false} axisLine={false} width={48} />

          <Tooltip
            cursor={{ fill: paleta.destaque }}
            contentStyle={{
              backgroundColor: paleta.fundoTooltip,
              border: `1px solid ${paleta.bordaTooltip}`,
              borderRadius: 2,
              color: paleta.texto,
              fontSize: 12,
              fontFamily: FONTE_GRAFICO,
              boxShadow: '0 12px 32px -12px rgba(0,0,0,0.35)',
            }}
            labelStyle={{ color: paleta.texto, fontWeight: 500, marginBottom: 4 }}
            itemStyle={{ color: paleta.texto, padding: 0 }}
          />

          <Legend
            verticalAlign="top"
            align="left"
            iconType="square"
            iconSize={8}
            wrapperStyle={{
              fontSize: 11,
              fontFamily: FONTE_GRAFICO,
              color: paleta.textoSuave,
              paddingBottom: 16,
            }}
          />

          {SERIES_SEMAFORO.map((serie, indice) => (
            <Bar
              key={serie.chave}
              dataKey={serie.chave}
              name={serie.rotulo}
              stackId="semaforo"
              fill={serie.cor}
              isAnimationActive={!reduzirMovimento}
              animationBegin={indice * 120}
              animationDuration={DURACAO_ANIMACAO_GRAFICO}
              animationEasing="ease-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
