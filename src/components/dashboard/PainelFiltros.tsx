/**
 * ==========================================================
 * <PainelFiltros /> - os cinco filtros encadeados
 * ==========================================================
 *
 * Substitui os `st.sidebar.selectbox` do Streamlit. Fica no topo do
 * dashboard para aproveitar a largura disponível e manter os filtros
 * visíveis junto do conteúdo filtrado.
 */

import { AnimatePresence, motion } from 'motion/react';
import type { JSX } from 'react';
import { Select } from '@/components/ui/Select';
import type { EstadoFiltros } from '@/hooks/useFiltros';
import { usePreferencias } from '@/hooks/usePreferencias';
import { EASE_SCIENTATA } from '@/lib/movimento';

interface PainelFiltrosProps {
  readonly filtros: EstadoFiltros;
}

/** Encurta textos longos de indicador para caber no `<option>`. */
function encurtar(texto: string, limite = 110): string {
  return texto.length <= limite ? texto : `${texto.slice(0, limite - 1)}…`;
}

/**
 * Barra de filtros hierárquicos: Dimensão → Pilar → Tema → Subtema →
 * Indicador.
 */
export function PainelFiltros({ filtros }: PainelFiltrosProps): JSX.Element {
  const total = filtros.opcoesIndicador.length;
  const { t } = usePreferencias();
  const td = t.dashboard;

  return (
    <section aria-label={td.filtrosAria} className="card">
      <div className="card-titulo">
        <span className="text-signal">A</span> · {td.navegacao}
        <span className="ml-auto flex items-center gap-1.5 normal-case tracking-normal">
          <span className="relative overflow-hidden text-ink tabular-nums">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={total}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE_SCIENTATA }}
                className="inline-block"
              >
                {total}
              </motion.span>
            </AnimatePresence>
          </span>
          {td.indicadores(total)}
        </span>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          rotulo={td.dimensao}
          valor={filtros.dimensao}
          opcoes={filtros.opcoesDimensao.map((d) => ({ valor: d, rotulo: d }))}
          onChange={filtros.selecionarDimensao}
        />

        <Select
          rotulo={td.pilar}
          valor={filtros.pilar}
          opcoes={filtros.opcoesPilar.map((p) => ({ valor: p, rotulo: p }))}
          onChange={filtros.selecionarPilar}
        />

        <Select
          rotulo={td.tema}
          valor={filtros.tema}
          opcoes={filtros.opcoesTema.map((tema) => ({ valor: tema, rotulo: tema }))}
          onChange={filtros.selecionarTema}
        />

        <Select
          rotulo={td.subtema}
          valor={filtros.subtema}
          opcoes={filtros.opcoesSubtema.map((s) => ({ valor: s, rotulo: s }))}
          onChange={filtros.selecionarSubtema}
        />

        <div className="sm:col-span-2 lg:col-span-4">
          <Select
            rotulo={td.indicador}
            valor={filtros.indicadorId}
            opcoes={filtros.opcoesIndicador.map((i) => ({
              valor: i.id,
              rotulo: encurtar(i.indicador),
            }))}
            onChange={filtros.selecionarIndicador}
            ajuda={td.ajuda}
          />
        </div>
      </div>
    </section>
  );
}
