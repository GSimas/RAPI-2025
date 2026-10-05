/**
 * ==========================================================
 * Formatação numérica sensível ao idioma
 * ==========================================================
 *
 * Reproduz o comportamento do `app.py`, que formatava os rótulos do gráfico
 * com `f"{x:,.2f}"` e depois trocava os separadores para o padrão
 * brasileiro. Aqui isso é feito com `Intl.NumberFormat`, no locale do
 * idioma escolhido (pt-BR por padrão; en-US na interface em inglês).
 *
 * O locale é definido por `PreferenciasProvider` a cada renderização,
 * antes de qualquer componente formatar números.
 */

let locale = 'pt-BR';
let formatador2Casas = criar(2, 2);
let formatadorCompacto = criar(0, 2);
let formatadorVariacao = criar(1, 1);

function criar(minimo: number, maximo: number): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: minimo, maximumFractionDigits: maximo });
}

/** Troca o locale dos formatadores (ex.: `pt-BR`, `en-US`). */
export function definirLocaleNumeros(novo: string): void {
  if (novo === locale) return;
  locale = novo;
  formatador2Casas = criar(2, 2);
  formatadorCompacto = criar(0, 2);
  formatadorVariacao = criar(1, 1);
}

/** Locale numérico em uso. */
export function localeNumeros(): string {
  return locale;
}

/**
 * Formata um número com duas casas decimais.
 *
 * @example formatarNumero(1282.34) // "1.282,34" (pt-BR)
 * @example formatarNumero(null)    // ""
 */
export function formatarNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '';
  return formatador2Casas.format(valor);
}

/**
 * Formata um número omitindo casas decimais desnecessárias.
 *
 * @example formatarNumeroCompacto(2100)   // "2.100" (pt-BR)
 * @example formatarNumeroCompacto(173.55) // "173,55" (pt-BR)
 */
export function formatarNumeroCompacto(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '';
  return formatadorCompacto.format(valor);
}

/**
 * Formata a variação percentual entre dois anos, com sinal explícito.
 *
 * Espelha o cálculo do original: `((atual - anterior) / |anterior|) * 100`,
 * suprimido quando o valor anterior é zero ou algum dos dois é ausente.
 *
 * @returns Ex.: `"+4,2% vs 2023"`, ou `null` quando não calculável.
 */
export function formatarVariacao(
  atual: number | null,
  anterior: number | null,
  anoAnterior: string,
): string | null {
  if (atual === null || anterior === null) return null;
  if (!Number.isFinite(atual) || !Number.isFinite(anterior)) return null;
  if (anterior === 0) return null;

  const variacao = ((atual - anterior) / Math.abs(anterior)) * 100;
  const sinal = variacao > 0 ? '+' : '';
  return `${sinal}${formatadorVariacao.format(variacao)}% vs ${anoAnterior}`;
}

/** Texto exibido quando um valor não está disponível. */
export const TEXTO_SEM_DADO = 'ND';

/** Devolve o valor textual ou o marcador `ND`. */
export function ouND(valor: string | null | undefined): string {
  return valor === null || valor === undefined || valor.trim() === '' ? TEXTO_SEM_DADO : valor;
}
