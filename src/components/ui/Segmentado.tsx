/**
 * ==========================================================
 * <Segmentado /> - abas internas com pílula deslizante
 * ==========================================================
 *
 * Controle segmentado que implementa o padrão ARIA `tablist`/`tab`,
 * com navegação por setas, Home e End. A pílula de seleção desliza
 * entre as opções (`layoutId`), em vez de saltar.
 */

import { motion } from 'motion/react';
import { useId, useRef, type JSX, type KeyboardEvent } from 'react';
import { MOLA_INDICADOR } from '@/lib/movimento';

/** Uma opção do controle. */
export interface OpcaoSegmentado<T extends string> {
  readonly id: T;
  readonly rotulo: string;
}

interface SegmentadoProps<T extends string> {
  readonly opcoes: readonly OpcaoSegmentado<T>[];
  readonly ativa: T;
  readonly onChange: (id: T) => void;
  /** Rótulo acessível do grupo. */
  readonly rotulo: string;
  /** Prefixo dos ids, ligando cada aba ao seu painel (`${prefixo}-painel-${id}`). */
  readonly prefixo: string;
}

/**
 * Abas segmentadas com indicador animado.
 */
export function Segmentado<T extends string>({
  opcoes,
  ativa,
  onChange,
  rotulo,
  prefixo,
}: SegmentadoProps<T>): JSX.Element {
  const idLayout = useId();
  const refs = useRef(new Map<T, HTMLButtonElement>());

  const aoTeclar = (evento: KeyboardEvent<HTMLDivElement>): void => {
    const atual = opcoes.findIndex((opcao) => opcao.id === ativa);
    let proximo = -1;

    if (evento.key === 'ArrowRight') proximo = (atual + 1) % opcoes.length;
    else if (evento.key === 'ArrowLeft') proximo = (atual - 1 + opcoes.length) % opcoes.length;
    else if (evento.key === 'Home') proximo = 0;
    else if (evento.key === 'End') proximo = opcoes.length - 1;
    else return;

    evento.preventDefault();
    const alvo = opcoes[proximo];
    if (!alvo) return;
    onChange(alvo.id);
    refs.current.get(alvo.id)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={rotulo}
      onKeyDown={aoTeclar}
      className="inline-flex max-w-full gap-1 overflow-x-auto border border-line bg-canvas/50 p-1"
    >
      {opcoes.map((opcao) => {
        const selecionada = opcao.id === ativa;

        return (
          <button
            key={opcao.id}
            ref={(elemento) => {
              if (elemento) refs.current.set(opcao.id, elemento);
              else refs.current.delete(opcao.id);
            }}
            type="button"
            role="tab"
            id={`${prefixo}-aba-${opcao.id}`}
            aria-selected={selecionada}
            aria-controls={`${prefixo}-painel-${opcao.id}`}
            tabIndex={selecionada ? 0 : -1}
            onClick={() => onChange(opcao.id)}
            className={[
              'relative shrink-0 px-3.5 py-2 text-[0.8125rem] font-semibold whitespace-nowrap',
              selecionada ? 'text-signal-ink' : 'text-muted hover:text-ink',
            ].join(' ')}
            style={{ ['--brilho-raio' as string]: '70px', ['--brilho-forca' as string]: 0.25 }}
          >
            {selecionada && (
              <motion.span
                layoutId={`pilula-${idLayout}`}
                transition={MOLA_INDICADOR}
                aria-hidden="true"
                className="absolute inset-0 bg-signal-fill"
              />
            )}
            <span className="relative">{opcao.rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}
