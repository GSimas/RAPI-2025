/**
 * ==========================================================
 * Conteudo editorial da aba "Apresentacao"
 * ==========================================================
 *
 * Texto transposto das Secoes 1 a 5 do RAPI 2024-2025, exatamente como
 * exibido no dashboard Streamlit original. Mantido como dado (e nao como
 * JSX) para que a camada de apresentacao permaneca puramente declarativa.
 *
 * Trechos entre `**asteriscos**` sao renderizados em negrito por
 * `<TextoRico />` — evitando `dangerouslySetInnerHTML`.
 */

/** Uma secao narrativa da pagina inicial. */
export interface SecaoApresentacao {
  readonly id: string;
  readonly numero: string;
  readonly titulo: string;
  readonly paragrafos: readonly string[];
}

/** Secoes 1 a 3, exibidas na coluna de texto. */
export const SECOES_INTRODUTORIAS: readonly SecaoApresentacao[] = [
  {
    id: 'apresentacao',
    numero: '1',
    titulo: 'Apresentação',
    paragrafos: [
      'O 9º Relatório Anual de Progresso dos Indicadores de Florianópolis (RAPI) é o resultado da coleta e análise de indicadores de sustentabilidade ambiental, urbana e fiscal, bem como um conjunto de recomendações aos entes públicos. O documento dá visibilidade a um conjunto de **205 indicadores**, e se baseia na metodologia do Programa Cidades Emergentes e Sustentáveis (CES), do Banco Interamericano de Desenvolvimento (BID).',
      'Esse trabalho coletivo envolve, desde 2017, diferentes organizações e tem como objetivo acompanhar, de forma técnica e imparcial, o desenvolvimento da cidade em questões que impactam a sua sustentabilidade e a qualidade de vida de seus cidadãos. O Grupo de Trabalho é composto pela **Associação FloripAmanhã, a Universidade Federal de Santa Catarina (UFSC) e o Observatório Social do Brasil – Florianópolis.**',
    ],
  },
  {
    id: 'contexto',
    numero: '2',
    titulo: 'Contexto',
    paragrafos: [
      'O RAPI apresenta-se como importante ferramenta para que o poder público, as entidades da sociedade civil e os cidadãos em geral avaliem as questões urbanas a partir do real conhecimento de dados confiáveis e atualizados. Além disso, à medida em que o cidadão se apropria de informações confiáveis sobre seu território, o debate político se torna mais rico, mais participativo e com melhores resultados para toda a população.',
    ],
  },
  {
    id: 'objetivo',
    numero: '3',
    titulo: 'Objetivo',
    paragrafos: [
      'Auxiliar o governo e a sociedade a estabelecerem e seguirem prioridades com metas claras e mensuráveis, para o desenvolvimento sustentável da cidade, e contribuir para a avaliação das políticas públicas urbanas, a partir de uma visão técnica, objetiva e metodologicamente embasada. Em nosso 9º exercício de monitoramento, trazemos a público um “raio-x” de temas como mobilidade, saneamento básico, saúde, educação, segurança e uso adequado do solo.',
    ],
  },
];

/** Uma linha da legenda de semaforizacao da Secao 5. */
export interface LinhaLegendaSemaforo {
  readonly cor: string;
  readonly rotulo: string;
  readonly quantidade: number;
  readonly descricao: string;
}

/** Distribuicao dos 205 indicadores no ciclo 2024-2025 (Secao 5). */
export const LEGENDA_SEMAFORO: readonly LinhaLegendaSemaforo[] = [
  {
    cor: '#2ca02c',
    rotulo: 'Verde',
    quantidade: 40,
    descricao: 'A cidade atingiu resultados satisfatórios.',
  },
  {
    cor: '#ff7f0e',
    rotulo: 'Amarelo',
    quantidade: 34,
    descricao: 'A cidade revela níveis que ainda requerem atenção.',
  },
  {
    cor: '#d62728',
    rotulo: 'Vermelho',
    quantidade: 26,
    descricao: 'A cidade está abaixo do nível satisfatório (atenção especial).',
  },
  {
    cor: '#7f7f7f',
    rotulo: 'Cinza',
    quantidade: 36,
    descricao: 'Sem dados informados ou fora dos parâmetros.',
  },
  {
    cor: '#1f77b4',
    rotulo: 'Azul',
    quantidade: 69,
    descricao: 'Indicadores novos não semaforizados.',
  },
];

/** Descricao de uma serie do grafico de barras empilhadas. */
export interface SerieSemaforo {
  readonly chave: 'azul' | 'cinza' | 'vermelho' | 'amarelo' | 'verde';
  readonly rotulo: string;
  readonly cor: string;
}

/**
 * Ordem de empilhamento das series, de baixo para cima, identica a ordem
 * de `add_trace` do `go.Figure` original.
 */
export const SERIES_SEMAFORO: readonly SerieSemaforo[] = [
  { chave: 'azul', rotulo: 'Azul (Novos)', cor: '#1f77b4' },
  { chave: 'cinza', rotulo: 'Cinza (Sem Dados)', cor: '#7f7f7f' },
  { chave: 'vermelho', rotulo: 'Vermelho (Crítico)', cor: '#d62728' },
  { chave: 'amarelo', rotulo: 'Amarelo (Atenção)', cor: '#ff7f0e' },
  { chave: 'verde', rotulo: 'Verde (Satisfatório)', cor: '#2ca02c' },
];

/** Um ponto anual do grafico de evolucao da semaforizacao. */
export interface EvolucaoSemaforoAno {
  readonly ano: string;
  readonly azul: number;
  readonly cinza: number;
  readonly vermelho: number;
  readonly amarelo: number;
  readonly verde: number;
}

/** Dados da Tabela 5.1: evolucao historica da semaforizacao (2020-2024). */
export const EVOLUCAO_SEMAFORIZACAO: readonly EvolucaoSemaforoAno[] = [
  { ano: '2020', azul: 62, cinza: 39, vermelho: 29, amarelo: 17, verde: 36 },
  { ano: '2021', azul: 56, cinza: 42, vermelho: 28, amarelo: 19, verde: 38 },
  { ano: '2022', azul: 72, cinza: 17, vermelho: 31, amarelo: 23, verde: 40 },
  { ano: '2023', azul: 75, cinza: 21, vermelho: 29, amarelo: 37, verde: 40 },
  { ano: '2024', azul: 69, cinza: 36, vermelho: 26, amarelo: 34, verde: 40 },
];

/** Card expansivel de uma das tres dimensoes (Secao 4). */
export interface CardDimensao {
  readonly id: string;
  readonly icone: string;
  readonly titulo: string;
  readonly totalIndicadores: number;
  readonly corAcento: string;
  /** Grupos internos: um pilar e a composicao dos seus temas. */
  readonly grupos: readonly { readonly titulo: string; readonly detalhe: string }[];
}

/** Estrutura analitica do RAPI: 3 dimensoes, 12 pilares e 25 temas. */
export const CARDS_DIMENSOES: readonly CardDimensao[] = [
  {
    id: 'ambiental',
    icone: '🌱',
    titulo: 'Dimensão Ambiental',
    totalIndicadores: 32,
    corAcento: '#2ca02c',
    grupos: [
      {
        titulo: 'Manejo Ambiental e Consumo (23)',
        detalhe: 'Água (6), Saneamento/Drenagem (3), Resíduos Sólidos (8), Energia (6).',
      },
      {
        titulo: 'Mitigação de Gases e Contaminação (4)',
        detalhe: 'Qualidade do Ar (2), Mudanças Climáticas (1), Ruído (1).',
      },
      { titulo: 'Vulnerabilidade e Desastres Naturais (5)', detalhe: '' },
    ],
  },
  {
    id: 'urbana',
    icone: '🏙️',
    titulo: 'Dimensão Urbana',
    totalIndicadores: 142,
    corAcento: '#1f77b4',
    grupos: [
      { titulo: 'Controle do Crescimento (18)', detalhe: 'Uso do Solo (11), Desigualdade (7).' },
      { titulo: 'Mobilidade e Transporte Sustentável (23)', detalhe: '' },
      {
        titulo: 'Desenvolvimento Econômico (12)',
        detalhe: 'Ambiente de Negócios (1), Tecido Produtivo (8), Mercado Laboral (3).',
      },
      {
        titulo: 'Serviços Sociais (72)',
        detalhe: 'Educação (19), Segurança (10), Saúde (43).',
      },
      {
        titulo: 'Competitividade (17)',
        detalhe: 'Capital Humano (2), Tecido Empresarial (15).',
      },
    ],
  },
  {
    id: 'fiscal',
    icone: '⚖️',
    titulo: 'Dimensão Fiscal',
    totalIndicadores: 31,
    corAcento: '#ff7f0e',
    grupos: [
      {
        titulo: 'Mecanismos de Governo (11)',
        detalhe: 'Gestão Participativa (1), Gestão Moderna (9), Transparência (1).',
      },
      { titulo: 'Gestão Adequada da Receita (11)', detalhe: 'Impostos e Autonomia (11).' },
      { titulo: 'Gestão Adequada da Despesa (5)', detalhe: '' },
      { titulo: 'Gestão Adequada da Dívida (4)', detalhe: '' },
    ],
  },
];
