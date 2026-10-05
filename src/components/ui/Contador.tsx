/**
 * ==========================================================
 * <Contador /> - número que conta ao entrar na tela
 * ==========================================================
 *
 * Anima de 0 até o valor final quando o elemento aparece. O valor final
 * fica disponível para leitores de tela desde o início (`sr-only`); a
 * parte animada é apenas visual.
 */

import { animate, useInView, useReducedMotionConfig } from 'motion/react';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import { localeNumeros } from '@/lib/format';
import { EASE_SCIENTATA } from '@/lib/movimento';

interface ContadorProps {
  readonly valor: number;
  /** Texto colado ao número (ex.: "ª"). */
  readonly sufixo?: string;
}


/**
 * Número com contagem animada.
 */
export function Contador({ valor, sufixo = '' }: ContadorProps): JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const emVista = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  // Respeita o "reduzir movimento" do painel (via MotionConfig), não só o do sistema.
  const reduzir = useReducedMotionConfig();
  // Estável entre renders: um formatador novo a cada render reiniciava a animação (dependência do efeito).
  const locale = localeNumeros();
  const formatador = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  useEffect(() => {
    const elemento = ref.current;
    if (!emVista || !elemento) return;

    if (reduzir) {
      elemento.textContent = formatador.format(valor) + sufixo;
      return;
    }

    const controles = animate(0, valor, {
      duration: 1.6,
      ease: EASE_SCIENTATA,
      onUpdate: (atual) => {
        elemento.textContent = formatador.format(Math.round(atual)) + sufixo;
      },
    });
    return () => controles.stop();
  }, [emVista, reduzir, valor, sufixo, formatador]);

  return (
    <>
      <span className="sr-only">
        {formatador.format(valor)}
        {sufixo}
      </span>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        0{sufixo}
      </span>
    </>
  );
}
