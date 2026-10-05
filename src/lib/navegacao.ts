/**
 * ==========================================================
 * Mapa de navegação da SPA
 * ==========================================================
 *
 * As cinco páginas da aplicação, na ordem do cabeçalho. Cada página é
 * endereçada pelo hash da URL (`#dashboard`), o que a torna compartilhável
 * e navegável pelo histórico do navegador.
 *
 * Os textos (rótulo, título editorial com destaque em serif e descrição)
 * ficam no dicionário `TEXTOS.paginas`, em cada idioma.
 */

/** Identificadores estáveis das páginas. */
export type IdPagina = 'apresentacao' | 'dashboard' | 'relatorio' | 'explorador' | 'assistente';

/** Definição de uma página. */
export interface DefinicaoPagina {
  readonly id: IdPagina;
  /** Numeração técnica exibida nos rótulos mono ("01"). */
  readonly numero: string;
}

export const PAGINAS: readonly DefinicaoPagina[] = [
  { id: 'apresentacao', numero: '00' },
  { id: 'dashboard', numero: '01' },
  { id: 'relatorio', numero: '02' },
  { id: 'explorador', numero: '03' },
  { id: 'assistente', numero: 'IA' },
];

/** Busca a definição de uma página pelo id. */
export function paginaPorId(id: IdPagina): DefinicaoPagina {
  return PAGINAS.find((pagina) => pagina.id === id) ?? (PAGINAS[0] as DefinicaoPagina);
}

/** Lê a página a partir do hash da URL, caindo no Início. */
export function paginaDoHash(): IdPagina {
  const alvo = window.location.hash.replace('#', '');
  return PAGINAS.some((pagina) => pagina.id === alvo) ? (alvo as IdPagina) : 'apresentacao';
}
