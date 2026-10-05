/**
 * ==========================================================
 * <AvisoIA /> - aviso de transparência (ISO/IEC 42001)
 * ==========================================================
 *
 * Mensagem inicial obrigatória da conversa. Atende aos controles de
 * transparência da ISO/IEC 42001 (sistema de gestão de IA): informa que
 * o usuário interage com uma IA, a finalidade e o escopo do sistema, o
 * modelo e o provedor em uso, as limitações conhecidas, o tratamento
 * dos dados, os controles aplicados, a supervisão humana e o canal de
 * contato.
 */

import { ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import type { JSX } from 'react';
import { LINK_RELATORIO, LINK_SCIENTATA } from '@/content/links';
import { usePreferencias } from '@/hooks/usePreferencias';
import { EASE_SCIENTATA } from '@/lib/movimento';

interface AvisoIAProps {
  /** Provedor e modelo em uso (quando conectado). */
  readonly provedor?: string;
  readonly modelo?: string;
}

/**
 * Aviso de que o assistente é uma IA, exibido no início da conversa.
 */
export function AvisoIA({ provedor, modelo }: AvisoIAProps): JSX.Element {
  const ta = usePreferencias().t.chat.aviso;

  return (
    <motion.section
      role="note"
      aria-labelledby="titulo-aviso-ia"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_SCIENTATA }}
      className="border border-signal/35 bg-signal/[0.06] p-4 sm:p-5"
    >
      <p id="titulo-aviso-ia" className="rotulo flex items-center gap-2 text-signal">
        <ShieldCheck aria-hidden="true" className="size-3.5" />
        {ta.titulo}
      </p>

      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink">
        {ta.ola} <strong>{ta.sistemaIA}</strong>
        {ta.olaFim}
      </p>

      <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-ink/80 marker:text-signal [&>li]:ml-4 [&>li]:list-disc">
        <li>
          <strong className="text-ink">{ta.modelo}</strong>{' '}
          {provedor && modelo ? (
            <>
              {ta.modeloAntes} <span className="font-mono text-[0.8125rem]">{modelo}</span>{' '}
              {ta.modeloDepois(provedor)}
            </>
          ) : (
            ta.modeloDesconectado
          )}
        </li>
        <li>
          <strong className="text-ink">{ta.limitacoes}</strong> {ta.limitacoesTexto1}{' '}
          <a href={LINK_RELATORIO} target="_blank" rel="noopener noreferrer" className="link">
            {ta.relatorioOficial}
          </a>{' '}
          {ta.limitacoesTexto2}
        </li>
        <li>
          <strong className="text-ink">{ta.escopo}</strong> {ta.escopoTexto}
        </li>
        <li>
          <strong className="text-ink">{ta.dados}</strong> {ta.dadosTexto}
        </li>
        <li>
          <strong className="text-ink">{ta.contato}</strong> {ta.contatoTexto}{' '}
          <a href={LINK_SCIENTATA} target="_blank" rel="noopener noreferrer" className="link">
            Scientata
          </a>
          .
        </li>
      </ul>
    </motion.section>
  );
}
