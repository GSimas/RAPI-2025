/**
 * ==========================================================
 * <Hero /> - abertura da página inicial
 * ==========================================================
 *
 * Título editorial "Florianópolis em *indicadores.*", chamadas para o
 * Dashboard e o Assistente e a arte da ponte Hercílio Luz.
 */

import { ArrowUpRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import type { JSX } from 'react';
import { usePreferencias } from '@/hooks/usePreferencias';
import { TOTAL_INDICADORES } from '@/lib/total';
import { EASE_SCIENTATA, VARIANTES_ESCALONADO, VARIANTES_ITEM } from '@/lib/movimento';
import type { IdPagina } from '@/lib/navegacao';
import { PonteHercilioLuz, Radar } from './ArteHero';

interface HeroProps {
  readonly onNavegar: (id: IdPagina) => void;
}

/**
 * Seção de abertura com título, chamadas e ilustração.
 */
export function Hero({ onNavegar }: HeroProps): JSX.Element {
  const { t } = usePreferencias();
  const th = t.hero;

  return (
    <section
      aria-labelledby="titulo-hero"
      className="relative -mx-4 flex min-h-[calc(100dvh-4rem)] flex-col overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:max-h-[880px] lg:px-8"
    >
      {/* --- Arte --------------------------------------------------- */}
      <Radar className="pointer-events-none absolute top-[6%] -right-[20%] w-[34rem] max-w-none opacity-70 sm:-right-[8%] sm:w-[40rem] lg:right-[-4%]" />
      <PonteHercilioLuz className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-full max-w-6xl text-signal opacity-35" />

      {/* --- Metadados técnicos ------------------------------------- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="rotulo relative flex justify-between pt-6 text-faint"
      >
        <span>RAPI / 009</span>
        <span>27°35′S — 48°32′W</span>
      </motion.div>

      {/* --- Texto -------------------------------------------------- */}
      <motion.div
        variants={VARIANTES_ESCALONADO}
        initial="inicial"
        animate="visivel"
        className="relative flex flex-1 flex-col justify-center pt-10 pb-[clamp(11rem,26vw,18rem)]"
      >
        <motion.p variants={VARIANTES_ITEM} className="rotulo flex items-center gap-3">
          <span aria-hidden="true" className="fio" />
          {th.eyebrow}
        </motion.p>

        <h1
          id="titulo-hero"
          className="mt-6 text-[clamp(3.25rem,10.5vw,8.25rem)] leading-[0.9] font-semibold tracking-[-0.045em] text-ink"
        >
          <motion.span variants={VARIANTES_ITEM} className="block">
            {th.linha1}
          </motion.span>
          <motion.span
            variants={{
              inicial: { opacity: 0, y: 24, filter: 'blur(10px)' },
              visivel: {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                transition: { duration: 1.1, ease: EASE_SCIENTATA },
              },
            }}
            className="serif block pr-4 text-signal [text-shadow:0_0_48px_color-mix(in_srgb,var(--signal-fill)_35%,transparent)]"
          >
            {th.destaque}
          </motion.span>
        </h1>

        <motion.p
          variants={VARIANTES_ITEM}
          className="mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
        >
          {th.subtitulo(TOTAL_INDICADORES)}
        </motion.p>

        <motion.div variants={VARIANTES_ITEM} className="mt-9 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => onNavegar('dashboard')} className="botao-primario group">
            {th.explorar}
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </button>
          <button
            type="button"
            onClick={() => onNavegar('assistente')}
            className="botao-secundario group"
          >
            <Sparkles
              aria-hidden="true"
              className="size-4 transition-transform duration-500 group-hover:rotate-12"
            />
            {th.perguntar}
          </button>
        </motion.div>

        <motion.ul variants={VARIANTES_ITEM} className="mt-8 flex flex-wrap gap-2">
          {th.chips.map((item) => (
            <li key={item} className="chip">
              {item}
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}
