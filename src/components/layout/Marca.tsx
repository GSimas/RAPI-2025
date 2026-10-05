/**
 * ==========================================================
 * <SimboloRapi /> - símbolo do RAPI
 * ==========================================================
 *
 * Quadrado com três barras crescentes (os indicadores). Dentro de um
 * elemento `.group`, o hover faz as barras ondularem uma após a outra e
 * um rastro de luz percorrer a moldura (estilos em `index.css`).
 */

import type { JSX } from 'react';

/** Símbolo quadrado com barras ascendentes. */
export function SimboloRapi({ className = 'size-9' }: { readonly className?: string }): JSX.Element {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className={`simbolo-rapi overflow-visible ${className}`}>
      <rect x="0.75" y="0.75" width="34.5" height="34.5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-signal" />
      {/* Perímetro do quadrado = 138: um traço de 24 percorre a moldura. */}
      <rect
        x="0.75"
        y="0.75"
        width="34.5"
        height="34.5"
        fill="none"
        strokeWidth="2.5"
        strokeDasharray="24 114"
        className="rastro stroke-signal-fill"
        style={{ filter: 'drop-shadow(0 0 3px var(--signal-fill))' }}
      />
      <rect x="9" y="20" width="4" height="8" className="barra barra-1 fill-signal opacity-45" />
      <rect x="16" y="14" width="4" height="14" className="barra barra-2 fill-signal opacity-70" />
      <rect x="23" y="8" width="4" height="20" className="barra barra-3 fill-signal" />
    </svg>
  );
}
