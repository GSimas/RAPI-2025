/**
 * ==========================================================
 * <AvisoTraducao /> - nota sobre a tradução do relatório
 * ==========================================================
 *
 * Só aparece com a interface em inglês: informa que o texto é uma
 * tradução livre e que os dados seguem no idioma original.
 */

import { Languages } from 'lucide-react';
import type { JSX } from 'react';
import { usePreferencias } from '@/hooks/usePreferencias';

/**
 * Nota de tradução (vazia em português).
 */
export function AvisoTraducao(): JSX.Element | null {
  const { t } = usePreferencias();
  if (!t.traducao.aviso) return null;

  return (
    <p className="mt-4 inline-flex items-start gap-2 border border-line px-3 py-2 text-xs leading-relaxed text-muted">
      <Languages aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-signal" />
      {t.traducao.aviso}
    </p>
  );
}
