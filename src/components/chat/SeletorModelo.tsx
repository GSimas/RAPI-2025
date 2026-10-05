/**
 * ==========================================================
 * <SeletorModelo /> - escolha do modelo de IA
 * ==========================================================
 *
 * Combobox pesquisável (o catálogo da OpenRouter tem centenas de
 * modelos). Quando a lista informa preços, oferece o filtro
 * "Grátis / Todos". Teclado: ↑ ↓ navegam, Enter escolhe, Esc fecha.
 */

import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useMemo, useRef, useState, type JSX, type KeyboardEvent } from 'react';
import type { ModeloIA } from '@/lib/chatApi';
import { usePreferencias } from '@/hooks/usePreferencias';
import { localeNumeros } from '@/lib/format';
import { EASE_SCIENTATA } from '@/lib/movimento';
import { normalizarChave } from '@/lib/taxonomia';

interface SeletorModeloProps {
  readonly modelos: readonly ModeloIA[];
  readonly valor: string;
  readonly onChange: (id: string) => void;
  readonly carregando?: boolean;
  readonly desabilitado?: boolean;
}

/** Limite de itens renderizados de uma vez (a busca refina o resto). */
const MAXIMO_VISIVEIS = 200;

/** Tamanho de contexto compacto (ex.: 128 mil / 128K), no locale ativo. */
function formatarContexto(n: number): string {
  return new Intl.NumberFormat(localeNumeros(), { notation: 'compact', maximumFractionDigits: 0 }).format(n);
}

/**
 * Seletor de modelo com busca e filtro de gratuidade.
 */
export function SeletorModelo({ modelos, valor, onChange, carregando = false, desabilitado = false }: SeletorModeloProps): JSX.Element {
  const ts = usePreferencias().t.chat.seletor;
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [soGratis, setSoGratis] = useState(true);
  const [ativo, setAtivo] = useState(0);
  const refRaiz = useRef<HTMLDivElement>(null);
  const refLista = useRef<HTMLUListElement>(null);
  const idLista = useId();

  const temPrecos = modelos.some((modelo) => modelo.gratis !== undefined);
  const atual = modelos.find((modelo) => modelo.id === valor);

  const filtrados = useMemo(() => {
    const termo = normalizarChave(busca);
    return modelos
      .filter((modelo) => !temPrecos || !soGratis || modelo.gratis)
      .filter((modelo) => !termo || normalizarChave(`${modelo.nome} ${modelo.id}`).includes(termo))
      .slice(0, MAXIMO_VISIVEIS);
  }, [modelos, busca, soGratis, temPrecos]);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return;
    const aoClicar = (evento: PointerEvent): void => {
      if (!refRaiz.current?.contains(evento.target as Node)) setAberto(false);
    };
    window.addEventListener('pointerdown', aoClicar);
    return () => window.removeEventListener('pointerdown', aoClicar);
  }, [aberto]);

  // Mantém o item ativo visível.
  useEffect(() => {
    refLista.current?.querySelector<HTMLElement>(`[data-indice="${ativo}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [ativo]);

  const escolher = (id: string): void => {
    onChange(id);
    setAberto(false);
    setBusca('');
  };

  const aoTeclar = (evento: KeyboardEvent<HTMLInputElement>): void => {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      setAtivo((i) => Math.min(i + 1, filtrados.length - 1));
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      setAtivo((i) => Math.max(i - 1, 0));
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      const alvo = filtrados[ativo];
      if (alvo) escolher(alvo.id);
    } else if (evento.key === 'Escape') {
      setAberto(false);
    }
  };

  return (
    <div ref={refRaiz} className="relative min-w-0">
      <button
        type="button"
        onClick={() => {
          setAberto((a) => !a);
          setAtivo(0);
        }}
        disabled={desabilitado || carregando}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className="flex w-full max-w-[19rem] min-w-0 items-center gap-2 border border-line-forte px-2.5 py-1.5 text-left normal-case tracking-normal hover:border-signal/50 disabled:opacity-50"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-sans text-xs font-semibold text-ink">
            {carregando ? ts.carregando : (atual?.nome ?? valor)}
          </span>
          {atual && atual.nome !== atual.id && (
            <span className="block truncate font-mono text-[0.625rem] text-faint">{atual.id}</span>
          )}
        </span>
        {atual?.gratis && <span className="chip shrink-0 border-signal/40 text-[0.5625rem] text-signal">{ts.gratis}</span>}
        <ChevronsUpDown aria-hidden="true" className="size-3.5 shrink-0 text-faint" />
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease: EASE_SCIENTATA }}
            className="absolute top-full right-0 z-40 mt-2 w-[min(24rem,calc(100vw-2rem))] origin-top-right border border-line-forte bg-elevated normal-case tracking-normal shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]"
          >
            <div className="space-y-2 border-b border-line p-3">
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-faint" />
                <input
                  type="search"
                  autoFocus
                  role="combobox"
                  aria-controls={idLista}
                  aria-expanded="true"
                  aria-activedescendant={filtrados[ativo] ? `${idLista}-${ativo}` : undefined}
                  aria-label={ts.buscar}
                  placeholder={ts.buscarPlaceholder(modelos.length)}
                  className="campo pl-8 font-sans"
                  value={busca}
                  onChange={(evento) => {
                    setBusca(evento.target.value);
                    setAtivo(0);
                  }}
                  onKeyDown={aoTeclar}
                />
              </div>
              {temPrecos && (
                <div className="flex gap-1" role="group" aria-label={ts.filtroCusto}>
                  {[
                    { id: true, rotulo: ts.soGratis },
                    { id: false, rotulo: ts.todos },
                  ].map((opcao) => (
                    <button
                      key={opcao.rotulo}
                      type="button"
                      aria-pressed={soGratis === opcao.id}
                      onClick={() => {
                        setSoGratis(opcao.id);
                        setAtivo(0);
                      }}
                      className={[
                        'px-2.5 py-1 font-mono text-[0.625rem] tracking-[0.12em] uppercase',
                        soGratis === opcao.id ? 'bg-signal-fill text-signal-ink' : 'text-muted hover:text-ink',
                      ].join(' ')}
                    >
                      {opcao.rotulo}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ul ref={refLista} id={idLista} role="listbox" aria-label={ts.modelos} className="max-h-72 overflow-y-auto py-1">
              {filtrados.map((modelo, indice) => {
                const selecionado = modelo.id === valor;
                return (
                  <li
                    key={modelo.id}
                    id={`${idLista}-${indice}`}
                    data-indice={indice}
                    role="option"
                    aria-selected={selecionado}
                    onPointerEnter={() => setAtivo(indice)}
                    onClick={() => escolher(modelo.id)}
                    className={[
                      'flex cursor-pointer items-start gap-2 px-3 py-2',
                      indice === ativo ? 'bg-signal/[0.08]' : '',
                    ].join(' ')}
                  >
                    <Check
                      aria-hidden="true"
                      className={`mt-0.5 size-3.5 shrink-0 ${selecionado ? 'text-signal' : 'opacity-0'}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-ink">{modelo.nome}</span>
                      <span className="block truncate font-mono text-[0.625rem] text-faint">{modelo.id}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-0.5">
                      {modelo.gratis && <span className="font-mono text-[0.5625rem] tracking-[0.1em] text-signal uppercase">{ts.gratis}</span>}
                      {modelo.contexto && (
                        <span className="font-mono text-[0.5625rem] text-faint">{formatarContexto(modelo.contexto)} ctx</span>
                      )}
                    </span>
                  </li>
                );
              })}
              {filtrados.length === 0 && <li className="px-3 py-4 text-center text-xs text-faint">{ts.nenhum}</li>}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
