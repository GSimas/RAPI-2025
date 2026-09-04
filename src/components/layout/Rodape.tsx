/**
 * ==========================================================
 * <Rodape /> - rodapé global
 * ==========================================================
 *
 * Reúne, ao final de qualquer aba, a fonte oficial dos dados, a autoria da
 * aplicação e o aviso de licença.
 */

import type { JSX } from 'react';
import { LINK_GUSTAVO_SIMAS, LINK_RELATORIO, LINK_SCIENTATA } from '@/content/links';

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
              Desenvolvido por{' '}
              <a
                href={LINK_SCIENTATA}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-rapi-600 underline decoration-rapi-300 underline-offset-2 hover:text-rapi-700 dark:text-rapi-400 dark:hover:text-rapi-300"
              >
                Scientata
              </a>
              <span aria-hidden="true" className="mx-1.5 text-slate-300 dark:text-slate-600">
                |
              </span>
              <a
                href={LINK_GUSTAVO_SIMAS}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-rapi-600 underline decoration-rapi-300 underline-offset-2 hover:text-rapi-700 dark:text-rapi-400 dark:hover:text-rapi-300"
              >
                Gustavo Simas
              </a>
            </p>
          </div>
        </div>

        <p className="mt-6 border-t border-slate-200 pt-4 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          É permitida a reprodução parcial ou total deste material desde que citada a fonte Rede
          Ver a Cidade Floripa, 2024-2025.
        </p>
      </div>
    </footer>
  );
}
