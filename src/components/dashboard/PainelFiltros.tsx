/**
 * ==========================================================
 * <PainelFiltros /> - os cinco filtros encadeados
 * ==========================================================
 *
 * Substitui os `st.sidebar.selectbox` do Streamlit. Fica no topo do
 * dashboard (e não na barra lateral) para aproveitar melhor a largura
 * disponível e manter os filtros visíveis junto do conteúdo filtrado.
 */

import type { JSX } from 'react';
import { Select } from '@/components/ui/Select';
import { ICONE_DIMENSAO } from '@/lib/taxonomia';
import type { EstadoFiltros } from '@/hooks/useFiltros';

interface PainelFiltrosProps {
  readonly filtros: EstadoFiltros;
}

/** Encurta textos longos de indicador para caber no `<option>`. */
function encurtar(texto: string, limite = 90): string {
  return texto.length <= limite ? texto : `${texto.slice(0, limite - 1)}…`;
}

/**
 * Barra de filtros hierárquicos: Dimensão → Pilar → Tema → Subtema →
 * Indicador.
 */
export function PainelFiltros({ filtros }: PainelFiltrosProps): JSX.Element {
  return (
    <section
      aria-label="Filtros do dashboard"
      className="cartao p-4 sm:p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <span aria-hidden="true">🔍</span>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Navegação do Dashboard
        </h3>
        <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {filtros.opcoesIndicador.length}{' '}
          {filtros.opcoesIndicador.length === 1 ? 'indicador' : 'indicadores'}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          rotulo="1. Dimensão"
          valor={filtros.dimensao}
          opcoes={filtros.opcoesDimensao.map((d) => ({
            valor: d,
            rotulo: `${ICONE_DIMENSAO[d]} ${d}`,
          }))}
          onChange={filtros.selecionarDimensao}
        />

        <Select
          rotulo="2. Pilar"
          valor={filtros.pilar}
          opcoes={filtros.opcoesPilar.map((p) => ({ valor: p, rotulo: p }))}
          onChange={filtros.selecionarPilar}
        />

        <Select
          rotulo="3. Tema"
          valor={filtros.tema}
          opcoes={filtros.opcoesTema.map((t) => ({ valor: t, rotulo: t }))}
          onChange={filtros.selecionarTema}
        />

        <Select
          rotulo="4. Subtema"
          valor={filtros.subtema}
          opcoes={filtros.opcoesSubtema.map((s) => ({ valor: s, rotulo: s }))}
          onChange={filtros.selecionarSubtema}
        />
      </div>

      <div className="mt-4">
        <Select
          rotulo="5. Indicador"
          valor={filtros.indicadorId}
          opcoes={filtros.opcoesIndicador.map((i) => ({
            valor: i.id,
            rotulo: encurtar(i.indicador),
          }))}
          onChange={filtros.selecionarIndicador}
          ajuda="Os filtros são encadeados: alterar um nível reajusta automaticamente os seguintes."
        />
      </div>
    </section>
  );
}
