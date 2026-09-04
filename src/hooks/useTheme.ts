/**
 * ==========================================================
 * Hook de tema (claro / escuro)
 * ==========================================================
 *
 * Substitui o seletor nativo de tema do Streamlit. A preferencia e
 * persistida em `localStorage` e aplicada como a classe `.dark` na tag
 * `<html>`, que e o gatilho do variante `dark:` do Tailwind.
 *
 * O valor inicial e lido do DOM: o script inline do `index.html` ja
 * decidiu o tema antes da primeira pintura, entao aqui apenas seguimos
 * o que ele definiu — sem flash e sem hidratacao divergente.
 */

import { useCallback, useEffect, useState } from 'react';

/** Temas suportados pela aplicacao. */
export type Tema = 'light' | 'dark';

/** Chave usada no `localStorage`; deve casar com a do `index.html`. */
const CHAVE_STORAGE = 'rapi-tema';

/** Le o tema atual a partir da classe presente no `<html>`. */
function lerTemaInicial(): Tema {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Controla o tema da aplicacao.
 *
 * @returns O tema corrente, um alternador e um setter explicito.
 */
export function useTheme(): {
  tema: Tema;
  alternarTema: () => void;
  definirTema: (tema: Tema) => void;
} {
  const [tema, setTema] = useState<Tema>(lerTemaInicial);

  // Reflete o estado no DOM e no armazenamento local.
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle('dark', tema === 'dark');

    try {
      localStorage.setItem(CHAVE_STORAGE, tema);
    } catch {
      // Modo privado ou storage bloqueado: o tema vale só para esta sessão.
    }
  }, [tema]);

  // Acompanha a preferencia do sistema enquanto o usuario nao escolher.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const aoMudar = (evento: MediaQueryListEvent): void => {
      let houveEscolhaManual = false;
      try {
        houveEscolhaManual = localStorage.getItem(CHAVE_STORAGE) !== null;
      } catch {
        houveEscolhaManual = false;
      }
      if (!houveEscolhaManual) setTema(evento.matches ? 'dark' : 'light');
    };

    media.addEventListener('change', aoMudar);
    return () => media.removeEventListener('change', aoMudar);
  }, []);

  const alternarTema = useCallback(() => {
    setTema((atual) => (atual === 'dark' ? 'light' : 'dark'));
  }, []);

  const definirTema = useCallback((novo: Tema) => setTema(novo), []);

  return { tema, alternarTema, definirTema };
}
