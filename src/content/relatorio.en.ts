/**
 * ==========================================================
 * Conteúdo da página "Relatório" — versão em inglês
 * ==========================================================
 *
 * Tradução livre das Seções 7, 8 e 9 do RAPI 2024-2025. Mesma forma de
 * `relatorio.ts`. Nomes de pessoas e instituições não são traduzidos.
 */

import type { BlocoDimensaoRelatorio, InstituicaoGT } from './relatorio';

export { GRUPO_TRABALHO } from './relatorio';
export type { InstituicaoGT };

export const INTRODUCAO_CONSIDERACOES =
  'Based on the values collected in 2025 and the historical series of each indicator, below are the considerations and recommendations on the items that most require attention and action. We have not commented on most “green” aspects, as they have already reached satisfactory levels.';

export const BLOCOS_CONSIDERACOES: readonly BlocoDimensaoRelatorio[] = [
  {
    id: 'ambiental',
    icone: '🌍',
    numero: '7.1',
    titulo: 'Environmental Dimension',
    corAcento: '#2ca02c',
    temas: [
      {
        id: 'agua',
        numero: '7.1.1',
        titulo: 'Theme: Water — 06 indicators',
        paragrafos: [
          'a) The Daily Per Capita Water Consumption indicator is essential to assess the sustainable use of water resources. Over the last five years, Florianópolis averaged 173.1 litres/person/day. Under the rating currently applied, the municipality is green. However, compared with the international benchmark set by the UN of 110 litres/day/person, consumption in Florianópolis remains consistently above the recommended level.',
          'b) The Water Quality indicator reached 96.8% in 2024, a slight decrease from 2023. This result falls in the yellow range. In addition, a significant gap persists: there is no regulation for heavy-metal and pesticide contaminants.',
          'c) The percentage of non-revenue water remains a major structural challenge. In 2024 it rose again to 38.09%, reinforcing the fluctuation and the difficulty of sustaining consistent progress. This reflects significant losses from leaks and irregular connections.',
          'd) It is extremely worrying that, since 2019, no information has been received on the indicator “Remaining number of years with a positive water balance”. The systematic absence of these data for five years undermines the ability to assess future risks and adopt effective preventive measures.',
        ],
      },
      {
        id: 'saneamento',
        numero: '7.1.2',
        titulo: 'Theme: Sanitation and Drainage — 03 indicators',
        paragrafos: [
          'a) The coverage rate of household connections to the sewage system remains at a critical level. In 2024 the percentage fell to 64.81%, another setback.',
          'b) The wastewater treatment indicator recorded 63.15% in 2024, an improvement over 2023 and enough to keep it in the green range.',
          'c) The indicator of households affected by intense flooding has shown an extremely worrying upward trend. Since 2018, results have risen from 0.5% to 15% in 2024, far exceeding the red threshold.',
        ],
      },
      {
        id: 'residuos',
        numero: '7.1.3',
        titulo: 'Theme: Solid Waste Management — 08 indicators',
        paragrafos: [
          'a) In Florianópolis, generation was 1.14 kg/inhabitant/day in 2024, roughly 416 kg of waste per person per year — more than 50% above the global reference average (0.74 kg).',
          'b) The percentage of waste composted by the City of Florianópolis made a remarkable leap, reaching 12.93% in 2024.',
          'c) In 2024 the city reached a new level, with 10.73% of solid waste separated and sorted for recycling, although it remains in the red range.',
        ],
      },
      {
        id: 'energia',
        numero: '7.1.4',
        titulo: 'Theme: Energy — 06 indicators',
        paragrafos: [
          'a) The annual number of hours of power outages remained at a satisfactory level (5.61 h/household/year).',
          'b) Florianópolis made an impressive leap in modernising its street lighting. The share of LED fixtures installed rose to a significant 77% in 2024.',
          'c) The share of energy from renewable sources was 3.88% in 2024, keeping the city in the red range and reinforcing the urgent need for more consistent policies.',
        ],
      },
      {
        id: 'qualidade-ar',
        numero: '7.1.5',
        titulo: 'Theme: Air Quality — 02 indicators',
        paragrafos: [
          'Air quality monitoring remained unchanged in 2024, representing a critical gap. The only available data reference is the 2014 record.',
        ],
      },
      {
        id: 'vulnerabilidade',
        numero: '7.1.8',
        titulo: 'Theme: Vulnerability to Natural Disasters — 05 indicators',
        paragrafos: [
          'The budget allocated to natural disaster risk mitigation showed a worrying drop (only 0.07%). In addition, the number of housing units in risk areas rose to 2,100, an uncontrolled expansion that calls for urgent oversight.',
        ],
      },
    ],
  },
  {
    id: 'urbana',
    icone: '🏙️',
    numero: '7.2',
    titulo: 'Urban Dimension',
    corAcento: '#1f77b4',
    temas: [
      {
        id: 'uso-solo',
        numero: '7.2.1',
        titulo: 'Theme: Land Use and Territorial Planning',
        paragrafos: [
          'Road network growth was 1.41% in 2024, keeping it in the green range. However, the population reached approximately 576 thousand inhabitants (annual growth of 1.9%), placing demographic growth in the red range. Population density also keeps increasing, requiring orderly planning.',
          'The quantitative housing deficit paints an alarming picture (21,705 families, or 52% of the CadÚnico registry, according to the latest 2022/2023 data). Another critical figure is the protection of Conservation Units: only 20% of municipal units had a management plan in 2024, a drastic setback from 41.6% in 2022.',
        ],
      },
      {
        id: 'desigualdade',
        numero: '7.2.2',
        titulo: 'Theme: Urban Inequality',
        paragrafos: [
          'The city reached 0.4 on the Gini coefficient, a satisfactory condition that reduces income inequality. Still, the challenge of reducing the population below the poverty line (4.8%) must remain on the agenda.',
        ],
      },
      {
        id: 'mobilidade',
        numero: '7.2.3',
        titulo: 'Theme: Mobility and Transport',
        paragrafos: [
          'Public transport capacity rose markedly, exceeding its historical peak (average of 16 million/month). However, the fleet’s average speed fell to 22.91 km/h and the cost per passenger rose to R$ 5.84. Private vehicles per capita reached 0.723, worsening congestion.',
        ],
      },
      {
        id: 'negocios',
        numero: '7.2.4',
        titulo: 'Theme: Business Environment',
        paragrafos: [
          'The average time to open a business fell from 15 days (2019) to an impressive 5 hours in 2024. The city consolidates its place in the green range, strengthening the innovation ecosystem.',
        ],
      },
      {
        id: 'educacao',
        numero: '7.2.7',
        titulo: 'Theme: Education',
        paragrafos: [
          'There are warning signs in performance (IDEB): the score for the early years fell to 5.8 and for the final years to 4.6 (red range). At the same time, temporary teacher hiring (ACTs) rose to 60.7%, pointing to more precarious working conditions. On the other hand, the city is making progress on school inclusion and accessibility (96.21%).',
        ],
      },
      {
        id: 'seguranca',
        numero: '7.2.8',
        titulo: 'Theme: Public Safety',
        paragrafos: [
          'The city remained green on public safety. The homicide rate was 5.40 and robbery-homicides dropped to zero. Robberies and vehicle robberies remain low, establishing Florianópolis as a safe state capital with regard to violent crime.',
        ],
      },
      {
        id: 'saude',
        numero: '7.2.9',
        titulo: 'Theme: Health',
        paragrafos: [
          'The General Mortality Rate fell to 518.60 and infant mortality remained green (6.90). However, vaccination coverage such as BCG (39.17%) and Hepatitis B at birth (34.94%) remain in the red range, calling for attention.',
        ],
      },
      {
        id: 'tecido-empresarial',
        numero: '7.2.11',
        titulo: 'Theme: Business Fabric',
        paragrafos: [
          'The number of active companies jumped to 24,779 in 2024. Exports grew to US$ 65.23 million, and revenue in the technology sector increased by 28.39%.',
        ],
      },
    ],
  },
  {
    id: 'fiscal',
    icone: '⚖️',
    numero: '7.3',
    titulo: 'Fiscal and Governance Dimension',
    corAcento: '#ff7f0e',
    temas: [
      {
        id: 'gestao-moderna',
        numero: '7.3.2',
        titulo: 'Theme: Modern Public Management',
        paragrafos: [
          'Florianópolis reached 88% of administrative processes completed digitally. The Transparency Index remained at 98% (green range). In public procurement, electronic auctions dominated (53.62%), but the warning goes to the sharp growth of direct contracting, which rose from 2.27% in 2020 to 20.55% in 2024.',
        ],
      },
      {
        id: 'impostos',
        numero: '7.3.4',
        titulo: 'Theme: Taxes and Financial Autonomy',
        paragrafos: [
          'ICMS and ISS revenues grew above inflation. However, IPTU (property tax) collection grew only 2.09% (below inflation), indicating weaknesses in the collection process. IPTU delinquency, although lower, remains high at 16.7%.',
        ],
      },
      {
        id: 'gasto-divida',
        numero: '7.3.5',
        titulo: 'Theme: Public Spending and Debt Management',
        paragrafos: [
          'Current expenditure accounted for 86.21% of total spending. There is almost nothing left for capital investment, which drives indebtedness. Personnel spending reached 48.46% of net current revenue, a high figure that limits the city’s capacity to invest.',
        ],
      },
    ],
  },
];

export const CONSIDERACOES_FINAIS: readonly string[] = [
  'In this 9th edition of the Florianópolis Sustainability Indicators Report (RAPI), the overall picture reflects a city of contrasts, with remarkable progress in some sectors but persistent challenges in areas that are key to its sustainability.',
  'The city consolidates its position as a leader in digital government and excellence in transparency. On the environment, the picture is mixed: planned growth of the urban fabric contrasts with water consumption above recommendations, critical losses from leaks, and the lack of comprehensive basic sanitation (still far below what is needed).',
  'Economically, the city shows resilience, leadership in GDP per capita and a vibrant business fabric. On the fiscal side, the report raises major concerns. There is almost nothing left for investment in structural works, resulting in growing debt.',
  'The challenge ahead is great, but the information in this report charts the path for Florianópolis to become a truly inclusive, sustainable and equitable society.',
];

export const AGRADECIMENTOS_INTRO =
  'We thank the Mayor of Florianópolis, Topázio Neto, his municipal secretaries, managers and public servants, as well as state departments, public companies and agencies for their efforts and contributions in providing the requested data.';

export const NOTA_LICENCA =
  'Partial or full reproduction of this material is permitted provided the source is cited: Rede Ver a Cidade Floripa, 2024-2025. October 2025.';
