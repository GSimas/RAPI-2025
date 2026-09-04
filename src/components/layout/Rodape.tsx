/**
 * ==========================================================
 * <Rodape /> - rodapé global
 * ==========================================================
 *
 * Repete, ao final de qualquer aba, os créditos obrigatórios da fonte
 * oficial e da autoria — os mesmos exibidos na barra lateral.
 */

import type { JSX } from 'react';
import { LINK_LINKEDIN, LINK_RELATORIO, Creditos } from './Creditos';

/**
 * Rodapé com fonte dos dados, autoria e aviso de licença.
 */
export function Rodape(): JSX.Element {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="rotulo-campo flex items-center gap-1.5">
              <span aria-hidden="true">📍</span> Fonte de Dados
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Dados originais extraídos do{' '}
              <a
                href={LINK_RELATORIO}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-rapi-600 underline decoration-rapi-300 underline-offset-2 hover:text-rapi-700 dark:text-rapi-400 dark:hover:text-rapi-300"
              >
                Relatório RAPI 2025
              </a>{' '}
              — Associação FloripAmanhã, UFSC e Observatório Social do Brasil (Florianópolis).
            </p>
          </div>

          <div>
            <p className="rotulo-campo">Desenvolvimento</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
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
        </div>

        <div className="mt-6">
          <Creditos />
        </div>

        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          É permitida a reprodução parcial ou total deste material desde que citada a fonte Rede
          Ver a Cidade Floripa, 2024-2025.
        </p>
      </div>
    </footer>
  );
}
