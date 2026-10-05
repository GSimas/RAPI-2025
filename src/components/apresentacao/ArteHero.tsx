/**
 * ==========================================================
 * Arte do hero: radar e ponte Hercílio Luz em traço técnico
 * ==========================================================
 *
 * Ilustrações em linha, no espírito das artes dos produtos Scientata:
 *
 * - `<Radar />`: círculos concêntricos, mira e um ponto em órbita;
 * - `<PonteHercilioLuz />`: a ponte pênsil símbolo de Florianópolis,
 *   desenhada traço a traço quando a página abre.
 *
 * Puramente decorativas (`aria-hidden`).
 */

import { motion } from 'motion/react';
import type { JSX } from 'react';
import { EASE_SCIENTATA } from '@/lib/movimento';

/** Desenha um traço do início ao fim. */
const desenhar = (atraso: number, duracao = 1.6) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: {
    pathLength: { duration: duracao, ease: EASE_SCIENTATA, delay: atraso },
    opacity: { duration: 0.3, delay: atraso },
  },
});

/**
 * Radar com círculos concêntricos e ponto orbitando.
 */
export function Radar({ className = '' }: { readonly className?: string }): JSX.Element {
  return (
    <svg viewBox="0 0 600 600" aria-hidden="true" className={className} fill="none">
      <g stroke="currentColor" strokeWidth="1" className="text-signal">
        {[280, 210, 140, 70].map((raio, indice) => (
          <motion.circle
            key={raio}
            cx="300"
            cy="300"
            r={raio}
            strokeOpacity={0.1 + indice * 0.05}
            {...desenhar(0.2 + indice * 0.12, 2)}
          />
        ))}
        <motion.path d="M300 0v600M0 300h600" strokeOpacity="0.08" {...desenhar(0.1, 1.8)} />
        <motion.path
          d="M300 270v60M270 300h60"
          strokeOpacity="0.5"
          {...desenhar(0.9, 0.8)}
        />
      </g>

      {/* Ponto em órbita no anel externo. */}
      <g className="origin-center animate-orbita" style={{ transformBox: 'view-box' }}>
        <circle cx="300" cy="20" r="4" className="fill-signal" />
        <circle cx="300" cy="20" r="12" className="fill-signal opacity-15" />
      </g>

      {/* Ponto pulsante no centro. */}
      <circle
        cx="300"
        cy="300"
        r="5"
        className="origin-center animate-pulsar fill-signal"
        style={{ transformBox: 'fill-box' }}
      />
    </svg>
  );
}

// --- Geometria da ponte -------------------------------------------------

/** Altura do tabuleiro e topo das torres, no sistema do viewBox. */
const DECK = 232;
const TOPO = 70;
const TORRE_ESQ = 400;
const TORRE_DIR = 800;
/** Ponto de controle do cabo principal (quanto maior, mais ele desce). */
const CONTROLE = 380;

/** Altura do cabo principal na posição `x` (Bézier quadrática). */
function alturaCabo(x: number): number {
  const t = (x - TORRE_ESQ) / (TORRE_DIR - TORRE_ESQ);
  return (1 - t) ** 2 * TOPO + 2 * (1 - t) * t * CONTROLE + t ** 2 * TOPO;
}

/** Pendurais verticais entre o cabo e o tabuleiro. */
const PENDURAIS = Array.from({ length: 19 }, (_, i) => TORRE_ESQ + 20 + i * 20)
  .map((x) => ({ x, y: alturaCabo(x) }))
  .filter((p) => p.y < DECK - 6);

/**
 * Ponte Hercílio Luz em traço técnico, com reflexo na água.
 */
export function PonteHercilioLuz({ className = '' }: { readonly className?: string }): JSX.Element {
  const cabo = `M${TORRE_ESQ} ${TOPO} Q${(TORRE_ESQ + TORRE_DIR) / 2} ${CONTROLE} ${TORRE_DIR} ${TOPO}`;

  return (
    <svg
      viewBox="0 0 1200 320"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    >
      {/* Tabuleiro e treliça. */}
      <motion.path d={`M60 ${DECK}H1140`} strokeWidth="1.5" {...desenhar(0.3, 1.8)} />
      <motion.path
        d={`M180 ${DECK + 10}H1020`}
        strokeWidth="1"
        strokeOpacity="0.5"
        {...desenhar(0.5, 1.6)}
      />

      {/* Torres: duas pernas, travessas e topo. */}
      {[TORRE_ESQ, TORRE_DIR].map((x, indice) => (
        <motion.path
          key={x}
          d={`M${x - 9} ${DECK + 30}V${TOPO - 4}M${x + 9} ${DECK + 30}V${TOPO - 4}M${x - 13} ${TOPO - 4}H${x + 13}M${x - 9} ${TOPO + 40}H${x + 9}M${x - 9} ${TOPO + 90}H${x + 9}M${x - 9} ${TOPO + 40}L${x + 9} ${TOPO + 90}M${x + 9} ${TOPO + 40}L${x - 9} ${TOPO + 90}`}
          strokeWidth="1.5"
          {...desenhar(0.6 + indice * 0.15, 1.4)}
        />
      ))}

      {/* Cabo principal e cabos laterais até as ancoragens. */}
      <motion.path d={cabo} strokeWidth="1.75" {...desenhar(1.1, 1.6)} />
      <motion.path
        d={`M150 ${DECK} Q300 ${DECK - 40} ${TORRE_ESQ} ${TOPO}`}
        strokeWidth="1.5"
        {...desenhar(1.2, 1.4)}
      />
      <motion.path
        d={`M1050 ${DECK} Q900 ${DECK - 40} ${TORRE_DIR} ${TOPO}`}
        strokeWidth="1.5"
        {...desenhar(1.2, 1.4)}
      />

      {/* Pendurais. */}
      {PENDURAIS.map((p, indice) => (
        <motion.path
          key={p.x}
          d={`M${p.x} ${p.y}V${DECK}`}
          strokeWidth="0.75"
          strokeOpacity="0.6"
          {...desenhar(1.6 + indice * 0.03, 0.6)}
        />
      ))}

      {/*
        Lâmina d'água: linhas tracejadas que se afastam. O tracejado impede
        a animação por `pathLength`, então elas surgem deslizando.
      */}
      {[
        { y: 262, x1: 120, x2: 1080, o: 0.4 },
        { y: 280, x1: 220, x2: 980, o: 0.25 },
        { y: 298, x1: 340, x2: 860, o: 0.15 },
      ].map((linha, indice) => (
        <motion.path
          key={linha.y}
          d={`M${linha.x1} ${linha.y}H${linha.x2}`}
          strokeWidth="1"
          strokeOpacity={linha.o}
          strokeDasharray="2 10"
          initial={{ opacity: 0, x: indice % 2 === 0 ? -40 : 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 2, ease: EASE_SCIENTATA, delay: 1.4 + indice * 0.15 }}
        />
      ))}
    </svg>
  );
}
