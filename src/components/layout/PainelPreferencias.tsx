/**
 * ==========================================================
 * <PainelPreferencias /> - configurações do cabeçalho
 * ==========================================================
 *
 * Botão de engrenagem que abre um painel com:
 * - tema claro / escuro;
 * - idioma PT / EN;
 * - tamanho da letra (pequena, média, grande);
 * - reduzir movimento.
 *
 * As escolhas valem na hora e ficam salvas neste navegador.
 */

import { Moon, RotateCcw, Settings2, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useRef, useState, type JSX, type ReactNode } from 'react';
import { usePreferencias, type TamanhoFonte } from '@/hooks/usePreferencias';
import type { Idioma } from '@/i18n/textos';
import { EASE_SCIENTATA, MOLA_INDICADOR } from '@/lib/movimento';

/** Grupo de opções exclusivas com pílula deslizante. */
function GrupoOpcoes<T extends string>({
  rotulo,
  opcoes,
  valor,
  onChange,
}: {
  readonly rotulo: string;
  readonly opcoes: readonly { valor: T; rotulo: ReactNode; titulo: string }[];
  readonly valor: T;
  readonly onChange: (valor: T) => void;
}): JSX.Element {
  const idLayout = useId();

  return (
    <fieldset>
      <legend className="rotulo mb-2">{rotulo}</legend>
      <div className="grid gap-1 border border-line bg-canvas/50 p-1" style={{ gridTemplateColumns: `repeat(${opcoes.length}, 1fr)` }}>
        {opcoes.map((opcao) => {
          const ativo = opcao.valor === valor;
          return (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={ativo}
              title={opcao.titulo}
              onClick={() => onChange(opcao.valor)}
              className={[
                'relative flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold',
                ativo ? 'text-signal-ink' : 'text-muted hover:text-ink',
              ].join(' ')}
              style={{ ['--brilho-raio' as string]: '60px', ['--brilho-forca' as string]: 0.25 }}
            >
              {ativo && (
                <motion.span
                  layoutId={`opcao-${idLayout}`}
                  transition={MOLA_INDICADOR}
                  aria-hidden="true"
                  className="absolute inset-0 bg-signal-fill"
                />
              )}
              <span className="relative flex items-center gap-1.5">{opcao.rotulo}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Botão de configurações e seu painel.
 */
export function PainelPreferencias(): JSX.Element {
  const { tema, idioma, fonte, reduzirMovimento, definir, restaurar, t } = usePreferencias();
  const [aberto, setAberto] = useState(false);
  const refRaiz = useRef<HTMLDivElement>(null);
  const refBotao = useRef<HTMLButtonElement>(null);
  const idPainel = useId();
  const tp = t.preferencias;

  // Fecha com Escape ou clique fora.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') {
        setAberto(false);
        refBotao.current?.focus();
      }
    };
    const aoClicar = (evento: PointerEvent): void => {
      if (!refRaiz.current?.contains(evento.target as Node)) setAberto(false);
    };
    window.addEventListener('keydown', aoTeclar);
    window.addEventListener('pointerdown', aoClicar);
    return () => {
      window.removeEventListener('keydown', aoTeclar);
      window.removeEventListener('pointerdown', aoClicar);
    };
  }, [aberto]);

  return (
    <div ref={refRaiz} className="relative">
      <button
        ref={refBotao}
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-controls={idPainel}
        aria-label={tp.botao}
        title={tp.botao}
        className="botao-icone group size-9"
      >
        <Settings2
          aria-hidden="true"
          className={[
            'size-4 transition-transform duration-700 ease-scientata group-hover:rotate-90',
            aberto ? 'rotate-90 text-signal' : '',
          ].join(' ')}
        />
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            id={idPainel}
            role="dialog"
            aria-label={tp.titulo}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15 } }}
            transition={{ duration: 0.35, ease: EASE_SCIENTATA }}
            className="absolute top-full right-0 z-50 mt-3 w-[min(19rem,calc(100vw-2rem))] origin-top-right border border-line-forte bg-elevated shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]"
          >
            <p className="card-titulo">
              <Settings2 aria-hidden="true" className="size-3.5 text-signal" />
              {tp.titulo}
            </p>

            <div className="space-y-5 p-4">
              <GrupoOpcoes
                rotulo={tp.tema}
                valor={tema}
                onChange={(v) => definir('tema', v)}
                opcoes={[
                  { valor: 'dark', titulo: tp.escuro, rotulo: <><Moon aria-hidden="true" className="size-3.5" />{tp.escuro}</> },
                  { valor: 'light', titulo: tp.claro, rotulo: <><Sun aria-hidden="true" className="size-3.5" />{tp.claro}</> },
                ]}
              />

              <GrupoOpcoes<Idioma>
                rotulo={tp.idioma}
                valor={idioma}
                onChange={(v) => definir('idioma', v)}
                opcoes={[
                  { valor: 'pt', titulo: 'Português', rotulo: <><span className="font-mono">PT</span>Português</> },
                  { valor: 'en', titulo: 'English', rotulo: <><span className="font-mono">EN</span>English</> },
                ]}
              />

              <GrupoOpcoes<TamanhoFonte>
                rotulo={tp.fonte}
                valor={fonte}
                onChange={(v) => definir('fonte', v)}
                opcoes={[
                  { valor: 'p', titulo: tp.pequena, rotulo: <span className="text-[0.75rem] leading-none">A</span> },
                  { valor: 'm', titulo: tp.media, rotulo: <span className="text-[0.95rem] leading-none">A</span> },
                  { valor: 'g', titulo: tp.grande, rotulo: <span className="text-[1.2rem] leading-none">A</span> },
                ]}
              />

              <div>
                <p className="rotulo mb-2">{tp.movimento}</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={reduzirMovimento}
                  onClick={() => definir('reduzirMovimento', !reduzirMovimento)}
                  className="flex w-full items-center gap-3 border border-line px-3 py-2.5 text-left hover:border-line-forte"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{tp.reduzir}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-faint">{tp.reduzirDescricao}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={[
                      'relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-300',
                      reduzirMovimento ? 'border-signal-fill bg-signal-fill' : 'border-line-forte bg-canvas',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute top-0.5 size-3.5 rounded-full transition-all duration-300 ease-scientata',
                        reduzirMovimento ? 'left-[1.15rem] bg-signal-ink' : 'left-0.5 bg-muted',
                      ].join(' ')}
                    />
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-between border-t border-line px-4 py-2.5">
              <button type="button" onClick={restaurar} className="group rotulo inline-flex items-center gap-1.5 hover:text-signal">
                <RotateCcw aria-hidden="true" className="size-3 transition-transform duration-500 group-hover:-rotate-180" />
                {tp.restaurar}
              </button>
              <button type="button" onClick={() => setAberto(false)} className="rotulo text-signal hover:text-ink" aria-label={tp.fechar}>
                OK
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
