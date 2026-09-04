/**
 * ==========================================================
 * <CartaoMetrica /> - equivalente ao `st.metric`
 * ==========================================================
 *
 * Reproduz o `.metric-card` do CSS original: superfície secundária com
 * acento azul à esquerda, rótulo, valor em destaque e delta opcional
 * colorido conforme o sentido da variação.
 */

import type { JSX, ReactNode } from 'react';

interface CartaoMetricaProps {
  /** Rótulo curto acima do valor (ex.: "Resultado Atual (2024)"). */
  readonly rotulo: string;
  /** Valor principal — normalmente o texto original do relatório. */
  readonly valor: string;
  /** Variação percentual formatada (ex.: "+4,2% vs 2023"). */
  readonly delta?: string | null;
  /** Cor de acento da borda esquerda. */
  readonly corAcento?: string;
  /** Conteúdo extra abaixo do valor. */
  readonly children?: ReactNode;
}

/**
 * Cartão de métrica com acento colorido e delta opcional.
 */
export function CartaoMetrica({
  rotulo,
  valor,
  delta,
  corAcento = '#1f77b4',
  children,
}: CartaoMetricaProps): JSX.Element {
  // Delta positivo em verde, negativo em vermelho — apenas sinalização
  // visual da direção, sem juízo sobre ser bom ou ruim para o indicador.
  const positivo = delta?.startsWith('+') ?? false;
  const negativo = delta?.startsWith('-') ?? false;

  return (
    <div
      className="cartao h-full p-4"
      style={{ borderLeftWidth: 5, borderLeftStyle: 'solid', borderLeftColor: corAcento }}
    >
      <p className="rotulo-campo">{rotulo}</p>

      <p className="mt-1.5 text-2xl leading-tight font-bold break-words text-slate-900 dark:text-slate-50">
        {valor}
      </p>

      {delta && (
        <p
          className={[
            'mt-1 text-sm font-medium',
            positivo
              ? 'text-emerald-600 dark:text-emerald-400'
              : negativo
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-500 dark:text-slate-400',
          ].join(' ')}
        >
          {positivo && <span aria-hidden="true">▲ </span>}
          {negativo && <span aria-hidden="true">▼ </span>}
          {delta}
        </p>
      )}

      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
