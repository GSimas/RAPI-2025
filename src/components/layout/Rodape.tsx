/**
 * ==========================================================
 * <Rodape /> - rodapé global
 * ==========================================================
 *
 * Assinatura grande "RAPI *Floripa*" — que reage ao hover com letras em
 * onda, troca de cores, sublinhado e o símbolo animado, e leva ao topo
 * ao ser clicada —, fonte oficial dos dados, autoria e aviso de licença.
 */

import { ArrowUpRight } from 'lucide-react';
import type { CSSProperties, JSX } from 'react';
import { Revelar } from '@/components/ui/Revelar';
import { LINK_GUSTAVO_SIMAS, LINK_RELATORIO, LINK_SCIENTATA } from '@/content/links';
import { usePreferencias } from '@/hooks/usePreferencias';
import { SimboloRapi } from './Marca';

/** Quebra uma palavra em letras animáveis, com índice para o atraso em cascata. */
function Letras({ palavra, inicio, classe }: { readonly palavra: string; readonly inicio: number; readonly classe: string }): JSX.Element {
  return (
    <>
      {[...palavra].map((letra, indice) => (
        <span key={indice} className={`letra ${classe}`} style={{ '--i': inicio + indice } as CSSProperties}>
          {letra}
        </span>
      ))}
    </>
  );
}

/**
 * Rodapé com fonte dos dados, autoria e aviso de licença.
 */
export function Rodape(): JSX.Element {
  const { t } = usePreferencias();
  const tr = t.rodape;

  return (
    <footer className="mt-24 border-t border-line bg-surface/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        <Revelar>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="assinatura group sem-brilho flex w-full cursor-pointer items-end justify-between gap-6 text-left"
            title={tr.voltarTopo}
          >
            {/* Nome acessível em texto, não em aria-label: as letras visíveis são
                <span>s soltos ("RAPIFloripa") e não casariam com o rótulo (WCAG 2.5.3). */}
            <span className="sr-only">RAPI Floripa — {tr.voltarTopo}</span>
            <span aria-hidden="true" className="relative pb-3 text-[clamp(3.25rem,11vw,8.5rem)] leading-[0.85] font-semibold tracking-[-0.05em] text-ink">
              <Letras palavra="RAPI" inicio={0} classe="letra-rapi" />
              {/* A cor fica no invólucro: assim a regra de hover (index.css) pode sobrescrevê-la nas letras. */}
              <span className="serif font-normal text-signal">
                <Letras palavra="Floripa" inicio={4} classe="letra-floripa" />
              </span>
              <span className="sublinhado absolute inset-x-0 bottom-0 h-[3px] bg-signal-fill" />
            </span>
            <SimboloRapi className="mb-3 hidden size-12 sm:block" />
          </button>
        </Revelar>

        <div className="mt-12 grid gap-8 border-t border-line pt-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="rotulo">{tr.fonte}</p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              <strong className="font-semibold text-ink">{tr.relatorio}</strong> — {tr.entidades}{' '}
              <a href={LINK_RELATORIO} target="_blank" rel="noopener noreferrer" className="link">
                {tr.acessar}
              </a>
            </p>
          </div>

          <div>
            <p className="rotulo">{tr.desenvolvido}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {[
                { rotulo: 'Gustavo Simas', href: LINK_GUSTAVO_SIMAS },
                { rotulo: 'Scientata', href: LINK_SCIENTATA },
              ].map((link) => (
                <a
                  key={link.rotulo}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 border border-line px-3 py-1.5 font-mono text-xs tracking-[0.12em] text-ink uppercase hover:border-signal/50 hover:text-signal"
                >
                  {link.rotulo}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 font-mono text-[0.6875rem] tracking-[0.06em] text-faint">
          <span>{tr.licenca}</span>
          <span className="uppercase">27°35′S — 48°32′W</span>
        </p>
      </div>
    </footer>
  );
}
