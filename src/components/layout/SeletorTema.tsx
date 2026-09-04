/**
 * ==========================================================
 * <SeletorTema /> - alternador claro / escuro
 * ==========================================================
 */

import type { JSX } from 'react';
import type { Tema } from '@/hooks/useTheme';

interface SeletorTemaProps {
  readonly tema: Tema;
  readonly onAlternar: () => void;
}

/** Ícone de sol, exibido quando o tema escuro está ativo. */
function IconeSol(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="size-4"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

/** Ícone de lua, exibido quando o tema claro está ativo. */
function IconeLua(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/**
 * Botão que alterna entre os temas claro e escuro.
 */
export function SeletorTema({ tema, onAlternar }: SeletorTemaProps): JSX.Element {
  const escuro = tema === 'dark';

  return (
    <button
      type="button"
      onClick={onAlternar}
      aria-pressed={escuro}
      title={escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      {escuro ? <IconeSol /> : <IconeLua />}
      <span className="hidden sm:inline">{escuro ? 'Modo claro' : 'Modo escuro'}</span>
      <span className="sr-only sm:hidden">
        {escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      </span>
    </button>
  );
}
