/**
 * ==========================================================
 * <CartaoExpansivel /> - equivalente ao `st.expander`
 * ==========================================================
 *
 * Bloco recolhível com animação de altura: o conteúdo desliza e aparece
 * ao abrir, e se recolhe ao fechar. Usa o padrão de *disclosure* do
 * WAI-ARIA (botão com `aria-expanded` controlando a região).
 */

import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useState, type JSX, type ReactNode } from 'react';
import { EASE_SCIENTATA } from '@/lib/movimento';

interface CartaoExpansivelProps {
  /** Título exibido no cabeçalho clicável. */
  readonly titulo: string;
  /** Rótulo mono acima do título (ex.: "7.1"). */
  readonly rotulo?: string;
  /** Texto auxiliar à direita do título (ex.: contagem de indicadores). */
  readonly badge?: string;
  /** Cor de acento do marcador quadrado. */
  readonly corAcento?: string;
  /** Se o cartão inicia aberto. */
  readonly aberto?: boolean;
  readonly children: ReactNode;
}

/**
 * Bloco de conteúdo recolhível, com marcador colorido opcional.
 */
export function CartaoExpansivel({
  titulo,
  rotulo,
  badge,
  corAcento,
  aberto = false,
  children,
}: CartaoExpansivelProps): JSX.Element {
  const [expandido, setExpandido] = useState(aberto);
  const id = useId();

  return (
    <div className="card group/cartao overflow-hidden" data-aberto={expandido}>
      <button
        type="button"
        id={`${id}-botao`}
        aria-expanded={expandido}
        aria-controls={`${id}-regiao`}
        onClick={() => setExpandido((atual) => !atual)}
        className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left"
        style={{ ['--brilho-forca' as string]: 0.1, ['--brilho-raio' as string]: '380px' }}
      >
        {corAcento && (
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 transition-transform duration-500 group-data-[aberto=true]/cartao:rotate-45"
            style={{ backgroundColor: corAcento }}
          />
        )}

        <span className="min-w-0 flex-1">
          {rotulo && <span className="rotulo block">{rotulo}</span>}
          <span className="mt-0.5 block text-base font-semibold tracking-[-0.01em] text-ink sm:text-lg">
            {titulo}
          </span>
        </span>

        {badge && <span className="chip hidden sm:inline-flex">{badge}</span>}

        {/* "+" que gira para "×" quando o bloco abre. */}
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-all duration-500 ease-scientata group-hover/cartao:border-signal/50 group-hover/cartao:text-signal group-data-[aberto=true]/cartao:rotate-45 group-data-[aberto=true]/cartao:border-signal/60 group-data-[aberto=true]/cartao:text-signal"
        >
          <Plus className="size-4" />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expandido && (
          <motion.div
            key="conteudo"
            id={`${id}-regiao`}
            role="region"
            aria-labelledby={`${id}-botao`}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: {
                height: { duration: 0.55, ease: EASE_SCIENTATA },
                opacity: { duration: 0.4, delay: 0.1 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.4, ease: EASE_SCIENTATA },
                opacity: { duration: 0.2 },
              },
            }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -8 }}
              animate={{ y: 0 }}
              exit={{ y: -8 }}
              transition={{ duration: 0.5, ease: EASE_SCIENTATA }}
              className="border-t border-line px-5 py-5"
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
