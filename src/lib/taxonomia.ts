/**
 * ==========================================================
 * Taxonomia oficial do RAPI: 3 dimensoes, 12 pilares, 25 temas
 * ==========================================================
 *
 * O `dados_rapi_completo.json` traz apenas `tema` e `subtema`. A Secao 4 do
 * relatorio ("Estrutura Analitica") organiza esses 25 temas em 12 pilares,
 * agrupados em 3 dimensoes. Este modulo reconstroi essa hierarquia para
 * alimentar os filtros encadeados do dashboard.
 */

import type { Dimensao } from '@/types/rapi';

/** Ordem canonica das dimensoes, como aparecem no relatorio. */
export const DIMENSOES: readonly Dimensao[] = ['Ambiental', 'Urbana', 'Fiscal'] as const;

/** Emoji associado a cada dimensao, reaproveitado dos cards da Apresentacao. */
export const ICONE_DIMENSAO: Record<Dimensao, string> = {
  Ambiental: '🌱',
  Urbana: '🏙️',
  Fiscal: '⚖️',
};

interface EntradaTaxonomia {
  readonly dimensao: Dimensao;
  readonly pilar: string;
}

/**
 * Normaliza um nome de tema para uso como chave de busca:
 * maiusculas, sem acentos e com espacos colapsados.
 *
 * Torna o mapeamento resiliente a variacoes de digitacao do dataset
 * (ex.: `"RUIDO"` vs `"RUÍDO"`).
 */
export function normalizarChave(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mapa `tema normalizado -> { dimensao, pilar }`.
 * Cobre os 25 temas presentes no dataset.
 */
const MAPA_TEMAS: ReadonlyMap<string, EntradaTaxonomia> = new Map(
  (
    [
      // ---------------- Dimensao Ambiental ----------------
      ['AGUA', 'Ambiental', 'Manejo Ambiental e Consumo de Recursos Naturais'],
      ['SANEAMENTO E DRENAGEM', 'Ambiental', 'Manejo Ambiental e Consumo de Recursos Naturais'],
      ['GESTAO DE RESIDUOS SOLIDOS', 'Ambiental', 'Manejo Ambiental e Consumo de Recursos Naturais'],
      ['ENERGIA', 'Ambiental', 'Manejo Ambiental e Consumo de Recursos Naturais'],
      ['QUALIDADE DO AR', 'Ambiental', 'Mitigação de Gases e Contaminação Local'],
      ['MITIGACAO DA MUDANCA CLIMATICA', 'Ambiental', 'Mitigação de Gases e Contaminação Local'],
      ['RUIDO', 'Ambiental', 'Mitigação de Gases e Contaminação Local'],
      [
        'VULNERABILIDADE FRENTE A DESASTRES NATURAIS',
        'Ambiental',
        'Vulnerabilidade Frente a Desastres Naturais',
      ],

      // ------------------ Dimensao Urbana ------------------
      [
        'USO DO SOLO / ORDENAMENTO TERRITORIAL',
        'Urbana',
        'Controle do Crescimento e Melhoria do Habitat',
      ],
      ['DESIGUALDADE URBANA', 'Urbana', 'Controle do Crescimento e Melhoria do Habitat'],
      ['MOBILIDADE / TRANSPORTE', 'Urbana', 'Mobilidade e Transporte Sustentável'],
      ['AMBIENTE DE NEGOCIOS', 'Urbana', 'Promoção do Desenvolvimento Econômico Local'],
      ['TECIDO PRODUTIVO', 'Urbana', 'Promoção do Desenvolvimento Econômico Local'],
      ['MERCADO LABORAL', 'Urbana', 'Promoção do Desenvolvimento Econômico Local'],
      ['EDUCACAO', 'Urbana', 'Provisão de Serviços Sociais'],
      ['SEGURANCA', 'Urbana', 'Provisão de Serviços Sociais'],
      ['SAUDE', 'Urbana', 'Provisão de Serviços Sociais'],
      ['CAPITAL HUMANO', 'Urbana', 'Competitividade da Economia'],
      ['TECIDO EMPRESARIAL', 'Urbana', 'Competitividade da Economia'],

      // ------------------ Dimensao Fiscal ------------------
      ['GESTAO PUBLICA PARTICIPATIVA', 'Fiscal', 'Mecanismos Adequados de Governo'],
      ['GESTAO PUBLICA MODERNA', 'Fiscal', 'Mecanismos Adequados de Governo'],
      ['TRANSPARENCIA', 'Fiscal', 'Mecanismos Adequados de Governo'],
      ['IMPOSTOS E AUTONOMIA FINANCEIRA', 'Fiscal', 'Gestão Adequada da Receita'],
      ['GESTAO DO GASTO PUBLICO', 'Fiscal', 'Gestão Adequada da Despesa'],
      ['GESTAO ADEQUADA DA DIVIDA', 'Fiscal', 'Gestão Adequada da Dívida'],
    ] as const satisfies readonly (readonly [string, Dimensao, string])[]
  ).map(([tema, dimensao, pilar]) => [tema, { dimensao, pilar }] as const),
);

/**
 * Resolve dimensao e pilar a partir do nome do tema.
 *
 * Temas nao mapeados caem em `Urbana / "Outros"`, garantindo que nenhum
 * indicador desapareca dos filtros caso o dataset ganhe novas linhas.
 */
export function resolverTaxonomia(tema: string): EntradaTaxonomia {
  return MAPA_TEMAS.get(normalizarChave(tema)) ?? { dimensao: 'Urbana', pilar: 'Outros' };
}
