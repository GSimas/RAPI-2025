/**
 * ==========================================================
 * Preferências do usuário (tema, idioma, letra, movimento)
 * ==========================================================
 *
 * Um único contexto concentra as quatro preferências do painel de
 * configurações do cabeçalho. Cada uma é refletida no `<html>`:
 *
 * | preferência        | efeito no DOM                              |
 * |--------------------|--------------------------------------------|
 * | tema               | classe `.dark` (tokens de cor em index.css)|
 * | idioma             | atributo `lang` e título da página         |
 * | tamanho da letra   | `data-fonte` = p · m · g (escala os `rem`) |
 * | reduzir movimento  | `data-movimento` + `MotionConfig` no App   |
 *
 * Tudo é persistido em `localStorage` (`rapi-preferencias`). O estado
 * inicial é lido do DOM, já preparado por `public/tema.js` antes da
 * primeira pintura — sem flash e sem divergência.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type JSX, type ReactNode } from 'react';
import { TEXTOS, type Idioma, type Textos } from '@/i18n/textos';
import { definirLocaleNumeros } from '@/lib/format';

export type Tema = 'light' | 'dark';
export type TamanhoFonte = 'p' | 'm' | 'g';

export interface Preferencias {
  readonly tema: Tema;
  readonly idioma: Idioma;
  readonly fonte: TamanhoFonte;
  readonly reduzirMovimento: boolean;
}

interface ValorContexto extends Preferencias {
  /** Textos da interface no idioma atual. */
  readonly t: Textos;
  readonly definir: <K extends keyof Preferencias>(chave: K, valor: Preferencias[K]) => void;
  readonly restaurar: () => void;
}

const CHAVE_STORAGE = 'rapi-preferencias';

/** Preferência de movimento do sistema operacional. */
function sistemaReduzMovimento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const PADRAO: Preferencias = {
  tema: 'dark',
  idioma: 'pt',
  fonte: 'm',
  reduzirMovimento: false,
};

/** Lê as preferências já aplicadas ao `<html>` por `tema.js`. */
function lerDoDom(): Preferencias {
  if (typeof document === 'undefined') return PADRAO;
  const raiz = document.documentElement;
  const fonte = raiz.dataset['fonte'];
  return {
    tema: raiz.classList.contains('dark') ? 'dark' : 'light',
    idioma: raiz.lang.startsWith('en') ? 'en' : 'pt',
    fonte: fonte === 'p' || fonte === 'g' ? fonte : 'm',
    reduzirMovimento: raiz.dataset['movimento'] === 'reduzido',
  };
}

const Contexto = createContext<ValorContexto | null>(null);

/**
 * Provedor das preferências; envolve toda a aplicação.
 */
export function PreferenciasProvider({ children }: { readonly children: ReactNode }): JSX.Element {
  const [preferencias, setPreferencias] = useState<Preferencias>(lerDoDom);
  const { tema, idioma, fonte, reduzirMovimento } = preferencias;

  // Os formatadores numéricos seguem o idioma (1.282,34 × 1,282.34).
  definirLocaleNumeros(idioma === 'en' ? 'en-US' : 'pt-BR');

  // Reflete no DOM e persiste.
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle('dark', tema === 'dark');
    raiz.lang = idioma === 'en' ? 'en' : 'pt-BR';
    raiz.dataset['fonte'] = fonte;
    raiz.dataset['movimento'] = reduzirMovimento ? 'reduzido' : 'normal';

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', tema === 'dark' ? '#0c0a05' : '#f5f2e8');
    document.title = TEXTOS[idioma].documento.titulo;

    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(preferencias));
      localStorage.removeItem('rapi-tema');
    } catch {
      // Modo privado ou storage bloqueado: vale só para esta sessão.
    }
  }, [preferencias, tema, idioma, fonte, reduzirMovimento]);

  const definir = useCallback(<K extends keyof Preferencias>(chave: K, valor: Preferencias[K]) => {
    setPreferencias((atual) => ({ ...atual, [chave]: valor }));
  }, []);

  const restaurar = useCallback(() => {
    setPreferencias({ ...PADRAO, reduzirMovimento: sistemaReduzMovimento() });
  }, []);

  const valor = useMemo<ValorContexto>(
    () => ({ ...preferencias, t: TEXTOS[idioma], definir, restaurar }),
    [preferencias, idioma, definir, restaurar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** Acesso às preferências e aos textos traduzidos. */
export function usePreferencias(): ValorContexto {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('usePreferencias deve ser usado dentro de <PreferenciasProvider>.');
  return valor;
}
