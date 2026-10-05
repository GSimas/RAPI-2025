/**
 * ==========================================================
 * Títulos editoriais
 * ==========================================================
 *
 * - `<TituloPagina />`: abertura das páginas internas, com trilha
 *   ("← INÍCIO / 01 · DASHBOARD"), título em Manrope + destaque em
 *   Instrument Serif itálico e linha de apoio.
 * - `<CabecalhoSecao />`: rótulo mono numerado e título de uma seção.
 */

import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import type { JSX, ReactNode } from 'react';
import { VARIANTES_ESCALONADO, VARIANTES_ITEM } from '@/lib/movimento';
import { usePreferencias } from '@/hooks/usePreferencias';
import type { DefinicaoPagina } from '@/lib/navegacao';

interface TituloPaginaProps {
  readonly pagina: DefinicaoPagina;
  /** Volta ao início (a trilha é clicável). */
  readonly onInicio: () => void;
  /** Conteúdo extra à direita ou abaixo (chips, ações). */
  readonly children?: ReactNode;
}

/**
 * Cabeçalho de uma página interna.
 */
export function TituloPagina({ pagina, onInicio, children }: TituloPaginaProps): JSX.Element {
  const { t } = usePreferencias();
  const textos = t.paginas[pagina.id];

  return (
    <motion.header
      variants={VARIANTES_ESCALONADO}
      initial="inicial"
      animate="visivel"
      className="pt-6 pb-8 sm:pt-10 sm:pb-10"
    >
      <motion.nav variants={VARIANTES_ITEM} aria-label={t.trilha.aria} className="rotulo flex items-center gap-2">
        <a
          href="#apresentacao"
          onClick={(evento) => {
            evento.preventDefault();
            onInicio();
          }}
          className="group sem-brilho inline-flex items-center gap-1.5 transition-colors hover:text-signal"
        >
          <ArrowLeft
            aria-hidden="true"
            className="size-3 transition-transform duration-300 group-hover:-translate-x-0.5"
          />
          {t.trilha.inicio}
        </a>
        <span aria-hidden="true" className="text-faint">
          /
        </span>
        <span className="text-signal" aria-current="page">
          {pagina.numero} · {textos.rotulo}
        </span>
      </motion.nav>

      <motion.h1
        variants={VARIANTES_ITEM}
        className="mt-5 text-[2.75rem] leading-[0.95] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-6xl lg:text-7xl"
      >
        {textos.titulo} <span className="serif text-signal">{textos.destaque}</span>
      </motion.h1>

      <motion.p
        variants={VARIANTES_ITEM}
        className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
      >
        {textos.descricao}
      </motion.p>

      {children && (
        <motion.div variants={VARIANTES_ITEM} className="mt-6">
          {children}
        </motion.div>
      )}
    </motion.header>
  );
}

interface CabecalhoSecaoProps {
  /** Rótulo técnico ("01 · Apresentação"). */
  readonly rotulo: string;
  readonly titulo: string;
  /** Trecho final em serif itálico. */
  readonly destaque?: string;
  readonly id?: string;
  /** Nível semântico do título. */
  readonly nivel?: 'h2' | 'h3';
  readonly children?: ReactNode;
  readonly className?: string;
}

/**
 * Cabeçalho de seção: rótulo mono com fio + título editorial.
 */
export function CabecalhoSecao({
  rotulo,
  titulo,
  destaque,
  id,
  nivel = 'h2',
  children,
  className = '',
}: CabecalhoSecaoProps): JSX.Element {
  const Titulo = nivel;

  return (
    <div className={className}>
      <p className="rotulo flex items-center gap-3">
        <span aria-hidden="true" className="fio" />
        {rotulo}
      </p>
      <Titulo
        id={id}
        className="mt-3 text-3xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-ink sm:text-4xl"
      >
        {titulo}
        {destaque && (
          <>
            {' '}
            <span className="serif text-signal">{destaque}</span>
          </>
        )}
      </Titulo>
      {children && <div className="mt-3 max-w-3xl text-muted">{children}</div>}
    </div>
  );
}
