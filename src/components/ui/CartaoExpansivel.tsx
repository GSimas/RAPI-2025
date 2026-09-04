/**
 * ==========================================================
 * <CartaoExpansivel /> - equivalente ao `st.expander`
 * ==========================================================
 *
 * Implementado sobre `<details>`/`<summary>` nativos: acessível por
 * teclado e por leitores de tela sem qualquer JavaScript adicional.
 */

import type { JSX, ReactNode } from 'react';

interface CartaoExpansivelProps {
  /** Título exibido no cabeçalho clicável. */
  readonly titulo: string;
  /** Emoji ou ícone à esquerda do título. */
  readonly icone?: string;
  /** Texto auxiliar à direita do título (ex.: contagem de indicadores). */
  readonly badge?: string;
  /** Cor de acento aplicada à borda esquerda. */
  readonly corAcento?: string;
  /** Se o cartão inicia aberto. */
  readonly aberto?: boolean;
  readonly children: ReactNode;
}

/**
 * Bloco de conteúdo recolhível, com acento colorido opcional.
 */
export function CartaoExpansivel({
  titulo,
  icone,
  badge,
  corAcento,
  aberto = false,
  children,
}: CartaoExpansivelProps): JSX.Element {
  return (
    <details
      className="cartao group overflow-hidden transition hover:shadow-md"
      style={corAcento ? { borderLeft: `4px solid ${corAcento}` } : undefined}
      open={aberto}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 select-none">
        {icone && (
          <span aria-hidden="true" className="text-lg">
            {icone}
          </span>
        )}

        <span className="flex-1 text-sm font-semibold text-slate-800 sm:text-base dark:text-slate-100">
          {titulo}
        </span>

        {badge && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {badge}
          </span>
        )}

        {/* Chevron que gira quando o bloco abre. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
        >
          <path d="M5 7.5 10 12.5 15 7.5" />
        </svg>
      </summary>

      <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">{children}</div>
    </details>
  );
}
