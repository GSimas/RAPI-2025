/**
 * ==========================================================
 * <GraficoEvolucao /> - evolução histórica do indicador
 * ==========================================================
 *
 * Porte do gráfico combinado do `app.py`:
 *
 * 1. **Barras** com cor definida individualmente pela regra de
 *    semaforização aplicada ao valor **daquele ano**;
 * 2. **Linha de tendência** tracejada em amarelo "sinal", com marcadores
 *    e rótulos numéricos em pt-BR posicionados sobre os pontos.
 *
 * As barras crescem e a linha se desenha ao trocar de indicador.
 */

import type { JSX } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePreferencias } from '@/hooks/usePreferencias';
import { formatarNumero, localeNumeros } from '@/lib/format';
import { DURACAO_ANIMACAO_GRAFICO, FONTE_GRAFICO, paletaGrafico } from '@/lib/paletaGrafico';
import type { PontoHistorico } from '@/types/rapi';

interface GraficoEvolucaoProps {
  readonly serie: readonly PontoHistorico[];
  readonly escuro: boolean;
}

/** Estrutura de cada payload recebido pelo tooltip customizado. */
interface ItemTooltip {
  readonly payload?: PontoHistorico;
}

interface TooltipProps {
  readonly active?: boolean;
  readonly payload?: readonly ItemTooltip[];
  readonly escuro: boolean;
}

/**
 * Tooltip que mostra o valor numérico, o texto original e o status
 * semafórico do ano sob o cursor.
 */
function TooltipEvolucao({ active, payload, escuro }: TooltipProps): JSX.Element | null {
  if (!active || !payload || payload.length === 0) return null;

  const ponto = payload[0]?.payload;
  if (!ponto) return null;

  const paleta = paletaGrafico(escuro);
  const { t } = usePreferencias();

  return (
    <div
      className="border px-3.5 py-3 text-xs shadow-2xl"
      style={{
        backgroundColor: paleta.fundoTooltip,
        borderColor: paleta.bordaTooltip,
        color: paleta.texto,
      }}
    >
      <p className="rotulo">{ponto.ano}</p>

      <p className="mt-1.5 text-base font-semibold tracking-[-0.01em]">
        {formatarNumero(ponto.valorNumerico) || '—'}
      </p>

      {ponto.valorOriginal && (
        <p className="mt-1 max-w-[16rem] opacity-70">{t.dashboard.original}: {ponto.valorOriginal}</p>
      )}

      <p className="mt-2 flex items-center gap-1.5 font-mono">
        <span aria-hidden="true" className="inline-block size-2" style={{ backgroundColor: ponto.cor }} />
        {t.semaforo.rotulos[ponto.status]}
      </p>
    </div>
  );
}

/**
 * Gráfico combinado de barras semaforizadas e linha de tendência.
 */
export function GraficoEvolucao({ serie, escuro }: GraficoEvolucaoProps): JSX.Element {
  const paleta = paletaGrafico(escuro);
  const { t, reduzirMovimento } = usePreferencias();
  const dados = [...serie];
  const ticks = { fill: paleta.textoSuave, fontSize: 11, fontFamily: FONTE_GRAFICO };

  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={dados} margin={{ top: 28, right: 16, left: -8, bottom: 4 }}>
          <CartesianGrid stroke={paleta.grade} vertical={false} />

          <XAxis dataKey="ano" tick={ticks} tickLine={false} axisLine={{ stroke: paleta.eixo }} />

          <YAxis
            tick={ticks}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(valor: number) =>
              new Intl.NumberFormat(localeNumeros(), { maximumFractionDigits: 2 }).format(valor)
            }
          />

          <Tooltip cursor={{ fill: paleta.destaque }} content={<TooltipEvolucao escuro={escuro} />} />

          {/* Barras: uma <Cell> por ano, com a cor do semáforo daquele ano. */}
          <Bar
            dataKey="valorNumerico"
            name={t.dashboard.valor}
            maxBarSize={56}
            isAnimationActive={!reduzirMovimento}
            animationDuration={DURACAO_ANIMACAO_GRAFICO}
            animationEasing="ease-out"
          >
            {dados.map((ponto) => (
              <Cell key={ponto.ano} fill={ponto.cor} fillOpacity={0.9} />
            ))}
          </Bar>

          {/* Linha de tendência tracejada com rótulos de dados em pt-BR. */}
          <Line
            type="linear"
            dataKey="valorNumerico"
            name={t.dashboard.tendencia}
            stroke={paleta.linhaTendencia}
            strokeWidth={1.75}
            strokeDasharray="5 4"
            dot={{ r: 3.5, fill: paleta.linhaTendencia, strokeWidth: 0 }}
            activeDot={{ r: 6, stroke: paleta.fundoTooltip, strokeWidth: 2 }}
            connectNulls
            isAnimationActive={!reduzirMovimento}
            animationBegin={300}
            animationDuration={DURACAO_ANIMACAO_GRAFICO + 300}
            animationEasing="ease-out"
          >
            <LabelList
              dataKey="valorNumerico"
              position="top"
              offset={12}
              fill={paleta.texto}
              fontSize={11}
              fontFamily={FONTE_GRAFICO}
              formatter={(valor: unknown) => (typeof valor === 'number' ? formatarNumero(valor) : '')}
            />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
