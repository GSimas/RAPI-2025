/**
 * ==========================================================
 * Exportacao de CSV no lado do cliente
 * ==========================================================
 *
 * Substitui o botao nativo de download do `st.dataframe` do Streamlit.
 * O arquivo e gerado inteiramente no navegador — nenhuma chamada de rede.
 */

import { localeNumeros } from './format';

/**
 * Convenção de CSV do locale ativo: em pt-BR o Excel espera `;` como
 * separador e `,` como decimal; em inglês, `,` e `.`.
 */
function convencao(): { separador: string; decimal: string } {
  return localeNumeros().startsWith('pt') ? { separador: ';', decimal: ',' } : { separador: ',', decimal: '.' };
}

/**
 * Escapa um campo para CSV: envolve em aspas quando contem separador,
 * aspas ou quebra de linha, duplicando aspas internas.
 *
 * Campos iniciados por `=`, `+`, `-` ou `@` recebem um apóstrofo à frente,
 * neutralizando injeção de fórmulas ao abrir o arquivo numa planilha.
 */
function escaparCampo(valor: unknown, separador: string, decimal: string): string {
  if (valor === null || valor === undefined) return '';

  let texto = typeof valor === 'number' ? String(valor).replace('.', decimal) : String(valor);

  if (typeof valor !== 'number' && /^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;

  if (texto.includes(separador) || texto.includes('"') || /[\r\n]/.test(texto)) {
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
  const { separador, decimal } = convencao();
  const escapar = (valor: unknown): string => escaparCampo(valor, separador, decimal);
  const linhaCabecalho = cabecalhos.map(escapar).join(separador);
  const corpo = linhas.map((linha) => linha.map(escapar).join(separador));
  return [linhaCabecalho, ...corpo].join('\r\n');
}

/**
 * Dispara o download de um arquivo gerado no navegador.
 *
 * @param nomeArquivo Nome sugerido do arquivo.
 * @param conteudo Blob com o conteúdo.
 */
export function baixarBlob(nomeArquivo: string, conteudo: Blob): void {
  const url = URL.createObjectURL(conteudo);

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Libera a memória do blob depois que o navegador processa o clique.
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
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
  baixarBlob(nomeArquivo, new Blob([bom + conteudo], { type: 'text/csv;charset=utf-8;' }));
}

/** Converte um texto livre num trecho seguro de nome de arquivo. */
export function slugArquivo(texto: string, limite = 60): string {
  return (
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, limite)
      .replace(/-+$/, '') || 'dados'
  );
}

/** Carimbo de data (AAAA-MM-DD) para nomes de arquivo. */
export function carimboData(): string {
  return new Date().toISOString().slice(0, 10);
}
