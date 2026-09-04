/**
 * ==========================================================
 * <CampoPergunta /> - entrada de texto do chat
 * ==========================================================
 *
 * Equivalente ao `st.chat_input`. O textarea cresce com o conteúdo até um
 * limite; Enter envia e Shift+Enter quebra a linha.
 */

import { useRef, useState, type JSX } from 'react';

interface CampoPerguntaProps {
  readonly onEnviar: (texto: string) => void;
  readonly desabilitado: boolean;
}

/** Altura máxima do campo antes de rolar internamente. */
const ALTURA_MAXIMA_PX = 160;

/**
 * Campo de digitação com envio por Enter e auto-ajuste de altura.
 */
export function CampoPergunta({ onEnviar, desabilitado }: CampoPerguntaProps): JSX.Element {
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
    if (pergunta === '' || desabilitado) return;

    onEnviar(pergunta);
    setTexto('');

    // Restaura a altura mínima após limpar o campo.
    requestAnimationFrame(() => {
      if (areaRef.current) areaRef.current.style.height = 'auto';
    });
  };

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        enviar();
      }}
      className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-2 shadow-sm transition focus-within:border-rapi-500 focus-within:ring-2 focus-within:ring-rapi-500/25 dark:border-slate-700 dark:bg-slate-900"
    >
      <label htmlFor="campo-pergunta" className="sr-only">
        Sua pergunta ao assistente
      </label>

      <textarea
        id="campo-pergunta"
        ref={areaRef}
        rows={1}
        value={texto}
        disabled={desabilitado}
        placeholder="Ex.: Qual o valor do consumo de água em 2024 e o que o relatório recomenda?"
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
        className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-60 dark:text-slate-100 dark:placeholder:text-slate-500"
      />

      <button
        type="submit"
        disabled={desabilitado || texto.trim() === ''}
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rapi-600 text-white transition hover:bg-rapi-700 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Enviar pergunta"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
        >
          <path d="M3.5 10h13M11 4.5 16.5 10 11 15.5" />
        </svg>
      </button>
    </form>
  );
}
