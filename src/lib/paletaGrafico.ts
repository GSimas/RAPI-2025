/**
 * ==========================================================
 * Paleta dos gráficos, sensível ao tema
 * ==========================================================
 *
 * O Streamlit resolvia o contraste dos gráficos automaticamente com
 * `theme="streamlit"`. Como o Recharts recebe cores explícitas, esta
 * função centraliza os tokens usados por todos os gráficos, garantindo
 * legibilidade equivalente nos modos claro e escuro.
 */

/** Conjunto de cores aplicado a eixos, grade, rótulos e tooltip. */
export interface PaletaGrafico {
  /** Cor da linha dos eixos. */
  readonly eixo: string;
  /** Cor das linhas de grade. */
  readonly grade: string;
  /** Cor principal de texto (ticks, rótulos de dados, tooltip). */
  readonly texto: string;
  /** Variante suave, para títulos de eixo e legendas secundárias. */
  readonly textoSuave: string;
  /** Preenchimento do cursor/realce ao passar o mouse. */
  readonly destaque: string;
  /** Fundo da caixa de tooltip. */
  readonly fundoTooltip: string;
  /** Borda da caixa de tooltip. */
  readonly bordaTooltip: string;
  /** Cor da linha de tendência. */
  readonly linhaTendencia: string;
}

/**
 * Devolve a paleta apropriada para o tema ativo.
 *
 * @param escuro `true` quando o tema escuro está ativo.
 */
export function paletaGrafico(escuro: boolean): PaletaGrafico {
  if (escuro) {
    return {
      eixo: '#475569', // slate-600
      grade: 'rgba(148, 163, 184, 0.18)', // slate-400 translúcido
      texto: '#e2e8f0', // slate-200
      textoSuave: '#94a3b8', // slate-400
      destaque: 'rgba(148, 163, 184, 0.12)',
      fundoTooltip: '#0f172a', // slate-900
      bordaTooltip: '#334155', // slate-700
      linhaTendencia: '#94a3b8',
    };
  }

  return {
    eixo: '#cbd5e1', // slate-300
    grade: 'rgba(100, 116, 139, 0.2)', // slate-500 translúcido
    texto: '#1e293b', // slate-800
    textoSuave: '#64748b', // slate-500
    destaque: 'rgba(100, 116, 139, 0.08)',
    fundoTooltip: '#ffffff',
    bordaTooltip: '#e2e8f0', // slate-200
    linhaTendencia: '#888888', // cinza médio, como no Plotly original
  };
}
