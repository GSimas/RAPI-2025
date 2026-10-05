/**
 * ==========================================================
 * <Revelar /> e <RevelarGrupo /> - entrada ao rolar
 * ==========================================================
 *
 * Blocos que sobem e aparecem quando entram na viewport. `RevelarGrupo`
 * escalona a entrada dos `Revelar` filhos, criando a cascata suave das
 * grades de cards.
 */

import { motion } from 'motion/react';
import type { JSX, ReactNode } from 'react';
import { EASE_SCIENTATA, VARIANTES_ESCALONADO, VARIANTES_ITEM } from '@/lib/movimento';

interface RevelarProps {
  readonly children: ReactNode;
  readonly className?: string;
  /** Atraso extra, em segundos (apenas fora de um grupo). */
  readonly atraso?: number;
  /** Quando dentro de um `RevelarGrupo`, herda o gatilho do grupo. */
  readonly emGrupo?: boolean;
}

/**
 * Bloco que se revela ao entrar na tela.
 */
export function Revelar({ children, className, atraso = 0, emGrupo = false }: RevelarProps): JSX.Element {
  if (emGrupo) {
    return (
      <motion.div variants={VARIANTES_ITEM} className={className}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.8, ease: EASE_SCIENTATA, delay: atraso }}
    >
      {children}
    </motion.div>
  );
}

interface RevelarGrupoProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * Container que dispara, em cascata, a entrada dos filhos `Revelar emGrupo`.
 */
export function RevelarGrupo({ children, className }: RevelarGrupoProps): JSX.Element {
  return (
    <motion.div
      className={className}
      variants={VARIANTES_ESCALONADO}
      initial="inicial"
      whileInView="visivel"
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
    >
      {children}
    </motion.div>
  );
}
