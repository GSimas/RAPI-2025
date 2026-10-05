/**
 * ==========================================================
 * Hook de iluminação sob o cursor
 * ==========================================================
 *
 * Um único listener de `pointermove` alimenta dois efeitos:
 *
 * 1. **Brilho local** — para cada elemento iluminável sob o cursor (e
 *    seus ancestrais também iluminados, como o card que contém um botão),
 *    grava `--mx`/`--my` relativos à sua caixa. O CSS desenha ali um
 *    gradiente radial amarelo (ver `index.css`).
 * 2. **Holofote de fundo** — move um halo fixo atrás do conteúdo até a
 *    posição do cursor, iluminando suavemente a grade da página.
 *
 * As atualizações são agrupadas em `requestAnimationFrame`, e o efeito é
 * desligado em telas de toque, onde não há cursor para seguir.
 */

import { useEffect, type RefObject } from 'react';

/** Elementos que recebem o brilho; casa com o seletor de `index.css`. */
const SELETOR_ILUMINAVEL = 'button, a, summary, .card, .campo, [data-brilho]';

/**
 * Liga a iluminação global sob o cursor.
 *
 * @param refHolofote Elemento fixo usado como holofote de fundo.
 */
export function useBrilho(refHolofote: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let quadro = 0;
    let ultimoEvento: PointerEvent | null = null;

    const aplicar = (): void => {
      quadro = 0;
      const evento = ultimoEvento;
      if (!evento) return;

      const { clientX: x, clientY: y } = evento;

      const holofote = refHolofote.current;
      if (holofote) {
        holofote.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        holofote.dataset['ativo'] = 'true';
      }

      // Percorre do alvo até a raiz, atualizando cada elemento iluminável.
      let alvo = (evento.target as Element | null)?.closest<HTMLElement>(SELETOR_ILUMINAVEL);
      while (alvo) {
        const caixa = alvo.getBoundingClientRect();
        alvo.style.setProperty('--mx', `${x - caixa.left}px`);
        alvo.style.setProperty('--my', `${y - caixa.top}px`);
        alvo = alvo.parentElement?.closest<HTMLElement>(SELETOR_ILUMINAVEL) ?? null;
      }
    };

    const aoMover = (evento: PointerEvent): void => {
      ultimoEvento = evento;
      if (!quadro) quadro = requestAnimationFrame(aplicar);
    };

    const aoSair = (): void => {
      if (refHolofote.current) refHolofote.current.dataset['ativo'] = 'false';
    };

    window.addEventListener('pointermove', aoMover, { passive: true });
    document.documentElement.addEventListener('pointerleave', aoSair);

    return () => {
      window.removeEventListener('pointermove', aoMover);
      document.documentElement.removeEventListener('pointerleave', aoSair);
      if (quadro) cancelAnimationFrame(quadro);
    };
  }, [refHolofote]);
}
