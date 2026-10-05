/**
 * ==========================================================
 * <TabelaDados /> - tabela com filtros, ordenação e exportação
 * ==========================================================
 *
 * Componente único para todas as tabelas da aplicação:
 *
 * - **ordenação** por clique no título da coluna (crescente →
 *   decrescente → original);
 * - **filtro por coluna**, adequado ao tipo (texto, categoria, número,
 *   data), aberto pelo ícone de funil do cabeçalho;
 * - **busca global** opcional em todas as colunas;
 * - **exportação** em CSV ou Excel (XLSX) do recorte visível — filtros e
 *   ordenação aplicados.
 *
 * Os filtros ativos aparecem como chips removíveis acima da tabela.
 */

import { ArrowDown, ArrowUp, ArrowUpDown, ListFilter, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useDeferredValue, useMemo, useState, type JSX } from 'react';
import { usePreferencias } from '@/hooks/usePreferencias';
import { normalizarChave } from '@/lib/taxonomia';
import { EASE_SCIENTATA } from '@/lib/movimento';
import { BotoesExportar } from './BotoesExportar';
import {
  descreverFiltro,
  filtroAtivo,
  ordenar,
  passaNoFiltro,
  textoCelula,
  type ColunaTabela,
  type Filtro,
  type MapaFiltros,
  type Ordenacao,
} from './modelo';
import { PopoverFiltro } from './PopoverFiltro';

interface TabelaDadosProps<T> {
  readonly colunas: readonly ColunaTabela<T>[];
  readonly linhas: readonly T[];
  /** Identificador estável de cada linha. */
  readonly chaveLinha: (linha: T) => string;
  /** Descrição acessível da tabela. */
  readonly legenda: string;
  /** Base do nome dos arquivos exportados (sem extensão). */
  readonly nomeArquivo: string;
  /** Nome da aba no XLSX. */
  readonly tituloPlanilha: string;
  /** Exibe o campo de busca global. */
  readonly buscaGlobal?: boolean;
  /** Classe de altura máxima da área rolável. */
  readonly alturaMaxima?: string;
}

/**
 * Tabela de dados interativa.
 */
export function TabelaDados<T>({
  colunas,
  linhas,
  chaveLinha,
  legenda,
  nomeArquivo,
  tituloPlanilha,
  buscaGlobal = false,
  alturaMaxima = 'max-h-[70vh]',
}: TabelaDadosProps<T>): JSX.Element {
  const { t } = usePreferencias();
  const tt = t.tabela;
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<MapaFiltros>({});
  const [ordenacao, setOrdenacao] = useState<Ordenacao | null>(null);
  const [filtroAberto, setFiltroAberto] = useState<{ id: string; ancora: HTMLElement } | null>(null);

  // --- Filtragem -------------------------------------------------------
  const ativos = useMemo(
    () => Object.entries(filtros).filter((entrada): entrada is [string, Filtro] => filtroAtivo(entrada[1])),
    [filtros],
  );

  // O campo responde na hora; a filtragem e a tabela são recalculadas como
  // atualização adiada (interrompível), sem travar a digitação (INP).
  const buscaAdiada = useDeferredValue(busca);
  const ativosAdiados = useDeferredValue(ativos);

  const filtradas = useMemo(() => {
    const termo = normalizarChave(buscaAdiada);

    return linhas.filter((linha) => {
      for (const [id, filtro] of ativosAdiados) {
        const coluna = colunas.find((c) => c.id === id);
        if (coluna && !passaNoFiltro(coluna, linha, filtro)) return false;
      }
      if (termo === '') return true;
      return colunas.some((coluna) => normalizarChave(textoCelula(coluna, linha)).includes(termo));
    });
  }, [linhas, colunas, ativosAdiados, buscaAdiada]);

  // --- Ordenação -------------------------------------------------------
  const visiveis = useMemo(() => {
    if (!ordenacao) return filtradas;
    const coluna = colunas.find((c) => c.id === ordenacao.colunaId);
    return coluna ? ordenar(filtradas, coluna, ordenacao.direcao) : filtradas;
  }, [filtradas, colunas, ordenacao]);

  // Linhas memoizadas: re-renderizações urgentes (cada tecla, abrir um
  // filtro) não reconstroem as centenas de células da tabela.
  const corpo = useMemo(
    () =>
      visiveis.map((linha) => (
        <tr
          key={chaveLinha(linha)}
          className="border-b border-line transition-colors duration-200 last:border-0 hover:bg-signal/[0.045]"
        >
          {colunas.map((coluna) => {
            const texto = textoCelula(coluna, linha);
            return (
              <td
                key={coluna.id}
                className={[
                  'px-3 py-2.5 align-top text-ink/80',
                  coluna.tipo === 'numero' ? 'text-right font-mono text-[0.8125rem] tabular-nums' : '',
                ].join(' ')}
                title={texto.length > 60 ? texto : undefined}
              >
                {coluna.render
                  ? coluna.render(linha)
                  : texto || <span className="text-faint/60">—</span>}
              </td>
            );
          })}
        </tr>
      )),
    [visiveis, colunas, chaveLinha],
  );

  const alternarOrdenacao = (colunaId: string): void => {
    setOrdenacao((atual) => {
      if (atual?.colunaId !== colunaId) return { colunaId, direcao: 'asc' };
      if (atual.direcao === 'asc') return { colunaId, direcao: 'desc' };
      return null;
    });
  };

  /** Grava (ou remove) o filtro de uma coluna. Filtros inativos são mantidos para preservar o rascunho. */
  const definirFiltro = useCallback((id: string, filtro: Filtro | undefined) => {
    setFiltros((atuais) => {
      const proximos = { ...atuais };
      if (filtro) proximos[id] = filtro;
      else delete proximos[id];
      return proximos;
    });
  }, []);

  const limparTudo = (): void => {
    setFiltros({});
    setBusca('');
  };

  const fecharFiltro = useCallback(() => setFiltroAberto(null), []);
  const colunaAberta = filtroAberto ? colunas.find((c) => c.id === filtroAberto.id) : undefined;
  const haRestricao = ativos.length > 0 || busca.trim() !== '';

  return (
    <div className="space-y-3">
      {/* --- Barra de ferramentas ------------------------------------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {buscaGlobal ? (
          <div className="group relative w-full sm:max-w-sm">
            <label htmlFor={`busca-${nomeArquivo}`} className="sr-only">
              {tt.busca}
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint transition-colors duration-300 group-focus-within:text-signal"
            />
            <input
              id={`busca-${nomeArquivo}`}
              type="search"
              className="campo pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
              placeholder={tt.buscaPlaceholder}
              value={busca}
              maxLength={200}
              onChange={(evento) => setBusca(evento.target.value)}
            />
            <AnimatePresence>
              {busca && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.25, ease: EASE_SCIENTATA }}
                  onClick={() => setBusca('')}
                  className="botao-icone absolute top-1/2 right-1 size-7 -translate-y-1/2 p-0"
                  aria-label={tt.limparBusca}
                >
                  <X className="size-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <span />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <p className="rotulo whitespace-nowrap" aria-live="polite">
            {tt.linhas(visiveis.length, linhas.length)}
          </p>
          <BotoesExportar
            colunas={colunas}
            linhas={visiveis}
            nomeArquivo={nomeArquivo}
            tituloPlanilha={tituloPlanilha}
          />
        </div>
      </div>

      {/* --- Chips dos filtros ativos --------------------------------- */}
      <AnimatePresence initial={false}>
        {haRestricao && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_SCIENTATA }}
            className="overflow-hidden"
          >
            <ul className="flex flex-wrap items-center gap-2 pb-1" aria-label={tt.filtrosAtivos}>
              <AnimatePresence initial={false}>
                {ativos.map(([id, filtro]) => {
                  const coluna = colunas.find((c) => c.id === id);
                  return (
                    <motion.li
                      key={id}
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.25, ease: EASE_SCIENTATA }}
                    >
                      <button
                        type="button"
                        onClick={() => definirFiltro(id, undefined)}
                        className="group inline-flex max-w-[22rem] items-center gap-1.5 border border-signal/40 bg-signal/[0.07] px-2 py-1 text-xs text-ink hover:border-signal"
                        aria-label={tt.removerFiltro(coluna?.titulo ?? id)}
                      >
                        <span className="font-mono text-[0.625rem] tracking-[0.1em] text-signal uppercase">
                          {coluna?.titulo}
                        </span>
                        <span className="truncate">{descreverFiltro(filtro, t.filtro)}</span>
                        <X aria-hidden="true" className="size-3 shrink-0 text-muted group-hover:text-signal" />
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
              <motion.li layout>
                <button type="button" onClick={limparTudo} className="rotulo px-1 hover:text-signal">
                  {tt.limparTudo}
                </button>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Tabela --------------------------------------------------- */}
      <div className="card overflow-hidden [--brilho-forca:0]">
        <div className={`${alturaMaxima} overflow-auto`}>
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{legenda}</caption>

            <thead className="sticky top-0 z-10 bg-elevated">
              <tr>
                {colunas.map((coluna) => {
                  const ordenada = ordenacao?.colunaId === coluna.id;
                  const direcao = ordenada ? ordenacao.direcao : null;
                  const IconeOrdem = direcao === 'asc' ? ArrowUp : direcao === 'desc' ? ArrowDown : ArrowUpDown;
                  const filtrada = filtroAtivo(filtros[coluna.id]);
                  const aberta = filtroAberto?.id === coluna.id;
                  const numerica = coluna.tipo === 'numero';

                  return (
                    <th
                      key={coluna.id}
                      scope="col"
                      aria-sort={direcao === 'asc' ? 'ascending' : direcao === 'desc' ? 'descending' : 'none'}
                      className={`${coluna.larguraMinima ?? ''} border-b border-line-forte p-0 align-bottom`}
                    >
                      <div className={`flex items-stretch ${numerica ? 'flex-row-reverse' : ''}`}>
                        <button
                          type="button"
                          onClick={() => alternarOrdenacao(coluna.id)}
                          className={[
                            'group flex min-w-0 flex-1 items-center gap-1.5 py-3 pl-3 text-left font-mono text-[0.6875rem] font-normal tracking-[0.08em] whitespace-nowrap uppercase',
                            numerica ? 'justify-end pr-1' : 'pr-1',
                            ordenada ? 'text-signal' : 'text-muted hover:text-ink',
                          ].join(' ')}
                          style={{ ['--brilho-raio' as string]: '90px', ['--brilho-forca' as string]: 0.18 }}
                          title={tt.ordenarPor(coluna.titulo)}
                        >
                          {coluna.titulo}
                          <IconeOrdem
                            aria-hidden="true"
                            className={[
                              'size-3 shrink-0 transition-opacity duration-300',
                              ordenada ? 'opacity-100' : 'opacity-30 group-hover:opacity-80',
                            ].join(' ')}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={(evento) => {
                            const ancora = evento.currentTarget;
                            setFiltroAberto((atual) => (atual?.id === coluna.id ? null : { id: coluna.id, ancora }));
                          }}
                          aria-haspopup="dialog"
                          aria-expanded={aberta}
                          aria-label={`${tt.filtrar(coluna.titulo)}${filtrada ? tt.filtroAtivo : ''}`}
                          title={tt.filtrar(coluna.titulo)}
                          className={[
                            'relative flex shrink-0 items-center px-2',
                            filtrada || aberta ? 'text-signal' : 'text-faint hover:text-ink',
                          ].join(' ')}
                          style={{ ['--brilho-raio' as string]: '40px', ['--brilho-forca' as string]: 0.3 }}
                        >
                          <ListFilter aria-hidden="true" className="size-3.5" />
                          {filtrada && (
                            <span aria-hidden="true" className="absolute top-2 right-1 size-1.5 rounded-full bg-signal-fill" />
                          )}
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {corpo}

              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={colunas.length} className="px-4 py-14 text-center text-muted">
                    {tt.nenhumaLinha}{' '}
                    <button type="button" onClick={limparTudo} className="link">
                      {tt.limparFiltros}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {filtroAberto && colunaAberta && (
          <PopoverFiltro
            key={colunaAberta.id}
            coluna={colunaAberta}
            linhas={linhas}
            filtro={filtros[colunaAberta.id]}
            onChange={(filtro) => definirFiltro(colunaAberta.id, filtro)}
            ancora={filtroAberto.ancora}
            onFechar={fecharFiltro}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
