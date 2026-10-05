/**
 * ==========================================================
 * <CampoPergunta /> - entrada de texto do chat
 * ==========================================================
 *
 * Equivalente ao `st.chat_input`. O textarea cresce com o conteúdo até um
 * limite; Enter envia e Shift+Enter quebra a linha. Enquanto a resposta
 * chega, o botão de envio vira "parar".
 */

import { ArrowUp, Square } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState, type JSX } from 'react';
import { usePreferencias } from '@/hooks/usePreferencias';
import { EASE_SCIENTATA } from '@/lib/movimento';

interface CampoPerguntaProps {
  readonly onEnviar: (texto: string) => void;
  readonly onParar: () => void;
  readonly carregando: boolean;
}

/** Altura máxima do campo antes de rolar internamente. */
const ALTURA_MAXIMA_PX = 160;

/**
 * Campo de digitação com envio por Enter e auto-ajuste de altura.
 */
export function CampoPergunta({ onEnviar, onParar, carregando }: CampoPerguntaProps): JSX.Element {
  const tc = usePreferencias().t.chat.campo;
  const [texto, setTexto] = useState('');
  const areaRef = useRef<HTMLTextAreaElement>(null);

  /** Recalcula a altura do textarea conforme o conteúdo. */
  const ajustarAltura = (): void => {
    const area = areaRef.current;
    if (!area) return;

    area.style.height = 'auto';
    area.style.height = `${Math.min(area.scrollHeight, ALTURA_MAXIMA_PX)}px`;
  };

  const enviar = (): void => {
    const pergunta = texto.trim();
    if (pergunta === '' || carregando) return;

    onEnviar(pergunta);
    setTexto('');

    // Restaura a altura mínima após limpar o campo.
    requestAnimationFrame(() => {
      if (areaRef.current) areaRef.current.style.height = 'auto';
    });
  };

  const vazio = texto.trim() === '';

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        if (carregando) onParar();
        else enviar();
      }}
      data-brilho
      className="flex items-end gap-2 border border-line-forte bg-canvas/60 p-2 transition-shadow focus-within:border-signal/60 focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--signal-fill)_15%,transparent)] [--brilho-forca:0.08] [--brilho-raio:300px]"
    >
      <label htmlFor="campo-pergunta" className="sr-only">
        {tc.rotulo}
      </label>

      <div className="relative flex-1">
        <textarea
          id="campo-pergunta"
          ref={areaRef}
          rows={1}
          value={texto}
          placeholder={tc.placeholder}
          onChange={(evento) => {
            setTexto(evento.target.value);
            ajustarAltura();
          }}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter' && !evento.shiftKey) {
              evento.preventDefault();
              enviar();
            }
          }}
          className="max-h-40 w-full resize-none bg-transparent px-2 py-2 text-sm text-ink placeholder:text-faint focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={!carregando && vazio}
        className="botao-primario group relative size-9 shrink-0 overflow-hidden p-0"
        aria-label={carregando ? tc.parar : tc.enviar}
        title={carregando ? tc.parar : tc.enviarTitulo}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={carregando ? 'parar' : 'enviar'}
            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
            transition={{ duration: 0.3, ease: EASE_SCIENTATA }}
            className="flex"
          >
            {carregando ? (
              <Square aria-hidden="true" className="size-3.5 fill-current" />
            ) : (
              <ArrowUp aria-hidden="true" className="size-4 transition-transform duration-300 group-enabled:group-hover:-translate-y-0.5" />
            )}
          </motion.span>
        </AnimatePresence>
      </button>
    </form>
  );
}
