/**
 * ==========================================================
 * Formatacao numerica no padrao brasileiro (pt-BR)
 * ==========================================================
 *
 * Reproduz o comportamento do `app.py`, que formatava os rotulos do grafico
 * com `f"{x:,.2f}"` e depois trocava os separadores para o padrao brasileiro.
 * Aqui isso e feito nativamente com `Intl.NumberFormat`.
 */

/** Duas casas decimais fixas — usado nos rotulos do grafico. */
const FORMATADOR_2_CASAS = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Ate duas casas decimais, sem zeros a direita — usado em tabelas. */
const FORMATADOR_COMPACTO = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Formata um numero com duas casas decimais no padrao pt-BR.
 *
 * @example formatarNumero(1282.34) // "1.282,34"
 * @example formatarNumero(null)    // ""
 */
export function formatarNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '';
  return FORMATADOR_2_CASAS.format(valor);
}

/**
 * Formata um numero omitindo casas decimais desnecessarias.
 *
 * @example formatarNumeroCompacto(2100)   // "2.100"
 * @example formatarNumeroCompacto(173.55) // "173,55"
 */
export function formatarNumeroCompacto(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '';
  return FORMATADOR_COMPACTO.format(valor);
}

/**
 * Formata a variacao percentual entre dois anos, com sinal explicito.
 *
 * Espelha o calculo do original: `((atual - anterior) / |anterior|) * 100`,
 * suprimido quando o valor anterior e zero ou algum dos dois e ausente.
 *
 * @returns Ex.: `"+4,2% vs 2023"`, ou `null` quando nao calculavel.
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
  const texto = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(variacao);

  return `${sinal}${texto}% vs ${anoAnterior}`;
}

/** Texto exibido quando um valor nao esta disponivel. */
export const TEXTO_SEM_DADO = 'ND';

/** Devolve o valor textual ou o marcador `ND`. */
export function ouND(valor: string | null | undefined): string {
  return valor === null || valor === undefined || valor.trim() === '' ? TEXTO_SEM_DADO : valor;
}
