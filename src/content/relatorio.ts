/**
 * ==========================================================
 * Conteudo editorial da aba "Relatorio e Analises"
 * ==========================================================
 *
 * Transposicao das Secoes 7 (Consideracoes e Recomendacoes), 8
 * (Consideracoes Finais) e 9 (Agradecimentos e Creditos) do RAPI 2024-2025.
 *
 * O conteudo e modelado como dado estruturado — e nao como blocos de HTML,
 * como no `st.markdown(..., unsafe_allow_html=True)` original — para que a
 * renderizacao seja modular, acessivel e livre de injecao de HTML.
 *
 * Trechos entre `**asteriscos**` viram negrito via `<TextoRico />`.
 */

/** Um tema analisado dentro de uma dimensao (ex.: "7.1.1 Tema: Água"). */
export interface TemaAnalise {
  readonly id: string;
  /** Numeracao hierarquica do relatorio (ex.: `7.1.1`). */
  readonly numero: string;
  readonly titulo: string;
  /** Alineas da analise: `a)`, `b)`, `c)`... ou paragrafos corridos. */
  readonly paragrafos: readonly string[];
}

/** Um bloco expansivel correspondente a uma dimensao (7.1, 7.2, 7.3). */
export interface BlocoDimensaoRelatorio {
  readonly id: string;
  readonly icone: string;
  readonly numero: string;
  readonly titulo: string;
  readonly corAcento: string;
  readonly temas: readonly TemaAnalise[];
}

/** Texto de abertura da Secao 7. */
export const INTRODUCAO_CONSIDERACOES =
  'Tomando por base os valores levantados em 2025 e sua série histórica para cada indicador, seguem abaixo as considerações e recomendações referentes aos itens que mais necessitam de atenção e providências. Deixamos de registrar comentários sobre a maioria dos aspectos em “verde” por já terem alcançado níveis satisfatórios.';

/** Secao 7: consideracoes e recomendacoes por dimensao. */
export const BLOCOS_CONSIDERACOES: readonly BlocoDimensaoRelatorio[] = [
  {
    id: 'ambiental',
    icone: '🌍',
    numero: '7.1',
    titulo: 'Dimensão Ambiental',
    corAcento: '#2ca02c',
    temas: [
      {
        id: 'agua',
        numero: '7.1.1',
        titulo: 'Tema: Água — 06 indicadores',
        paragrafos: [
          'a) O indicador Consumo de Água Per Capita por Dia é essencial para avaliar o uso sustentável dos recursos hídricos. Nos últimos cinco anos, Florianópolis apresentou uma média de 173,1 litros/pessoa/dia. Pela semaforização atualmente aplicada, o município se encontra em condição verde. No entanto, quando comparado ao referencial internacional estabelecido pela ONU, de 110 litros/dia/pessoa, observa-se que o consumo em Florianópolis permanece consistentemente acima do recomendado.',
          'b) O indicador de Qualidade da Água apresentou em 2024 o valor de 96,8%, uma ligeira redução em relação a 2023. Esse resultado enquadra-se na faixa amarela. Além disso, persiste uma lacuna significativa: a ausência de regulamentação para contaminantes por metais pesados e agrotóxicos.',
          'c) A porcentagem de água não contabilizada continua sendo um desafio estrutural importante. Em 2024 voltou a subir para 38,09%, reforçando a oscilação e a dificuldade de manter avanços consistentes. Esse cenário reflete perdas significativas por vazamentos e ligações irregulares.',
          'd) É extremamente preocupante constatar que, desde 2019, não recebemos informações sobre o indicador “Número remanescente de anos de saldo hídrico positivo”. A ausência sistemática desses dados há cinco anos compromete a possibilidade de avaliar riscos futuros e adotar medidas preventivas eficazes.',
        ],
      },
      {
        id: 'saneamento',
        numero: '7.1.2',
        titulo: 'Tema: Saneamento e Drenagem — 03 indicadores',
        paragrafos: [
          'a) O índice de cobertura de ligações de moradias ao sistema de esgotamento sanitário permanece em um patamar crítico. Em 2024, o percentual caiu para 64,81%, representando mais um retrocesso.',
          'b) O indicador de tratamento de águas residuais registrou 63,15% em 2024, uma melhora em relação ao resultado de 2023 e suficiente para mantê-lo na faixa verde.',
          'c) O indicador de moradias afetadas por inundações intensas vem apresentando uma trajetória de crescimento extremamente preocupante. Desde 2018, os resultados evoluíram de 0,5% para 15% em 2024, ultrapassando em muito o limite vermelho.',
        ],
      },
      {
        id: 'residuos',
        numero: '7.1.3',
        titulo: 'Tema: Gestão de Resíduos Sólidos — 08 indicadores',
        paragrafos: [
          'a) Em Florianópolis, o consumo foi de 1,14 kg/hab/dia em 2024, o que corresponde a aproximadamente 416 kg de resíduos por pessoa ao ano — mais de 50% superior à média mundial de referência (0,74 kg).',
          'b) A porcentagem de resíduos compostados pela Prefeitura de Florianópolis deu um salto notável, atingindo 12,93% em 2024.',
          'c) Em 2024, a cidade alcançou um novo patamar, com 10,73% dos resíduos sólidos separados e classificados para reciclagem, embora ainda se encontre na faixa vermelha.',
        ],
      },
      {
        id: 'energia',
        numero: '7.1.4',
        titulo: 'Tema: Energia — 06 indicadores',
        paragrafos: [
          'a) A quantidade anual de horas de interrupções elétricas manteve-se em um patamar satisfatório (5,61 h/domicílio/ano).',
          'b) Florianópolis deu um salto impressionante na modernização de sua iluminação pública. A porcentagem de luminárias LED instaladas subiu para expressivos 77% em 2024.',
          'c) A porcentagem de energia proveniente de fontes renováveis registrou 3,88% em 2024, mantendo a cidade na faixa vermelha e reforçando a necessidade urgente de políticas mais consistentes.',
        ],
      },
      {
        id: 'qualidade-ar',
        numero: '7.1.5',
        titulo: 'Tema: Qualidade do Ar — 02 indicadores',
        paragrafos: [
          'A situação do monitoramento da qualidade do ar permanece inalterada em 2024, representando uma lacuna crítica. A única referência de dados disponíveis é o registro de 2014.',
        ],
      },
      {
        id: 'vulnerabilidade',
        numero: '7.1.8',
        titulo: 'Tema: Vulnerabilidade Frente aos Desastres Naturais — 05 indicadores',
        paragrafos: [
          'O orçamento destinado à mitigação de riscos de desastres naturais apresentou uma queda preocupante (apenas 0,07%). Além disso, o número de unidades em áreas de risco subiu para 2.100, uma expansão descontrolada que exige fiscalização urgente.',
        ],
      },
    ],
  },
  {
    id: 'urbana',
    icone: '🏙️',
    numero: '7.2',
    titulo: 'Dimensão Urbana',
    corAcento: '#1f77b4',
    temas: [
      {
        id: 'uso-solo',
        numero: '7.2.1',
        titulo: 'Tema: Uso do Solo e Ordenamento Territorial',
        paragrafos: [
          'O crescimento da malha viária foi de 1,41% em 2024, mantendo o percentual na faixa verde. No entanto, a população alcançou aproximadamente 576 mil habitantes (aumento anual de 1,9%), o que coloca o crescimento demográfico na faixa vermelha. A densidade populacional também sofre aumento contínuo, demandando planejamento ordenado.',
          'O déficit habitacional quantitativo pintou um quadro alarmante (21.705 famílias, ou 52% do CadÚnico, segundo últimos dados de 2022/2023). Outro dado crítico é a proteção das Unidades de Conservação: apenas 20% das UCs municipais tinham seu plano de manejo em 2024, um retrocesso drástico em relação aos 41,6% de 2022.',
        ],
      },
      {
        id: 'desigualdade',
        numero: '7.2.2',
        titulo: 'Tema: Desigualdade Urbana',
        paragrafos: [
          'A cidade atingiu 0,4 no Coeficiente de Gini, alcançando condição satisfatória e reduzindo a desigualdade de renda. Porém, o desafio de diminuir a população abaixo da linha de pobreza (4,8%) deve permanecer na agenda.',
        ],
      },
      {
        id: 'mobilidade',
        numero: '7.2.3',
        titulo: 'Tema: Mobilidade e Transporte',
        paragrafos: [
          'A capacidade do sistema de transporte público teve um aumento notável, superando o pico histórico (média de 16 milhões/mês). Contudo, a velocidade média da frota caiu para 22,91 km/h e o custo por passageiro subiu para R$ 5,84. A quantidade de veículos particulares per capita atingiu 0,723, agravando os congestionamentos.',
        ],
      },
      {
        id: 'negocios',
        numero: '7.2.4',
        titulo: 'Tema: Ambiente de Negócios',
        paragrafos: [
          'O tempo médio para abrir uma empresa caiu de 15 dias (2019) para impressionantes 5 horas em 2024. A cidade consolida-se na faixa verde, fortalecendo o ecossistema de inovação.',
        ],
      },
      {
        id: 'educacao',
        numero: '7.2.7',
        titulo: 'Tema: Educação',
        paragrafos: [
          'Há sinais de alerta no desempenho (IDEB): a nota dos anos iniciais caiu para 5,8 e dos anos finais para 4,6 (faixa vermelha). Em paralelo, a contratação temporária de professores (ACTs) subiu para 60,7%, evidenciando precarização. Por outro lado, a cidade avança em inclusão e acessibilidade escolar (96,21%).',
        ],
      },
      {
        id: 'seguranca',
        numero: '7.2.8',
        titulo: 'Tema: Segurança',
        paragrafos: [
          'A cidade manteve-se verde em segurança. A taxa de homicídios foi de 5,40 e latrocínios zeraram. Os roubos e roubos de veículos continuam em patamares baixos, consolidando Florianópolis como uma capital segura em relação a crimes violentos.',
        ],
      },
      {
        id: 'saude',
        numero: '7.2.9',
        titulo: 'Tema: Saúde',
        paragrafos: [
          'A Taxa de Mortalidade Geral caiu para 518,60 e a mortalidade infantil permaneceu verde (6,90). Contudo, coberturas vacinais como BCG (39,17%) e Hepatite B ao nascer (34,94%) continuam na faixa vermelha, exigindo alerta.',
        ],
      },
      {
        id: 'tecido-empresarial',
        numero: '7.2.11',
        titulo: 'Tema: Tecido Empresarial',
        paragrafos: [
          'O número de empresas ativas saltou para 24.779 em 2024. As exportações cresceram para US$ 65,23 milhões, e o faturamento do setor de tecnologia aumentou 28,39%.',
        ],
      },
    ],
  },
  {
    id: 'fiscal',
    icone: '⚖️',
    numero: '7.3',
    titulo: 'Dimensão Fiscal e Governança',
    corAcento: '#ff7f0e',
    temas: [
      {
        id: 'gestao-moderna',
        numero: '7.3.2',
        titulo: 'Tema: Gestão Pública Moderna',
        paragrafos: [
          'Florianópolis alcançou 88% de processos digitais concluídos. O Índice de Transparência manteve-se em 98% (faixa verde). Nas compras públicas, o pregão eletrônico dominou (53,62%), mas o alerta vai para o crescimento expressivo das compras por contratação direta, que subiram de 2,27% em 2020 para 20,55% em 2024.',
        ],
      },
      {
        id: 'impostos',
        numero: '7.3.4',
        titulo: 'Tema: Impostos e Autonomia Financeira',
        paragrafos: [
          'A variação do ICMS e ISS foi superior à inflação. No entanto, a arrecadação do IPTU cresceu apenas 2,09% (abaixo da inflação), indicando deficiência no processo de cobrança. A inadimplência do IPTU, embora tenha reduzido, permanece elevada em 16,7%.',
        ],
      },
      {
        id: 'gasto-divida',
        numero: '7.3.5',
        titulo: 'Tema: Gestão do Gasto Público e Dívida',
        paragrafos: [
          'Os gastos correntes representaram 86,21% dos gastos totais. Quase não existe sobra de recursos para investimentos em obras, o que fomenta o endividamento. O gasto com pessoal ficou em 48,46% da receita corrente líquida, um valor elevado, limitando a capacidade de investimento da prefeitura.',
        ],
      },
    ],
  },
];

/** Secao 8: consideracoes finais. */
export const CONSIDERACOES_FINAIS: readonly string[] = [
  'Nesta 9ª edição do Relatório dos Indicadores de Sustentabilidade de Florianópolis (RAPI), o panorama geral reflete uma cidade de contrastes, com avanços notáveis em alguns setores, mas com desafios persistentes em áreas-chave para a sua sustentabilidade.',
  'A cidade consolida-se como líder em governo digital e excelência em transparência. No Meio Ambiente, o cenário é misto: crescimento planejado da malha urbana contrasta com o consumo de água acima das recomendações, perdas críticas por vazamentos, e ausência de saneamento básico abrangente (que ainda está muito abaixo do necessário).',
  'Do ponto de vista econômico, a cidade demonstra resiliência, liderança em PIB per capita e pujança no tecido empresarial. No aspecto fiscal, o relatório aponta grandes preocupações. Há quase nenhuma sobra de recursos para investimentos em obras estruturantes, resultando em crescente endividamento.',
  'O desafio para o futuro é grande, mas as informações do relatório fornecem o caminho para que Florianópolis se torne uma sociedade verdadeiramente inclusiva, sustentável e equitativa.',
];

/** Paragrafo de abertura da Secao 9. */
export const AGRADECIMENTOS_INTRO =
  'Agradecemos ao Prefeito de Florianópolis, Topázio Neto, seus secretários municipais, gestores e servidores da administração pública, bem como secretarias estaduais, empresas públicas e autarquias por seus esforços e contribuições no fornecimento dos dados solicitados.';

/** Uma instituicao do Grupo de Trabalho e seus integrantes. */
export interface InstituicaoGT {
  readonly instituicao: string;
  readonly integrantes: string;
}

/** Grupo de Trabalho de Indicadores (RAPI 2024-2025). */
export const GRUPO_TRABALHO: readonly InstituicaoGT[] = [
  {
    instituicao: 'Associação FloripAmanhã',
    integrantes:
      'Andrea Pessi M Costa, Ivo Sostizzo, Márcia Regina Teschner, Pedro Carlos Rasia, Salomão Mattos Sobrinho',
  },
  {
    instituicao: 'Observatório Social do Brasil (Florianópolis)',
    integrantes: 'João Manuel Dias da Silva, Rafael Novaes',
  },
  {
    instituicao: 'Universidade Federal de Santa Catarina (UFSC)',
    integrantes: 'Clarissa Stefani Teixeira, Hans Michael Van Bellen',
  },
];

/** Nota de licenca de uso do material. */
export const NOTA_LICENCA =
  'É permitida a reprodução parcial ou total deste material desde que citada a fonte Rede Ver a Cidade Floripa, 2024-2025. Outubro de 2025.';
