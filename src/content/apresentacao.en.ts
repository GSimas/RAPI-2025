/**
 * ==========================================================
 * Conteúdo da página inicial — versão em inglês
 * ==========================================================
 *
 * Tradução livre das Seções 1 a 5 do RAPI 2024-2025. Mesma forma de
 * `apresentacao.ts`; os dados numéricos (Tabela 5.1) são compartilhados.
 */

import type {
  CardDimensao,
  LinhaLegendaSemaforo,
  SecaoApresentacao,
  SerieSemaforo,
} from './apresentacao';

export { EVOLUCAO_SEMAFORIZACAO } from './apresentacao';

export const SECOES_INTRODUTORIAS: readonly SecaoApresentacao[] = [
  {
    id: 'apresentacao',
    numero: '1',
    titulo: 'Introduction',
    paragrafos: [
      'The 9th Annual Indicator Progress Report of Florianópolis (RAPI) is the result of collecting and analysing environmental, urban and fiscal sustainability indicators, together with a set of recommendations to public bodies. The document sheds light on **205 indicators** and is based on the methodology of the Emerging and Sustainable Cities Program (ESC) of the Inter-American Development Bank (IDB).',
      'This collective effort has involved different organisations since 2017 and aims to follow, in a technical and impartial way, the development of the city on issues that affect its sustainability and the quality of life of its citizens. The Working Group is made up of **Associação FloripAmanhã, the Federal University of Santa Catarina (UFSC) and Observatório Social do Brasil – Florianópolis.**',
    ],
  },
  {
    id: 'contexto',
    numero: '2',
    titulo: 'Context',
    paragrafos: [
      'RAPI is an important tool for government, civil society organisations and citizens in general to assess urban issues based on real knowledge of reliable and up-to-date data. Moreover, as citizens take ownership of reliable information about their territory, political debate becomes richer, more participatory and yields better results for the whole population.',
    ],
  },
  {
    id: 'objetivo',
    numero: '3',
    titulo: 'Objective',
    paragrafos: [
      'To help government and society set and follow priorities with clear, measurable targets for the sustainable development of the city, and to contribute to the evaluation of urban public policies from a technical, objective and methodologically grounded perspective. In our 9th monitoring exercise, we publish an “X-ray” of topics such as mobility, basic sanitation, health, education, public safety and proper land use.',
    ],
  },
];

export const LEGENDA_SEMAFORO: readonly LinhaLegendaSemaforo[] = [
  { cor: '#2ca02c', rotulo: 'Green', quantidade: 40, descricao: 'The city has reached satisfactory results.' },
  { cor: '#ff7f0e', rotulo: 'Yellow', quantidade: 34, descricao: 'The city shows levels that still require attention.' },
  { cor: '#d62728', rotulo: 'Red', quantidade: 26, descricao: 'The city is below the satisfactory level (special attention).' },
  { cor: '#7f7f7f', rotulo: 'Grey', quantidade: 36, descricao: 'No data reported or outside the parameters.' },
  { cor: '#1f77b4', rotulo: 'Blue', quantidade: 69, descricao: 'New indicators, not yet rated.' },
];

export const SERIES_SEMAFORO: readonly SerieSemaforo[] = [
  { chave: 'azul', rotulo: 'Blue (New)', cor: '#1f77b4' },
  { chave: 'cinza', rotulo: 'Grey (No data)', cor: '#7f7f7f' },
  { chave: 'vermelho', rotulo: 'Red (Critical)', cor: '#d62728' },
  { chave: 'amarelo', rotulo: 'Yellow (Attention)', cor: '#ff7f0e' },
  { chave: 'verde', rotulo: 'Green (Satisfactory)', cor: '#2ca02c' },
];

export const CARDS_DIMENSOES: readonly CardDimensao[] = [
  {
    id: 'ambiental',
    icone: '🌱',
    titulo: 'Environmental Dimension',
    totalIndicadores: 32,
    corAcento: '#2ca02c',
    grupos: [
      {
        titulo: 'Environmental Management and Consumption (23)',
        detalhe: 'Water (6), Sanitation/Drainage (3), Solid Waste (8), Energy (6).',
      },
      {
        titulo: 'Mitigation of Greenhouse Gases and Pollution (4)',
        detalhe: 'Air Quality (2), Climate Change (1), Noise (1).',
      },
      { titulo: 'Vulnerability to Natural Disasters (5)', detalhe: '' },
    ],
  },
  {
    id: 'urbana',
    icone: '🏙️',
    titulo: 'Urban Dimension',
    totalIndicadores: 142,
    corAcento: '#1f77b4',
    grupos: [
      { titulo: 'Growth Control (18)', detalhe: 'Land Use (11), Inequality (7).' },
      { titulo: 'Sustainable Mobility and Transport (23)', detalhe: '' },
      {
        titulo: 'Economic Development (12)',
        detalhe: 'Business Environment (1), Productive Fabric (8), Labour Market (3).',
      },
      { titulo: 'Social Services (72)', detalhe: 'Education (19), Public Safety (10), Health (43).' },
      { titulo: 'Competitiveness (17)', detalhe: 'Human Capital (2), Business Fabric (15).' },
    ],
  },
  {
    id: 'fiscal',
    icone: '⚖️',
    titulo: 'Fiscal Dimension',
    totalIndicadores: 31,
    corAcento: '#ff7f0e',
    grupos: [
      {
        titulo: 'Government Mechanisms (11)',
        detalhe: 'Participatory Management (1), Modern Management (9), Transparency (1).',
      },
      { titulo: 'Sound Revenue Management (11)', detalhe: 'Taxes and Financial Autonomy (11).' },
      { titulo: 'Sound Expenditure Management (5)', detalhe: '' },
      { titulo: 'Sound Debt Management (4)', detalhe: '' },
    ],
  },
];
