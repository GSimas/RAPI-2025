/**
 * ==========================================================
 * Exportacao de CSV no lado do cliente
 * ==========================================================
 *
 * Substitui o botao nativo de download do `st.dataframe` do Streamlit.
 * O arquivo e gerado inteiramente no navegador — nenhuma chamada de rede.
 */

/** Separador `;`, o esperado pelo Excel em locales pt-BR. */
const SEPARADOR = ';';

/**
 * Escapa um campo para CSV: envolve em aspas quando contem separador,
 * aspas ou quebra de linha, duplicando aspas internas.
 */
function escaparCampo(valor: unknown): string {
  if (valor === null || valor === undefined) return '';

  const texto = typeof valor === 'number' ? String(valor).replace('.', ',') : String(valor);

  if (texto.includes(SEPARADOR) || texto.includes('"') || /[\r\n]/.test(texto)) {
    return `"${texto.replaceAll('"', '""')}"`;
  }
  return texto;
}

/**
 * Monta o conteudo de um CSV a partir de cabecalhos e linhas.
 *
 * @param cabecalhos Nomes das colunas, na ordem de saida.
 * @param linhas Matriz de valores alinhada aos cabecalhos.
 */
export function montarCsv(cabecalhos: readonly string[], linhas: readonly unknown[][]): string {
  const linhaCabecalho = cabecalhos.map(escaparCampo).join(SEPARADOR);
  const corpo = linhas.map((linha) => linha.map(escaparCampo).join(SEPARADOR));
  return [linhaCabecalho, ...corpo].join('\r\n');
}

/**
 * Dispara o download de um CSV no navegador.
 *
 * O BOM UTF-8 inicial garante que o Excel reconheca os acentos.
 *
 * @param nomeArquivo Nome sugerido do arquivo (ex.: `indicadores.csv`).
 * @param conteudo Conteudo textual ja no formato CSV.
 */
export function baixarCsv(nomeArquivo: string, conteudo: string): void {
  const bom = '﻿';
  const blob = new Blob([bom + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Libera a memoria do blob assim que o navegador processa o clique.
  URL.revokeObjectURL(url);
}
