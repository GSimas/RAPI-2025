/**
 * ==========================================================
 * <Sidebar /> - barra lateral institucional
 * ==========================================================
 *
 * Transpõe a `st.sidebar` do Streamlit: identidade visual, resumo do
 * relatório, fonte oficial dos dados e créditos de autoria.
 *
 * Em telas pequenas vira uma gaveta sobreposta, controlada pelo cabeçalho.
 */

import type { JSX } from 'react';
import { TOTAL_INDICADORES } from '@/lib/dataset';
import { LINK_LINKEDIN, LINK_RELATORIO, Creditos } from './Creditos';

interface SidebarProps {
  /** Se a gaveta está aberta (apenas em telas pequenas). */
  readonly aberta: boolean;
  readonly onFechar: () => void;
}

/**
 * Barra lateral fixa em telas grandes e deslizante em telas pequenas.
 */
export function Sidebar({ aberta, onFechar }: SidebarProps): JSX.Element {
  return (
    <>
      {/* Véu escuro atrás da gaveta em telas pequenas. */}
      {aberta && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onFechar}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Informações do relatório e créditos"
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-y-auto border-r border-slate-200 bg-white transition-transform duration-300',
          'dark:border-slate-800 dark:bg-slate-900',
          'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          aberta ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* --- Cabeçalho da barra ------------------------------------- */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold tracking-widest text-rapi-600 uppercase dark:text-rapi-400">
              Florianópolis
            </p>
            <h1 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-50">
              RAPI 2024-2025
            </h1>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
            aria-label="Fechar menu lateral"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="size-5"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        {/* --- Resumo do relatório ------------------------------------ */}
        <div className="space-y-4 px-5 py-5">
          <div className="rounded-lg border border-rapi-200 bg-rapi-50 p-4 dark:border-rapi-900 dark:bg-rapi-950/40">
            <p className="text-sm font-semibold text-rapi-800 dark:text-rapi-200">
              Relatório Anual de Progresso dos Indicadores
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-rapi-700 dark:text-rapi-300">
              9ª edição · Metodologia CES/BID · {TOTAL_INDICADORES} indicadores monitorados nas
              dimensões ambiental, urbana e fiscal.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              { rotulo: 'Dimensões', valor: '3' },
              { rotulo: 'Pilares', valor: '12' },
              { rotulo: 'Temas', valor: '25' },
            ].map((item) => (
              <div
                key={item.rotulo}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <dd className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  {item.valor}
                </dd>
                <dt className="mt-0.5 text-[0.65rem] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                  {item.rotulo}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        {/* --- Fonte dos dados ---------------------------------------- */}
        <div className="mt-auto space-y-4 border-t border-slate-200 px-5 py-5 dark:border-slate-800">
          <div>
            <p className="rotulo-campo flex items-center gap-1.5">
              <span aria-hidden="true">📍</span> Fonte de Dados
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Dados originais extraídos do{' '}
              <a
                href={LINK_RELATORIO}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-rapi-600 underline decoration-rapi-300 underline-offset-2 hover:text-rapi-700 dark:text-rapi-400 dark:hover:text-rapi-300"
              >
                Relatório RAPI 2025
              </a>
              .
            </p>
          </div>

          <div>
            <p className="rotulo-campo">Desenvolvimento</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Orgulhosamente desenvolvida por{' '}
              <a
                href={LINK_LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-rapi-600 underline decoration-rapi-300 underline-offset-2 hover:text-rapi-700 dark:text-rapi-400 dark:hover:text-rapi-300"
              >
                Gustavo Simas da Silva
              </a>
              .
            </p>
          </div>

          <Creditos />
        </div>
      </aside>
    </>
  );
}
