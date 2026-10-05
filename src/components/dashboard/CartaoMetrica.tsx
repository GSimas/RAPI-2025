/**
 * ==========================================================
 * <CartaoMetrica /> - equivalente ao `st.metric`
 * ==========================================================
 *
 * Célula de métrica no padrão Scientata: rótulo mono numerado com
 * marcador colorido, valor em destaque e delta opcional, sinalizado
 * apenas pela direção da variação.
 */

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { JSX } from 'react';

interface CartaoMetricaProps {
  /** Rótulo curto acima do valor (ex.: "01 · Resultado 2024"). */
  readonly rotulo: string;
  /** Valor principal — normalmente o texto original do relatório. */
  readonly valor: string;
  /** Variação percentual formatada (ex.: "+4,2% vs 2023"). */
  readonly delta?: string | null;
  /** Cor do marcador ao lado do rótulo. */
  readonly corAcento?: string;
}

/**
 * Célula de métrica com marcador colorido e delta opcional.
 */
export function CartaoMetrica({ rotulo, valor, delta, corAcento }: CartaoMetricaProps): JSX.Element {
  // Delta positivo em verde, negativo em vermelho — apenas sinalização
  // visual da direção, sem juízo sobre ser bom ou ruim para o indicador.
  const positivo = delta?.startsWith('+') ?? false;
  const negativo = delta?.startsWith('-') ?? false;

  return (
    <div
      data-brilho
      className="flex h-full flex-col bg-surface/80 px-5 py-6 [--brilho-forca:0.08] [--brilho-raio:300px]"
    >
      <p className="rotulo flex items-center gap-2">
        {corAcento && (
          <span aria-hidden="true" className="size-2 shrink-0" style={{ backgroundColor: corAcento }} />
        )}
        {rotulo}
      </p>

      <p className="mt-4 text-2xl leading-tight font-semibold tracking-[-0.025em] break-words text-ink sm:text-3xl">
        {valor}
      </p>

      {delta && (
        <p
          className={[
            'mt-3 inline-flex items-center gap-1 self-start border px-2 py-0.5 font-mono text-xs',
            positivo
              ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : negativo
                ? 'border-red-500/30 text-red-600 dark:text-red-400'
                : 'border-line text-muted',
          ].join(' ')}
        >
          {positivo && <ArrowUpRight aria-hidden="true" className="size-3.5" />}
          {negativo && <ArrowDownRight aria-hidden="true" className="size-3.5" />}
          {delta}
        </p>
      )}
    </div>
  );
}
