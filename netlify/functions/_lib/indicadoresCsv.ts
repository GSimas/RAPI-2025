/**
 * ==========================================================
 * CSV de indicadores para o contexto do modelo
 * ==========================================================
 *
 * Porte da otimização de tokens do `inicializar_chatbot`: em vez de
 * enviar o JSON completo ao Gemini, monta-se um CSV enxuto — mesmas
 * colunas do original (`tema`, `indicador`, `2023`, `2024`), separadas
 * por `;` — que consome uma fração dos tokens de um JSON equivalente.
 *
 * O CSV é montado uma única vez por instância da função.
 */

import brutoJson from '../../../dados_rapi_completo.json';

/** Colunas exportadas, na ordem do `colunas_ia` original. */
const COLUNAS = ['tema', 'indicador', '2023', '2024'] as const;

/** Lê uma propriedade de um objeto desconhecido de forma segura. */
function prop(objeto: unknown, chave: string): unknown {
  if (typeof objeto !== 'object' || objeto === null) return undefined;
  return (objeto as Record<string, unknown>)[chave];
}

/** Converte um valor em texto de célula, escapando o separador. */
function celula(valor: unknown): string {
  if (valor === null || valor === undefined) return '';

  const texto = String(valor).replace(/\s+/g, ' ').trim();
  if (texto.includes(';') || texto.includes('"') || texto.includes('\n')) {
    return `"${texto.replaceAll('"', '""')}"`;
  }
  return texto;
}

let csvCache: string | null = null;

/**
 * Monta o CSV de contexto dos indicadores.
 *
 * @returns Uma linha de cabeçalho seguida de uma linha por indicador.
 */
export function montarCsvIndicadores(): string {
  if (csvCache !== null) return csvCache;

  const registros = Array.isArray(brutoJson) ? brutoJson : [];

  const linhas = registros.map((registro) => {
    const dadosAnuais = prop(registro, 'dados_anuais');

    return [
      celula(prop(registro, 'tema')),
      celula(prop(registro, 'indicador')),
      celula(prop(dadosAnuais, '2023')),
      celula(prop(dadosAnuais, '2024')),
    ].join(';');
  });

  csvCache = [COLUNAS.join(';'), ...linhas].join('\n');
  return csvCache;
}
