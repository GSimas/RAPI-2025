/**
 * ==========================================================
 * Sistema de movimento
 * ==========================================================
 *
 * Curvas, durações e variantes compartilhadas por todas as animações
 * (biblioteca `motion`). Centralizar aqui garante que páginas, abas,
 * blocos e botões se movam com o mesmo "sotaque": entrada rápida e
 * assentamento longo, como nos produtos Scientata.
 *
 * Quem prefere menos movimento é respeitado globalmente pelo
 * `<MotionConfig reducedMotion="user">` em `App.tsx`.
 */

import type { Transition, Variants } from 'motion/react';

/** Curva "expo out" da Scientata: arranca rápido, assenta devagar. */
export const EASE_SCIENTATA = [0.16, 1, 0.3, 1] as const;

/** Transição padrão de elementos de interface. */
export const TRANSICAO: Transition = { duration: 0.6, ease: EASE_SCIENTATA };

/** Mola para indicadores que deslizam (sublinhado de abas, pílulas). */
export const MOLA_INDICADOR: Transition = { type: 'spring', stiffness: 420, damping: 36 };

/** Troca de página: sobe e desfoca na entrada; desfaz na saída. */
export const VARIANTES_PAGINA: Variants = {
  inicial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  visivel: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.65, ease: EASE_SCIENTATA },
  },
  saida: {
    opacity: 0,
    y: -8,
    filter: 'blur(4px)',
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
  },
};

/** Container que escalona a entrada dos filhos. */
export const VARIANTES_ESCALONADO: Variants = {
  inicial: {},
  visivel: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/** Item revelado: sobe 18px enquanto aparece. */
export const VARIANTES_ITEM: Variants = {
  inicial: { opacity: 0, y: 18 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_SCIENTATA } },
};
