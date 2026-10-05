/**
 * ==========================================================
 * Paleta dos gráficos, sensível ao tema
 * ==========================================================
 *
 * O Recharts recebe cores explícitas, então esta função centraliza os
 * tokens usados por todos os gráficos — os mesmos tons quentes de
 * `index.css` — garantindo legibilidade nos modos claro e escuro.
 *
 * As cores das barras continuam sendo as do semáforo (dado), não do tema.
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
  /** Cor da linha de tendência (o amarelo "sinal"). */
  readonly linhaTendencia: string;
}

/** Família tipográfica dos ticks e rótulos dos gráficos. */
export const FONTE_GRAFICO = "'DM Mono', ui-monospace, monospace";

/** Duração das animações de entrada dos gráficos, em ms. */
export const DURACAO_ANIMACAO_GRAFICO = 900;

/**
 * Devolve a paleta apropriada para o tema ativo.
 *
 * @param escuro `true` quando o tema escuro está ativo.
 */
export function paletaGrafico(escuro: boolean): PaletaGrafico {
  if (escuro) {
    return {
      eixo: '#3d3421',
      grade: 'rgba(255, 214, 120, 0.08)',
      texto: '#d9d3c2',
      textoSuave: '#8a826c',
      destaque: 'rgba(255, 207, 63, 0.07)',
      fundoTooltip: '#1b170e',
      bordaTooltip: '#3d3421',
      linhaTendencia: '#ffcf3f',
    };
  }

  return {
    eixo: '#cfc7b0',
    grade: 'rgba(60, 45, 10, 0.1)',
    texto: '#2e2814',
    textoSuave: '#7a715b',
    destaque: 'rgba(224, 168, 0, 0.08)',
    fundoTooltip: '#ffffff',
    bordaTooltip: '#e2dccb',
    linhaTendencia: '#a87400',
  };
}
