/**
 * ==========================================================
 * Textos da interface (PT / EN)
 * ==========================================================
 *
 * Dicionário tipado: a versão em inglês precisa ter exatamente a mesma
 * forma da portuguesa (`Textos`), então uma chave esquecida quebra a
 * compilação. Textos com valores variáveis são funções.
 *
 * Os textos longos do relatório ficam em `src/content/` (um arquivo por
 * idioma). Os dados dos indicadores (nomes, órgãos, faixas) permanecem
 * no idioma original do RAPI.
 */

export type Idioma = 'pt' | 'en';

const pt = {
  documento: { titulo: 'RAPI 2024-2025 · Florianópolis em indicadores' },

  cabecalho: {
    marcaRotulo: 'Florianópolis · Indicadores · IA',
    irInicio: 'RAPI 2024-2025 — ir para o início',
    paginas: 'Páginas',
    assistente: 'Assistente',
    abrirMenu: 'Abrir menu',
    fecharMenu: 'Fechar menu',
  },

  preferencias: {
    botao: 'Configurações',
    titulo: 'Configurações',
    tema: 'Tema',
    escuro: 'Escuro',
    claro: 'Claro',
    idioma: 'Idioma',
    fonte: 'Tamanho da letra',
    pequena: 'Pequena',
    media: 'Média',
    grande: 'Grande',
    movimento: 'Movimento',
    reduzir: 'Reduzir movimento',
    reduzirDescricao: 'Desliga animações, transições e o fundo animado.',
    restaurar: 'Restaurar padrões',
    fechar: 'Fechar configurações',
  },

  paginas: {
    apresentacao: {
      rotulo: 'Início',
      titulo: 'Florianópolis em',
      destaque: 'indicadores.',
      descricao: 'Apresentação do relatório e visão geral da semaforização.',
    },
    dashboard: {
      rotulo: 'Dashboard',
      titulo: 'Dashboard',
      destaque: 'interativo.',
      descricao:
        'Escolha um indicador pelos filtros encadeados e acompanhe sua série histórica, a semaforização de cada ano e os dados brutos.',
    },
    relatorio: {
      rotulo: 'Relatório',
      titulo: 'Relatório e',
      destaque: 'análises.',
      descricao:
        'Considerações e recomendações por dimensão e tema, considerações finais e créditos do Grupo de Trabalho.',
    },
    explorador: {
      rotulo: 'Explorador',
      titulo: 'Explorador',
      destaque: 'geral.',
      descricao:
        'A base completa: filtre cada coluna, ordene pelo cabeçalho e exporte o recorte em CSV ou Excel.',
    },
    assistente: {
      rotulo: 'Assistente',
      titulo: 'Pergunte ao',
      destaque: 'relatório.',
      descricao:
        'Converse com o Consultor RAPI sobre dados, cruzamentos de indicadores ou resumos do texto analítico.',
    },
  },

  trilha: { aria: 'Trilha', inicio: 'Início' },

  hero: {
    eyebrow: 'Relatório anual · Indicadores · Florianópolis',
    linha1: 'Florianópolis em',
    destaque: 'indicadores.',
    subtitulo: (n: number) =>
      `Um panorama técnico da sustentabilidade ambiental, urbana e fiscal da cidade, apoiado em ${n} indicadores monitorados desde 2017`,
    explorar: 'Explorar o dashboard',
    perguntar: 'Perguntar à IA',
    chips: ['9ª edição', 'Metodologia CES/BID', 'Monitorado desde 2017'],
  },

  numeros: {
    itens: [
      { rotulo: 'Indicadores', nota: 'monitorados no ciclo' },
      { rotulo: 'Dimensões', nota: 'ambiental, urbana, fiscal' },
      { rotulo: 'Pilares', nota: 'eixos temáticos' },
      { rotulo: 'Temas', nota: 'da metodologia CES/BID' },
      { rotulo: 'Edição', nota: 'desde 2017' },
    ],
    sufixoEdicao: 'ª',
  },

  modulos: {
    titulo: 'Quatro formas de',
    destaque: 'ler a cidade.',
    descricao:
      'Cada módulo responde a uma pergunta. Comece pelo dashboard ou vá direto ao que lhe interessa — o assistente está a um clique em qualquer página.',
    abrir: 'Abrir',
    abrirAssistente: 'Abrir assistente',
    itens: {
      dashboard: {
        titulo: 'Indicador a',
        destaque: 'indicador.',
        descricao:
          'Filtros encadeados, série histórica semaforizada ano a ano e os dados brutos de cada indicador.',
      },
      relatorio: {
        titulo: 'O que o relatório',
        destaque: 'recomenda.',
        descricao: 'Considerações e recomendações por dimensão e tema, considerações finais e créditos.',
      },
      explorador: {
        titulo: 'A base',
        destaque: 'completa.',
        descricao: 'Filtros por coluna, ordenação e exportação em CSV ou Excel.',
      },
      assistente: {
        titulo: 'Prefere',
        destaque: 'perguntar?',
        descricao:
          'Converse com o Consultor RAPI: ele conhece os indicadores e o texto analítico do relatório.',
      },
    },
  },

  apresentacao: {
    sobre: { rotulo: 'Seções 1 – 3 · Sobre o relatório', titulo: 'Um raio-x da cidade,', destaque: 'ano a ano.' },
    estrutura: {
      rotulo: 'Seção 4 · Estrutura analítica',
      titulo: '3 dimensões, 12 pilares,',
      destaque: '25 temas.',
      texto: 'Cada dimensão agrupa pilares e temas da metodologia CES/BID. Abra uma dimensão para ver sua composição.',
    },
    semaforo: {
      rotulo: 'Seção 5 · Semaforização',
      titulo: 'Como a cidade',
      destaque: 'está.',
      texto: (n: number) =>
        `Numa visão geral, os ${n} indicadores de 2024-2025 foram classificados da seguinte forma:`,
    },
    grafico: {
      titulo: 'Evolução histórica da semaforização',
      legenda: 'Quantidade de indicadores por classificação, de 2020 a 2024 (Tabela 5.1 do relatório).',
    },
    indicadores: (n: number) => `${n} indicadores`,
  },

  rodape: {
    voltarTopo: 'Voltar ao topo',
    fonte: 'Fonte de dados',
    relatorio: 'Relatório Anual de Progresso dos Indicadores 2024-2025',
    entidades: 'Associação FloripAmanhã, UFSC e Observatório Social do Brasil (Florianópolis).',
    acessar: 'Acessar o relatório',
    desenvolvido: 'Desenvolvido por',
    licenca:
      'É permitida a reprodução parcial ou total deste material desde que citada a fonte Rede Ver a Cidade Floripa, 2024-2025.',
  },

  traducao: {
    aviso: '',
  },

  semaforo: {
    rotulos: {
      verde: 'Satisfatório',
      amarelo: 'Atenção',
      vermelho: 'Crítico',
      neutro: 'Sem classificação',
    },
    cores: { verde: 'Verde', amarelo: 'Amarelo', vermelho: 'Vermelho' },
  },

  dashboard: {
    navegacao: 'Navegação',
    filtrosAria: 'Filtros do dashboard',
    indicadores: (n: number): string => (n === 1 ? 'indicador' : 'indicadores'),
    dimensao: '1 · Dimensão',
    pilar: '2 · Pilar',
    tema: '3 · Tema',
    subtema: '4 · Subtema',
    indicador: '5 · Indicador',
    ajuda: 'Os filtros são encadeados: alterar um nível reajusta automaticamente os seguintes.',
    nenhum: 'Nenhum indicador corresponde à combinação de filtros selecionada.',
    selecionado: 'Indicador selecionado',
    orgao: 'Órgão responsável',
    categorizacao: 'Categorização',
    situacao: (ano: string) => `Situação em ${ano}`,
    resultado: (ano: string) => `Resultado ${ano}`,
    referenciaIdeal: 'Referência ideal (verde)',
    referencia: 'Referência',
    semReferencia: 'Sem valor de referência ou métrica qualitativa.',
    detalhes: 'Detalhes',
    detalhesAria: 'Detalhes do indicador',
    subabas: { grafico: 'Evolução histórica', regras: 'Regras de semaforização', dados: 'Dados brutos' },
    evolucao: 'Evolução histórica',
    notaGrafico:
      'A cor de cada barra reflete a regra de semaforização aplicada ao valor daquele ano. A linha tracejada indica a tendência da série. Fonte: RAPI 2024-2025.',
    semGrafico: 'Não foi possível gerar o gráfico de tendência. Valores em formato de texto ou ND.',
    semRegras: 'Nenhuma regra de semaforização cadastrada para este indicador.',
    criterioGeral: 'Critério geral',
    original: 'Original',
    valor: 'Valor',
    tendencia: 'Tendência',
  },

  serie: {
    ano: 'Ano',
    original: 'Valor original',
    numerico: 'Valor numérico',
    semaforo: 'Semaforização',
    legenda: 'Série histórica do indicador: valores originais, numéricos e classificação semafórica.',
    planilha: 'Série histórica',
  },

  explorador: {
    legenda:
      'Base completa dos indicadores do RAPI 2024-2025, com valores originais e numéricos por ano e as faixas de semaforização.',
    planilha: 'Indicadores RAPI 2024-2025',
    nota:
      'Clique no título de uma coluna para ordenar (crescente → decrescente → original) e no funil para filtrar. A exportação em CSV ou Excel respeita a busca, os filtros e a ordenação vigentes.',
    colunas: {
      dimensao: 'Dimensão',
      pilar: 'Pilar',
      tema: 'Tema',
      subtema: 'Subtema',
      orgao: 'Órgão Responsável',
      indicador: 'Indicador',
      original: (ano: string) => `${ano} (Original)`,
      numerico: (ano: string) => `${ano} (Numérico)`,
      faixaVerde: 'Faixa Verde',
      faixaAmarela: 'Faixa Amarela',
      faixaVermelha: 'Faixa Vermelha',
    },
    dadosOriginais: '',
  },

  tabela: {
    busca: 'Busca global',
    buscaPlaceholder: 'Buscar em todas as colunas…',
    limparBusca: 'Limpar busca',
    linhas: (n: number, total: number) => `${n} de ${total} linhas`,
    filtrosAtivos: 'Filtros ativos',
    removerFiltro: (coluna: string) => `Remover filtro de ${coluna}`,
    limparTudo: 'Limpar tudo',
    ordenarPor: (coluna: string) => `Ordenar por ${coluna}`,
    filtrar: (coluna: string) => `Filtrar ${coluna}`,
    filtroAtivo: ' (filtro ativo)',
    nenhumaLinha: 'Nenhuma linha corresponde aos filtros aplicados.',
    limparFiltros: 'Limpar filtros',
    exportar: 'Exportar dados',
    csvTitulo: 'Baixar o recorte em CSV',
    excelTitulo: 'Baixar o recorte em Excel (XLSX)',
    gerando: 'Gerando…',
  },

  filtro: {
    titulo: 'Filtrar',
    limpar: 'Limpar',
    concluir: 'Concluir',
    tipos: { texto: 'texto', categoria: 'categoria', numero: 'número', data: 'data' },
    condicao: 'Condição',
    modos: { contem: 'contém', 'nao-contem': 'não contém', comeca: 'começa com', igual: 'é igual a' },
    termoAria: 'Texto do filtro',
    termoPlaceholder: 'Digite um termo…',
    ocultarVazias: 'Ocultar células vazias',
    buscarValores: 'Buscar valores…',
    marcarTodos: 'Marcar todos',
    marcarVisiveis: 'Marcar visíveis',
    desmarcar: 'Desmarcar',
    nenhumValor: 'Nenhum valor encontrado.',
    minimo: 'Mínimo',
    maximo: 'Máximo',
    faixa: (min: string, max: string) => `Faixa dos dados: ${min} a ${max}`,
    ocultarSemValor: 'Ocultar células sem valor numérico',
    de: 'De',
    ate: 'Até',
    vazio: '(vazio)',
    resumo: {
      semVazios: 'sem vazios',
      valores: (n: number) => `${n} valores`,
      aPartirDe: (d: string) => `a partir de ${d}`,
      ateData: (d: string) => `até ${d}`,
    },
  },

  png: {
    baixar: 'Baixar gráfico em PNG',
    gerando: 'Gerando imagem…',
    pronto: 'Imagem baixada',
    erro: 'Não foi possível gerar a imagem',
  },

  relatorio: {
    s7: { rotulo: 'Seção 7 · Considerações e recomendações', titulo: 'O que os dados', destaque: 'pedem.' },
    s8: { rotulo: 'Seção 8 · Considerações finais', titulo: 'Para onde a cidade', destaque: 'caminha.' },
    s9: { rotulo: 'Seção 9 · Agradecimentos e créditos', titulo: 'Quem fez o', destaque: 'relatório.' },
    temas: (n: number) => `${n} temas`,
    grupoTrabalho: 'Grupo de Trabalho de Indicadores · RAPI 2024-2025',
    prefixoTema: /^Tema:\s*/,
  },

  select: { semOpcoes: '— sem opções —' },

  chat: {
    sugestoes: [
      'Qual o valor do consumo de água em 2024 e o que o relatório recomenda?',
      'Quais indicadores de saneamento estão em situação crítica?',
      'Compare o desempenho da educação entre 2023 e 2024.',
      'O que o relatório diz sobre a gestão do gasto público?',
    ],
    comecamos: 'Por onde',
    comecamosDestaque: 'começamos?',
    conheco: (n: number) => `Conheço os ${n} indicadores e o texto analítico do relatório.`,
    login: 'login',
    nova: 'Nova',
    novaTitulo: 'Nova conversa',
    sair: 'Sair',
    sairTitulo: 'Desconectar e apagar a credencial deste navegador',
    historico: 'Histórico da conversa',
    rodape: 'Conteúdo gerado por IA pode conter imprecisões — confira sempre no relatório oficial.',
    interrompidaPorVoce: 'Resposta interrompida por você.',
    interrompida: 'Resposta interrompida.',
    inesperado: 'Ops! Tivemos um problema inesperado ao consultar o assistente.',
    falhaLogin: 'Não foi possível concluir o login.',

    bolha: {
      voce: 'Você:',
      assistente: 'Assistente: ',
      erro: 'Erro',
      bloqueio: 'Guardrail · pedido recusado',
      consultor: 'Consultor RAPI · IA',
      digitando: 'Consultando os indicadores e o texto do RAPI…',
      geradoPor: (modelo: string) => `Gerado por IA · ${modelo}`,
    },

    campo: {
      rotulo: 'Sua pergunta ao assistente',
      placeholder: 'Pergunte sobre um indicador, tema ou recomendação…',
      parar: 'Parar a resposta',
      enviar: 'Enviar pergunta',
      enviarTitulo: 'Enviar (Enter)',
    },

    seletor: {
      carregando: 'Carregando modelos…',
      gratis: 'grátis',
      buscar: 'Buscar modelo',
      buscarPlaceholder: (n: number) => `Buscar entre ${n} modelos…`,
      filtroCusto: 'Filtrar por custo',
      soGratis: 'Grátis',
      todos: 'Todos',
      modelos: 'Modelos',
      nenhum: 'Nenhum modelo encontrado.',
    },

    aviso: {
      titulo: 'Aviso de transparência · ISO/IEC 42001',
      ola: 'Olá! Você está conversando com um',
      sistemaIA: 'sistema de Inteligência Artificial',
      olaFim: ', não com uma pessoa. Eu ajudo a consultar os dados e o texto do RAPI 2024-2025 de Florianópolis.',
      modelo: 'Modelo:',
      modeloAntes: 'respostas geradas por',
      modeloDepois: (provedor: string) => `via ${provedor}, escolhido por você.`,
      modeloDesconectado: 'as respostas são geradas pelo provedor e modelo que você escolher ao se conectar.',
      limitacoes: 'Limitações:',
      limitacoesTexto1: 'posso errar, omitir ou interpretar mal. Confira sempre no',
      relatorioOficial: 'relatório oficial',
      limitacoesTexto2: 'antes de usar uma resposta em decisões — a decisão final é sempre humana.',
      escopo: 'Escopo e controles:',
      escopoTexto: 'respondo apenas sobre o relatório; há proteções contra manipulação de instruções e vigilância das respostas.',
      dados: 'Seus dados:',
      dadosTexto:
        'as perguntas são enviadas ao provedor escolhido; e-mails, CPF, telefones e chaves são mascarados antes do envio. Este site não armazena conversas, e sua credencial fica apenas no seu navegador. Não compartilhe dados pessoais.',
      contato: 'Contato:',
      contatoTexto: 'dúvidas ou contestações sobre o assistente podem ser enviadas à',
    },

    conexao: {
      lembrar: 'Lembrar neste navegador',
      lembrarNota: '(sem marcar, a credencial some ao fechar a aba)',
      recomendado: 'Recomendado',
      gratis: 'Modelos grátis',
      entrarCom: 'Entrar com',
      openrouterTexto:
        'Login seguro, sem copiar chaves. Comece de graça com o roteamento automático entre modelos gratuitos ou escolha qualquer modelo do catálogo.',
      vantagens: [
        'Roteamento automático de modelos grátis (openrouter/free)',
        'Catálogo completo de modelos para escolher na conversa',
        'Sem senha neste site: a autorização acontece na OpenRouter',
      ],
      concluindo: 'Concluindo login…',
      redirecionando: 'Redirecionando…',
      entrar: 'Entrar com OpenRouter',
      redirecionamentoNota: 'Você será levado à openrouter.ai para autorizar e voltará automaticamente.',
      falhaInicio: 'Não foi possível iniciar o login.',
      byok: 'BYOK · sua própria chave',
      traga: 'Traga sua',
      chave: 'chave.',
      byokTexto: 'Use a conta que você já tem num provedor de IA. O custo é cobrado pelo provedor, na sua conta.',
      provedor: 'Provedor',
      chaveDe: (provedor: string) => `Chave de API · ${provedor}`,
      obterChave: 'Obter chave',
      mostrar: 'Mostrar chave',
      ocultar: 'Ocultar chave',
      validando: 'Validando chave…',
      validar: 'Validar e conectar',
      incompleta: 'A chave parece incompleta. Cole a chave inteira, sem espaços.',
      semModelo: 'Nenhum modelo disponível para esta chave.',
      falhaValidar: 'Não foi possível validar a chave.',
      seguranca:
        'A chave fica só no seu navegador e é enviada, por conexão segura, apenas ao servidor deste site para repasse ao provedor — nunca é armazenada nem registrada.',
      exemploMistral: 'chave de 32 caracteres',
    },

    erros: {
      consultarModelos: 'Não foi possível consultar os modelos. Verifique sua conexão.',
      respostaModelos: 'Resposta inesperada ao listar modelos.',
      requisicao: (status: number) => `A requisição falhou (HTTP ${status}).`,
      demorou: 'A resposta demorou mais que o esperado. Tente reformular a pergunta.',
      semConexao: 'Não foi possível falar com o assistente. Verifique sua conexão.',
    },

    pkce: {
      https: 'O login seguro exige HTTPS (ou localhost).',
      cancelado: 'O login na OpenRouter foi cancelado ou negado.',
      semCodigo: 'A OpenRouter não devolveu o código de autorização.',
      semSessao: 'Sessão de login não encontrada. Inicie o login novamente nesta mesma aba.',
      expirou: 'O login expirou. Tente novamente.',
      state: 'Verificação de segurança do login falhou (state divergente). Tente novamente.',
      recusou: (status: number) => `A OpenRouter recusou a troca do código (HTTP ${status}).`,
      inesperada: 'Resposta inesperada da OpenRouter.',
    },
  },
};

export type Textos = typeof pt;

const en: Textos = {
  documento: { titulo: 'RAPI 2024-2025 · Florianópolis in indicators' },

  cabecalho: {
    marcaRotulo: 'Florianópolis · Indicators · AI',
    irInicio: 'RAPI 2024-2025 — go to home',
    paginas: 'Pages',
    assistente: 'Assistant',
    abrirMenu: 'Open menu',
    fecharMenu: 'Close menu',
  },

  preferencias: {
    botao: 'Settings',
    titulo: 'Settings',
    tema: 'Theme',
    escuro: 'Dark',
    claro: 'Light',
    idioma: 'Language',
    fonte: 'Text size',
    pequena: 'Small',
    media: 'Medium',
    grande: 'Large',
    movimento: 'Motion',
    reduzir: 'Reduce motion',
    reduzirDescricao: 'Turns off animations, transitions and the animated background.',
    restaurar: 'Reset to defaults',
    fechar: 'Close settings',
  },

  paginas: {
    apresentacao: {
      rotulo: 'Home',
      titulo: 'Florianópolis in',
      destaque: 'indicators.',
      descricao: 'Report overview and the big picture of the traffic-light ratings.',
    },
    dashboard: {
      rotulo: 'Dashboard',
      titulo: 'Interactive',
      destaque: 'dashboard.',
      descricao:
        'Pick an indicator with the chained filters and follow its time series, the rating of each year and the raw data.',
    },
    relatorio: {
      rotulo: 'Report',
      titulo: 'Report and',
      destaque: 'analysis.',
      descricao:
        'Considerations and recommendations by dimension and theme, final remarks and Working Group credits.',
    },
    explorador: {
      rotulo: 'Explorer',
      titulo: 'Data',
      destaque: 'explorer.',
      descricao:
        'The full dataset: filter every column, sort by the header and export the selection as CSV or Excel.',
    },
    assistente: {
      rotulo: 'Assistant',
      titulo: 'Ask the',
      destaque: 'report.',
      descricao:
        'Chat with the RAPI Advisor about data, indicator comparisons or summaries of the analytical text.',
    },
  },

  trilha: { aria: 'Breadcrumb', inicio: 'Home' },

  hero: {
    eyebrow: 'Annual report · Indicators · Florianópolis',
    linha1: 'Florianópolis in',
    destaque: 'indicators.',
    subtitulo: (n: number) =>
      `A technical overview of the city's environmental, urban and fiscal sustainability, based on ${n} indicators monitored since 2017`,
    explorar: 'Explore the dashboard',
    perguntar: 'Ask the AI',
    chips: ['9th edition', 'IDB ESC methodology', 'Monitored since 2017'],
  },

  numeros: {
    itens: [
      { rotulo: 'Indicators', nota: 'monitored this cycle' },
      { rotulo: 'Dimensions', nota: 'environmental, urban, fiscal' },
      { rotulo: 'Pillars', nota: 'thematic axes' },
      { rotulo: 'Themes', nota: 'from the IDB ESC methodology' },
      { rotulo: 'Edition', nota: 'since 2017' },
    ],
    sufixoEdicao: 'th',
  },

  modulos: {
    titulo: 'Four ways to',
    destaque: 'read the city.',
    descricao:
      'Each module answers a question. Start with the dashboard or go straight to what interests you — the assistant is one click away on every page.',
    abrir: 'Open',
    abrirAssistente: 'Open assistant',
    itens: {
      dashboard: {
        titulo: 'Indicator by',
        destaque: 'indicator.',
        descricao: 'Chained filters, a year-by-year rated time series and the raw data of each indicator.',
      },
      relatorio: {
        titulo: 'What the report',
        destaque: 'recommends.',
        descricao: 'Considerations and recommendations by dimension and theme, final remarks and credits.',
      },
      explorador: {
        titulo: 'The complete',
        destaque: 'dataset.',
        descricao: 'Per-column filters, sorting and export to CSV or Excel.',
      },
      assistente: {
        titulo: 'Rather',
        destaque: 'ask?',
        descricao: 'Chat with the RAPI Advisor: it knows the indicators and the analytical text of the report.',
      },
    },
  },

  apresentacao: {
    sobre: { rotulo: 'Sections 1 – 3 · About the report', titulo: 'An X-ray of the city,', destaque: 'year after year.' },
    estrutura: {
      rotulo: 'Section 4 · Analytical structure',
      titulo: '3 dimensions, 12 pillars,',
      destaque: '25 themes.',
      texto: 'Each dimension groups pillars and themes of the IDB ESC methodology. Open a dimension to see its breakdown.',
    },
    semaforo: {
      rotulo: 'Section 5 · Traffic-light ratings',
      titulo: 'How the city',
      destaque: 'is doing.',
      texto: (n: number) => `Overall, the ${n} indicators of 2024-2025 were rated as follows:`,
    },
    grafico: {
      titulo: 'Traffic-light ratings over time',
      legenda: 'Number of indicators per rating, 2020 to 2024 (Table 5.1 of the report).',
    },
    indicadores: (n: number) => `${n} indicators`,
  },

  rodape: {
    voltarTopo: 'Back to top',
    fonte: 'Data source',
    relatorio: 'Annual Indicator Progress Report (RAPI) 2024-2025',
    entidades: 'Associação FloripAmanhã, UFSC and Observatório Social do Brasil (Florianópolis).',
    acessar: 'Read the report',
    desenvolvido: 'Developed by',
    licenca:
      'Partial or full reproduction of this material is permitted provided the source is cited: Rede Ver a Cidade Floripa, 2024-2025.',
  },

  traducao: {
    aviso:
      'Free English translation of the original Portuguese report. Indicator names, agencies and rating ranges are kept in Portuguese, as published.',
  },

  semaforo: {
    rotulos: {
      verde: 'Satisfactory',
      amarelo: 'Attention',
      vermelho: 'Critical',
      neutro: 'Not rated',
    },
    cores: { verde: 'Green', amarelo: 'Yellow', vermelho: 'Red' },
  },

  dashboard: {
    navegacao: 'Navigation',
    filtrosAria: 'Dashboard filters',
    indicadores: (n: number) => (n === 1 ? 'indicator' : 'indicators'),
    dimensao: '1 · Dimension',
    pilar: '2 · Pillar',
    tema: '3 · Theme',
    subtema: '4 · Sub-theme',
    indicador: '5 · Indicator',
    ajuda: 'Filters are chained: changing one level automatically adjusts the following ones.',
    nenhum: 'No indicator matches the selected combination of filters.',
    selecionado: 'Selected indicator',
    orgao: 'Responsible agency',
    categorizacao: 'Classification',
    situacao: (ano: string) => `Status in ${ano}`,
    resultado: (ano: string) => `Result ${ano}`,
    referenciaIdeal: 'Ideal reference (green)',
    referencia: 'Reference',
    semReferencia: 'No reference value or qualitative metric.',
    detalhes: 'Details',
    detalhesAria: 'Indicator details',
    subabas: { grafico: 'Time series', regras: 'Rating rules', dados: 'Raw data' },
    evolucao: 'Time series',
    notaGrafico:
      'Each bar is colored by the rating rule applied to that year\'s value. The dashed line shows the series trend. Source: RAPI 2024-2025.',
    semGrafico: 'The trend chart could not be generated. Values are text or not available (ND).',
    semRegras: 'No rating rule is registered for this indicator.',
    criterioGeral: 'General criterion',
    original: 'Original',
    valor: 'Value',
    tendencia: 'Trend',
  },

  serie: {
    ano: 'Year',
    original: 'Original value',
    numerico: 'Numeric value',
    semaforo: 'Rating',
    legenda: 'Indicator time series: original values, numeric values and traffic-light rating.',
    planilha: 'Time series',
  },

  explorador: {
    legenda:
      'Full dataset of the RAPI 2024-2025 indicators, with original and numeric values per year and the rating ranges.',
    planilha: 'RAPI 2024-2025 indicators',
    nota:
      'Click a column title to sort (ascending → descending → original) and the funnel to filter. CSV or Excel export follows the current search, filters and sorting.',
    colunas: {
      dimensao: 'Dimension',
      pilar: 'Pillar',
      tema: 'Theme',
      subtema: 'Sub-theme',
      orgao: 'Responsible agency',
      indicador: 'Indicator',
      original: (ano: string) => `${ano} (Original)`,
      numerico: (ano: string) => `${ano} (Numeric)`,
      faixaVerde: 'Green range',
      faixaAmarela: 'Yellow range',
      faixaVermelha: 'Red range',
    },
    dadosOriginais: 'Cell values are kept in Portuguese, as published in the report.',
  },

  tabela: {
    busca: 'Global search',
    buscaPlaceholder: 'Search all columns…',
    limparBusca: 'Clear search',
    linhas: (n: number, total: number) => `${n} of ${total} rows`,
    filtrosAtivos: 'Active filters',
    removerFiltro: (coluna: string) => `Remove filter on ${coluna}`,
    limparTudo: 'Clear all',
    ordenarPor: (coluna: string) => `Sort by ${coluna}`,
    filtrar: (coluna: string) => `Filter ${coluna}`,
    filtroAtivo: ' (filter active)',
    nenhumaLinha: 'No rows match the applied filters.',
    limparFiltros: 'Clear filters',
    exportar: 'Export data',
    csvTitulo: 'Download the selection as CSV',
    excelTitulo: 'Download the selection as Excel (XLSX)',
    gerando: 'Generating…',
  },

  filtro: {
    titulo: 'Filter',
    limpar: 'Clear',
    concluir: 'Done',
    tipos: { texto: 'text', categoria: 'category', numero: 'number', data: 'date' },
    condicao: 'Condition',
    modos: { contem: 'contains', 'nao-contem': 'does not contain', comeca: 'starts with', igual: 'equals' },
    termoAria: 'Filter text',
    termoPlaceholder: 'Type a term…',
    ocultarVazias: 'Hide empty cells',
    buscarValores: 'Search values…',
    marcarTodos: 'Select all',
    marcarVisiveis: 'Select visible',
    desmarcar: 'Unselect',
    nenhumValor: 'No value found.',
    minimo: 'Minimum',
    maximo: 'Maximum',
    faixa: (min: string, max: string) => `Data range: ${min} to ${max}`,
    ocultarSemValor: 'Hide cells without a numeric value',
    de: 'From',
    ate: 'To',
    vazio: '(empty)',
    resumo: {
      semVazios: 'no empty cells',
      valores: (n: number) => `${n} values`,
      aPartirDe: (d: string) => `from ${d}`,
      ateData: (d: string) => `until ${d}`,
    },
  },

  png: {
    baixar: 'Download chart as PNG',
    gerando: 'Generating image…',
    pronto: 'Image downloaded',
    erro: 'The image could not be generated',
  },

  relatorio: {
    s7: { rotulo: 'Section 7 · Considerations and recommendations', titulo: 'What the data', destaque: 'call for.' },
    s8: { rotulo: 'Section 8 · Final remarks', titulo: 'Where the city', destaque: 'is heading.' },
    s9: { rotulo: 'Section 9 · Acknowledgements and credits', titulo: 'Who made the', destaque: 'report.' },
    temas: (n: number) => `${n} themes`,
    grupoTrabalho: 'Indicators Working Group · RAPI 2024-2025',
    prefixoTema: /^Theme:\s*/,
  },

  select: { semOpcoes: '— no options —' },

  chat: {
    sugestoes: [
      'What was water consumption in 2024 and what does the report recommend?',
      'Which sanitation indicators are in a critical situation?',
      'Compare education performance between 2023 and 2024.',
      'What does the report say about public spending management?',
    ],
    comecamos: 'Where shall we',
    comecamosDestaque: 'start?',
    conheco: (n: number) => `I know the ${n} indicators and the analytical text of the report.`,
    login: 'login',
    nova: 'New',
    novaTitulo: 'New conversation',
    sair: 'Sign out',
    sairTitulo: 'Disconnect and delete the credential from this browser',
    historico: 'Conversation history',
    rodape: 'AI-generated content may be inaccurate — always check the official report.',
    interrompidaPorVoce: 'Response stopped by you.',
    interrompida: 'Response stopped.',
    inesperado: 'Oops! Something unexpected happened while querying the assistant.',
    falhaLogin: 'The sign-in could not be completed.',

    bolha: {
      voce: 'You:',
      assistente: 'Assistant: ',
      erro: 'Error',
      bloqueio: 'Guardrail · request declined',
      consultor: 'RAPI Advisor · AI',
      digitando: 'Looking up the RAPI indicators and text…',
      geradoPor: (modelo: string) => `AI-generated · ${modelo}`,
    },

    campo: {
      rotulo: 'Your question to the assistant',
      placeholder: 'Ask about an indicator, theme or recommendation…',
      parar: 'Stop the response',
      enviar: 'Send question',
      enviarTitulo: 'Send (Enter)',
    },

    seletor: {
      carregando: 'Loading models…',
      gratis: 'free',
      buscar: 'Search model',
      buscarPlaceholder: (n: number) => `Search ${n} models…`,
      filtroCusto: 'Filter by cost',
      soGratis: 'Free',
      todos: 'All',
      modelos: 'Models',
      nenhum: 'No model found.',
    },

    aviso: {
      titulo: 'Transparency notice · ISO/IEC 42001',
      ola: 'Hello! You are talking to an',
      sistemaIA: 'Artificial Intelligence system',
      olaFim: ', not a person. I help you query the data and text of the RAPI 2024-2025 report on Florianópolis.',
      modelo: 'Model:',
      modeloAntes: 'answers generated by',
      modeloDepois: (provedor: string) => `via ${provedor}, chosen by you.`,
      modeloDesconectado: 'answers are generated by the provider and model you choose when connecting.',
      limitacoes: 'Limitations:',
      limitacoesTexto1: 'I can be wrong, incomplete or misinterpret. Always check the',
      relatorioOficial: 'official report',
      limitacoesTexto2: 'before using an answer for decisions — the final decision is always human.',
      escopo: 'Scope and controls:',
      escopoTexto: 'I only answer about the report; there are safeguards against instruction manipulation and output monitoring.',
      dados: 'Your data:',
      dadosTexto:
        'questions are sent to the chosen provider; e-mails, CPF numbers, phone numbers and keys are masked before sending. This site does not store conversations, and your credential stays only in your browser. Do not share personal data.',
      contato: 'Contact:',
      contatoTexto: 'questions or challenges about the assistant can be sent to',
    },

    conexao: {
      lembrar: 'Remember on this browser',
      lembrarNota: '(if unchecked, the credential is cleared when the tab closes)',
      recomendado: 'Recommended',
      gratis: 'Free models',
      entrarCom: 'Sign in with',
      openrouterTexto:
        'Secure sign-in, no keys to copy. Start for free with automatic routing across free models, or pick any model from the catalog.',
      vantagens: [
        'Automatic routing across free models (openrouter/free)',
        'Full model catalog to choose from during the chat',
        'No password on this site: authorization happens at OpenRouter',
      ],
      concluindo: 'Completing sign-in…',
      redirecionando: 'Redirecting…',
      entrar: 'Sign in with OpenRouter',
      redirecionamentoNota: 'You will be taken to openrouter.ai to authorize and brought back automatically.',
      falhaInicio: 'The sign-in could not be started.',
      byok: 'BYOK · your own key',
      traga: 'Bring your',
      chave: 'key.',
      byokTexto: 'Use an account you already have with an AI provider. Usage is billed by the provider, to your account.',
      provedor: 'Provider',
      chaveDe: (provedor: string) => `API key · ${provedor}`,
      obterChave: 'Get a key',
      mostrar: 'Show key',
      ocultar: 'Hide key',
      validando: 'Validating key…',
      validar: 'Validate and connect',
      incompleta: 'The key looks incomplete. Paste the whole key, without spaces.',
      semModelo: 'No model is available for this key.',
      falhaValidar: 'The key could not be validated.',
      seguranca:
        'The key stays in your browser and is sent, over a secure connection, only to this site\'s server to be relayed to the provider — it is never stored or logged.',
      exemploMistral: '32-character key',
    },

    erros: {
      consultarModelos: 'The models could not be loaded. Check your connection.',
      respostaModelos: 'Unexpected response while listing models.',
      requisicao: (status: number) => `The request failed (HTTP ${status}).`,
      demorou: 'The response took longer than expected. Try rephrasing the question.',
      semConexao: 'Could not reach the assistant. Check your connection.',
    },

    pkce: {
      https: 'Secure sign-in requires HTTPS (or localhost).',
      cancelado: 'The OpenRouter sign-in was cancelled or denied.',
      semCodigo: 'OpenRouter did not return an authorization code.',
      semSessao: 'Sign-in session not found. Start the sign-in again in this same tab.',
      expirou: 'The sign-in expired. Please try again.',
      state: 'Sign-in security check failed (state mismatch). Please try again.',
      recusou: (status: number) => `OpenRouter rejected the code exchange (HTTP ${status}).`,
      inesperada: 'Unexpected response from OpenRouter.',
    },
  },
};

export const TEXTOS: Readonly<Record<Idioma, Textos>> = { pt, en };

/**
 * Textos do idioma ativo para módulos fora do React (clientes HTTP, login).
 * O idioma é lido do atributo `lang` do `<html>`, mantido pelas preferências.
 */
export function textosAtuais(): Textos {
  return TEXTOS[idiomaAtual()];
}

/** Idioma ativo, lido do atributo `lang` do `<html>`. */
export function idiomaAtual(): Idioma {
  return typeof document !== 'undefined' && document.documentElement.lang.startsWith('en') ? 'en' : 'pt';
}
