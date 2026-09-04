/**
 * ==========================================================
 * Aba 4 - Explorador Geral
 * ==========================================================
 *
 * Substitui o `st.dataframe` do "Explorador Geral do Relatório RAPI",
 * entregando no cliente as três funcionalidades que o Streamlit oferecia
 * nativamente:
 *
 * - busca global em todas as colunas;
 * - ordenação por clique no cabeçalho (asc → desc → sem ordenação);
 * - exportação para CSV, gerada no navegador.
 */

import { useMemo, useState, type JSX } from 'react';
import { INDICADORES, TOTAL_INDICADORES } from '@/lib/dataset';
import { baixarCsv, montarCsv } from '@/lib/csv';
import { normalizarChave } from '@/lib/taxonomia';
import type { IndicadorRAPI } from '@/types/rapi';
import { COLUNAS } from './colunas';

/** Direção da ordenação corrente. */
type Direcao = 'asc' | 'desc';

/** Estado da ordenação: coluna e direção, ou nenhuma. */
interface Ordenacao {
  readonly colunaId: string;
  readonly direcao: Direcao;
}

/** Colator pt-BR usado na ordenação de colunas textuais. */
const colator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

/**
 * Tabela completa dos indicadores, com busca, ordenação e exportação.
 */
export function Explorador(): JSX.Element {
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<Ordenacao | null>(null);

  // --- Busca global: compara o termo normalizado com todas as células ----
  const filtrados = useMemo(() => {
    const termo = normalizarChave(busca);
    if (termo === '') return INDICADORES;

    return INDICADORES.filter((indicador) =>
      COLUNAS.some((coluna) => normalizarChave(coluna.exibir(indicador)).includes(termo)),
    );
  }, [busca]);

  // --- Ordenação --------------------------------------------------------
  const linhas = useMemo(() => {
    if (!ordenacao) return filtrados;

    const coluna = COLUNAS.find((c) => c.id === ordenacao.colunaId);
    if (!coluna) return filtrados;

    const fator = ordenacao.direcao === 'asc' ? 1 : -1;

    return [...filtrados].sort((a, b) => {
      const va = coluna.valor(a);
      const vb = coluna.valor(b);

      // Células vazias vão sempre para o fim, independentemente da direção.
      if (va === null || va === '') return vb === null || vb === '' ? 0 : 1;
      if (vb === null || vb === '') return -1;

      if (coluna.tipo === 'numero') {
        return (Number(va) - Number(vb)) * fator;
      }
      return colator.compare(String(va), String(vb)) * fator;
    });
  }, [filtrados, ordenacao]);

  /** Alterna a ordenação de uma coluna: asc → desc → nenhuma. */
  const alternarOrdenacao = (colunaId: string): void => {
    setOrdenacao((atual) => {
      if (atual?.colunaId !== colunaId) return { colunaId, direcao: 'asc' };
      if (atual.direcao === 'asc') return { colunaId, direcao: 'desc' };
      return null;
    });
  };

  /** Exporta as linhas atualmente visíveis (busca e ordenação aplicadas). */
  const exportar = (): void => {
    const conteudo = montarCsv(
      COLUNAS.map((coluna) => coluna.titulo),
      linhas.map((indicador) => COLUNAS.map((coluna) => coluna.valor(indicador))),
    );

    const carimbo = new Date().toISOString().slice(0, 10);
    baixarCsv(`rapi-2024-2025-indicadores-${carimbo}.csv`, conteudo);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <header>
        <h2 className="titulo-secao">
          <span aria-hidden="true">📚 </span>
          Explorador Geral do Relatório RAPI
        </h2>
        <p className="mt-2 max-w-4xl text-slate-600 dark:text-slate-400">
          Explore, filtre e baixe a base de dados completa — incluindo os valores originais do
          relatório e os valores numéricos extraídos automaticamente.
        </p>
      </header>

      {/* --- Controles ----------------------------------------------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-md">
          <label htmlFor="busca-explorador" className="rotulo-campo">
            Busca global
          </label>
          <div className="relative mt-1.5">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"
            >
              🔎
            </span>
            <input
              id="busca-explorador"
              type="search"
              className="campo pl-9"
              placeholder="Buscar por tema, órgão, indicador, valor…"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <strong className="font-semibold text-slate-800 dark:text-slate-100">
              {linhas.length}
            </strong>{' '}
            de {TOTAL_INDICADORES} indicadores
          </p>

          <button
            type="button"
            onClick={exportar}
            disabled={linhas.length === 0}
            className="flex items-center gap-2 rounded-lg bg-rapi-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rapi-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M10 3v10m0 0 4-4m-4 4-4-4M3 16h14" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* --- Tabela --------------------------------------------------- */}
      <div className="cartao overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Base completa dos indicadores do RAPI 2024-2025, com valores originais e numéricos
              por ano e as faixas de semaforização.
            </caption>

            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
              <tr>
                {COLUNAS.map((coluna) => {
                  const ativa = ordenacao?.colunaId === coluna.id;
                  const direcao = ativa ? ordenacao.direcao : null;

                  return (
                    <th
                      key={coluna.id}
                      scope="col"
                      aria-sort={
                        direcao === 'asc'
                          ? 'ascending'
                          : direcao === 'desc'
                            ? 'descending'
                            : 'none'
                      }
                      className={`${coluna.larguraMinima} border-b border-slate-300 p-0 dark:border-slate-700`}
                    >
                      <button
                        type="button"
                        onClick={() => alternarOrdenacao(coluna.id)}
                        className={[
                          'flex w-full items-center gap-1 px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap transition',
                          'hover:bg-slate-200 dark:hover:bg-slate-700',
                          coluna.tipo === 'numero' ? 'justify-end' : '',
                          ativa
                            ? 'text-rapi-700 dark:text-rapi-300'
                            : 'text-slate-600 dark:text-slate-300',
                        ].join(' ')}
                        title={`Ordenar por ${coluna.titulo}`}
                      >
                        {coluna.titulo}
                        <span aria-hidden="true" className="text-[0.6rem]">
                          {direcao === 'asc' ? '▲' : direcao === 'desc' ? '▼' : '↕'}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {linhas.map((indicador) => (
                <LinhaIndicador key={indicador.id} indicador={indicador} />
              ))}

              {linhas.length === 0 && (
                <tr>
                  <td
                    colSpan={COLUNAS.length}
                    className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    Nenhum indicador encontrado para “{busca}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        💡 Clique nos cabeçalhos para ordenar (crescente → decrescente → original). A exportação
        respeita a busca e a ordenação vigentes.
      </p>
    </div>
  );
}

/**
 * Uma linha da tabela do Explorador.
 */
function LinhaIndicador({ indicador }: { readonly indicador: IndicadorRAPI }): JSX.Element {
  return (
    <tr className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
      {COLUNAS.map((coluna) => {
        const texto = coluna.exibir(indicador);

        return (
          <td
            key={coluna.id}
            className={[
              'px-3 py-2 align-top text-slate-700 dark:text-slate-300',
              coluna.tipo === 'numero' ? 'text-right font-mono tabular-nums' : '',
            ].join(' ')}
            title={texto.length > 60 ? texto : undefined}
          >
            {texto || <span className="text-slate-300 dark:text-slate-600">—</span>}
          </td>
        );
      })}
    </tr>
  );
}
