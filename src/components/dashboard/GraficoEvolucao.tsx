/**
 * ==========================================================
 * <GraficoEvolucao /> - evolução histórica do indicador
 * ==========================================================
 *
 * Porte do gráfico combinado do `app.py`:
 *
 * 1. **Barras** com cor definida individualmente pela regra de
 *    semaforização aplicada ao valor **daquele ano**;
 * 2. **Linha de tendência** pontilhada, com marcadores e rótulos
 *    numéricos formatados em pt-BR posicionados sobre os pontos.
 *
 * Cores de texto, grade e tooltip vêm de `paletaGrafico`, garantindo
 * contraste adequado nos modos claro e escuro.
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
import { formatarNumero } from '@/lib/format';
import { paletaGrafico } from '@/lib/paletaGrafico';
import { ROTULOS_SEMAFORO } from '@/lib/semaforo';
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

  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{
        backgroundColor: paleta.fundoTooltip,
        borderColor: paleta.bordaTooltip,
        color: paleta.texto,
      }}
    >
      <p className="font-semibold">{ponto.ano}</p>

      <p className="mt-1">
        Valor: <strong>{formatarNumero(ponto.valorNumerico) || '—'}</strong>
      </p>

      {ponto.valorOriginal && (
        <p className="mt-0.5 max-w-[16rem] opacity-80">Original: {ponto.valorOriginal}</p>
      )}

      <p className="mt-1 flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="inline-block size-2.5 rounded-full"
          style={{ backgroundColor: ponto.cor }}
        />
        {ROTULOS_SEMAFORO[ponto.status]}
      </p>
    </div>
  );
}

/**
 * Gráfico combinado de barras semaforizadas e linha de tendência.
 */
export function GraficoEvolucao({ serie, escuro }: GraficoEvolucaoProps): JSX.Element {
  const paleta = paletaGrafico(escuro);
  const dados = [...serie];

  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={dados} margin={{ top: 28, right: 16, left: -8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={paleta.grade} vertical={false} />

          <XAxis
            dataKey="ano"
            stroke={paleta.eixo}
            tick={{ fill: paleta.texto, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: paleta.grade }}
          />

          <YAxis
            stroke={paleta.eixo}
            tick={{ fill: paleta.texto, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(valor: number) =>
              new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(valor)
            }
          />

          <Tooltip
            cursor={{ fill: paleta.destaque }}
            content={<TooltipEvolucao escuro={escuro} />}
          />

          {/* Barras: uma <Cell> por ano, com a cor do semáforo daquele ano. */}
          <Bar dataKey="valorNumerico" name="Valor" isAnimationActive={false} radius={[4, 4, 0, 0]}>
            {dados.map((ponto) => (
              <Cell key={ponto.ano} fill={ponto.cor} />
            ))}
          </Bar>

          {/* Linha de tendência pontilhada com rótulos de dados em pt-BR. */}
          <Line
            type="linear"
            dataKey="valorNumerico"
            name="Tendência"
            stroke={paleta.linhaTendencia}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={{ r: 3.5, fill: paleta.linhaTendencia, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
            isAnimationActive={false}
          >
            <LabelList
              dataKey="valorNumerico"
              position="top"
              offset={10}
              fill={paleta.texto}
              fontSize={11}
              formatter={(valor: unknown) =>
                typeof valor === 'number' ? formatarNumero(valor) : ''
              }
            />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
