/**
 * ==========================================================
 * <Abas /> - navegação principal da SPA
 * ==========================================================
 *
 * Substitui o `st.tabs` do Streamlit. Implementa o padrão ARIA de
 * `tablist`/`tab`/`tabpanel`, incluindo navegação por setas do teclado
 * conforme a especificação WAI-ARIA de Tabs.
 */

import { useRef, type JSX } from 'react';

/** Identificadores estáveis das cinco abas da aplicação. */
export type IdAba = 'apresentacao' | 'dashboard' | 'relatorio' | 'explorador' | 'assistente';

/** Definição de uma aba na barra de navegação. */
export interface DefinicaoAba {
  readonly id: IdAba;
  readonly rotulo: string;
  readonly icone: string;
  /** Rótulo curto exibido em telas estreitas. */
  readonly rotuloCurto: string;
}

/** As cinco abas do dashboard, na ordem de exibição. */
export const ABAS: readonly DefinicaoAba[] = [
  { id: 'apresentacao', rotulo: 'Apresentação', rotuloCurto: 'Início', icone: '📖' },
  { id: 'dashboard', rotulo: 'Dashboard Interativo', rotuloCurto: 'Dashboard', icone: '📊' },
  { id: 'relatorio', rotulo: 'Relatório e Análises', rotuloCurto: 'Relatório', icone: '📝' },
  { id: 'explorador', rotulo: 'Explorador Geral', rotuloCurto: 'Explorador', icone: '🗂️' },
  { id: 'assistente', rotulo: 'Assistente IA', rotuloCurto: 'IA', icone: '🤖' },
];

interface AbasProps {
  readonly ativa: IdAba;
  readonly onChange: (id: IdAba) => void;
}

/**
 * Barra de abas horizontal, rolável em telas estreitas.
 */
export function Abas({ ativa, onChange }: AbasProps): JSX.Element {
  const refsBotoes = useRef<Map<IdAba, HTMLButtonElement>>(new Map());

  /** Setas movem o foco e a seleção; Home/End vão aos extremos. */
  const aoTeclar = (evento: React.KeyboardEvent<HTMLDivElement>): void => {
    const indiceAtual = ABAS.findIndex((aba) => aba.id === ativa);
    let proximo = -1;

    if (evento.key === 'ArrowRight') proximo = (indiceAtual + 1) % ABAS.length;
    else if (evento.key === 'ArrowLeft') proximo = (indiceAtual - 1 + ABAS.length) % ABAS.length;
    else if (evento.key === 'Home') proximo = 0;
    else if (evento.key === 'End') proximo = ABAS.length - 1;
    else return;

    evento.preventDefault();
    const alvo = ABAS[proximo];
    if (!alvo) return;

    onChange(alvo.id);
    refsBotoes.current.get(alvo.id)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Seções do dashboard RAPI"
      onKeyDown={aoTeclar}
      className="flex gap-1 overflow-x-auto border-b border-slate-200 px-1 dark:border-slate-800"
    >
      {ABAS.map((aba) => {
        const selecionada = aba.id === ativa;

        return (
          <button
            key={aba.id}
            ref={(elemento) => {
              if (elemento) refsBotoes.current.set(aba.id, elemento);
              else refsBotoes.current.delete(aba.id);
            }}
            type="button"
            role="tab"
            id={`aba-${aba.id}`}
            aria-selected={selecionada}
            aria-controls={`painel-${aba.id}`}
            tabIndex={selecionada ? 0 : -1}
            onClick={() => onChange(aba.id)}
            className={[
              'flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition sm:px-4',
              selecionada
                ? 'border-rapi-600 text-rapi-600 dark:border-rapi-400 dark:text-rapi-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-100',
            ].join(' ')}
          >
            <span aria-hidden="true">{aba.icone}</span>
            <span className="hidden sm:inline">{aba.rotulo}</span>
            <span className="sm:hidden">{aba.rotuloCurto}</span>
          </button>
        );
      })}
    </div>
  );
}
