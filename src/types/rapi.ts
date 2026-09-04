/**
 * ==========================================================
 * Contratos de dados do RAPI 2024-2025
 * ==========================================================
 *
 * Estas interfaces espelham a estrutura de `dados_rapi_completo.json`
 * (206 registros) e as estruturas derivadas usadas pela aplicacao.
 *
 * O JSON bruto e carregado como `unknown` e normalizado em runtime
 * por `src/lib/dataset.ts`, garantindo que o resto do codigo trabalhe
 * sempre com os tipos estritos declarados aqui.
 */

/** Anos cobertos pela serie historica do relatorio, do mais antigo ao mais recente. */
export const ANOS = ['2019', '2020', '2021', '2022', '2023', '2024'] as const;

/** Uniao literal dos anos disponiveis (`'2019' | '2020' | ... | '2024'`). */
export type AnoRAPI = (typeof ANOS)[number];

/** Ano de referencia mais recente da serie historica. */
export const ANO_ATUAL: AnoRAPI = '2024';

/** Ano imediatamente anterior, usado no calculo de variacao percentual. */
export const ANO_ANTERIOR: AnoRAPI = '2023';

/**
 * Serie historica bruta de um indicador, exatamente como veio do relatorio.
 *
 * Os valores sao textuais e frequentemente "sujos" — podem conter unidades,
 * notas de rodape entre parenteses, memorias de calculo com `=`, o literal
 * `"ND"` (nao disponivel) ou `null`.
 *
 * @example { "2023": "179,9 litros", "2024": "ND" }
 */
export type DadosAnuais = Partial<Record<AnoRAPI, string | null>>;

/**
 * Regras de semaforizacao de um indicador.
 *
 * O dataset apresenta tres formatos distintos:
 * 1. Faixas completas — `verde` + `amarelo` + `vermelho` (126 indicadores);
 * 2. Regra unica descritiva em `geral` (67 indicadores);
 * 3. Objeto vazio, para indicadores novos/nao semaforizados (13 indicadores).
 *
 * Os textos sao expressoes em linguagem natural interpretadas em runtime por
 * `avaliarCorSemaforo` (ex.: `"120-200"`, `"< 80 ou > 250"`, `"> 90%-100%"`).
 */
export interface FaixasSemaforizacao {
  /** Faixa considerada satisfatoria. */
  verde?: string | null;
  /** Faixa de atencao. */
  amarelo?: string | null;
  /** Faixa critica. */
  vermelho?: string | null;
  /** Regra unica descritiva, quando o indicador nao possui faixas discretas. */
  geral?: string | null;
}

/**
 * Um indicador do RAPI, ja normalizado e enriquecido.
 *
 * Os campos `dimensao` e `pilar` nao existem no JSON de origem: sao derivados
 * do `tema` pela taxonomia oficial da Secao 4 do relatorio (3 dimensoes,
 * 12 pilares, 25 temas) — ver `src/lib/taxonomia.ts`.
 */
export interface IndicadorRAPI {
  /** Chave estavel e unica, derivada dos identificadores do relatorio. */
  readonly id: string;
  /** Dimensao derivada do tema: Ambiental, Urbana ou Fiscal. */
  readonly dimensao: Dimensao;
  /** Pilar derivado do tema (um dos 12 pilares do relatorio). */
  readonly pilar: string;
  /** Tema do indicador (25 possiveis). */
  readonly tema: string;
  /** Subtema; recebe `'Geral'` quando ausente, como no `fillna` original. */
  readonly subtema: string;
  /** Identificador na metodologia CES/BID. */
  readonly idCes: string | null;
  /** Identificador na nova ordenacao do relatorio. */
  readonly idNovaOrdem: string | null;
  /** Identificador interno de Florianopolis. */
  readonly idFloripa: string | null;
  /** Objetivo de Desenvolvimento Sustentavel associado, quando houver. */
  readonly ods: string | null;
  /** Orgao ou entidade responsavel pelo fornecimento do dado. */
  readonly orgaoResponsavel: string;
  /** Descricao completa do indicador. */
  readonly indicador: string;
  /** Regras de semaforizacao. */
  readonly faixas: FaixasSemaforizacao;
  /** Serie historica textual original. */
  readonly dadosAnuais: DadosAnuais;
  /** Serie historica ja convertida para numeros (ou `null` quando nao numerica). */
  readonly valoresNumericos: Readonly<Record<AnoRAPI, number | null>>;
}

/** As tres dimensoes analiticas do relatorio. */
export type Dimensao = 'Ambiental' | 'Urbana' | 'Fiscal';

/** Classificacao semaforica resultante da avaliacao de um valor. */
export type StatusSemaforo = 'verde' | 'amarelo' | 'vermelho' | 'neutro';

/** Um ponto da serie historica pronto para renderizacao em grafico/tabela. */
export interface PontoHistorico {
  readonly ano: AnoRAPI;
  /** Texto original vindo do relatorio (`null` quando ausente). */
  readonly valorOriginal: string | null;
  /** Valor numerico extraido (`null` quando nao conversivel). */
  readonly valorNumerico: number | null;
  /** Status semaforico do valor naquele ano especifico. */
  readonly status: StatusSemaforo;
  /** Cor hexadecimal/rgba correspondente ao status. */
  readonly cor: string;
}

/** Estado dos cinco filtros encadeados do dashboard. */
export interface FiltrosDashboard {
  dimensao: string;
  pilar: string;
  tema: string;
  subtema: string;
  indicadorId: string;
}

/** Papel de uma mensagem na conversa com o assistente. */
export type PapelMensagem = 'user' | 'assistant';

/** Uma mensagem do historico do chat. */
export interface MensagemChat {
  readonly id: string;
  readonly role: PapelMensagem;
  readonly content: string;
  /** Marca mensagens que falharam, para estilizacao diferenciada. */
  readonly erro?: boolean;
}
