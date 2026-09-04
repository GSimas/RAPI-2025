/**
 * ==========================================================
 * Modulo de limpeza e extracao numerica
 * ==========================================================
 *
 * Porte fiel da funcao `extrair_numero` do `app.py` original (Streamlit).
 *
 * Os valores do RAPI vem de planilhas preenchidas manualmente por dezenas
 * de orgaos, entao chegam "sujos": com unidades, notas de rodape entre
 * parenteses, memorias de calculo e separadores no padrao brasileiro.
 *
 * A ordem das etapas abaixo reproduz exatamente a do Python — qualquer
 * alteracao muda os numeros exibidos no dashboard.
 */

/**
 * Expressao regular de captura numerica, identica a do original.
 *
 * Duas alternativas, avaliadas da esquerda para a direita:
 *
 * 1. `-?\d{1,3}(?:\.\d{3})+(?:,\d+)?`
 *    Formato de milhar brasileiro, com decimal opcional.
 *    Ex.: `212.303`, `1.282,34`, `2.500.536`
 *
 * 2. `-?\d+(?:[.,]\d+)?`
 *    Inteiro contiguo ou decimal simples.
 *    Ex.: `1080`, `2100`, `10.18`, `173,5`
 */
const REGEX_NUMERO = /-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+(?:[.,]\d+)?/;

/**
 * Extrai um numero de uma string potencialmente suja.
 *
 * Etapas (na mesma ordem do Python):
 * 1. Descarta vazios, `null`/`undefined` e o literal `"ND"`.
 * 2. Havendo `=`, mantem apenas o trecho **apos** o ultimo sinal — o valor
 *    final de uma memoria de calculo (`"120/500 = 24%"` -> `"24%"`).
 * 3. Descarta tudo a partir do primeiro `(` — notas de rodape
 *    (`"334,3 km/(base 2022)"` -> `"334,3 km/"`).
 * 4. Captura o primeiro numero com a regex acima.
 * 5. Desambigua os separadores conforme o padrao brasileiro:
 *    - ponto **e** virgula -> ponto e milhar, virgula e decimal;
 *    - so virgula          -> decimal;
 *    - so ponto            -> milhar apenas se **todos** os grupos apos os
 *                             pontos tiverem exatamente 3 digitos; caso
 *                             contrario e decimal (`10.18` continua 10.18).
 *
 * @param valor Texto bruto vindo do relatorio.
 * @returns O numero extraido, ou `null` quando nao houver valor numerico.
 *
 * @example
 * extrairNumero('178,9 litros')          // 178.9
 * extrairNumero('1080 unidades')         // 1080
 * extrairNumero('212.303')               // 212303
 * extrairNumero('1.282,34')              // 1282.34
 * extrairNumero('10.18%')                // 10.18
 * extrairNumero('334,3 km/(base 2022)')  // 334.3
 * extrairNumero('4.523/18.800 = 24,05%') // 24.05
 * extrairNumero('ND')                    // null
 */
export function extrairNumero(valor: unknown): number | null {
  // --- Etapa 1: descarta ausencias ---------------------------------------
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : null;
  }

  const bruto = String(valor).trim();
  if (bruto === '' || bruto.toUpperCase() === 'ND') return null;

  let texto = bruto;

  // --- Etapa 2: o valor real vem depois do sinal de igual -----------------
  if (texto.includes('=')) {
    const partes = texto.split('=');
    texto = partes[partes.length - 1] ?? '';
  }

  // --- Etapa 3: remove notas de rodape entre parenteses -------------------
  texto = (texto.split('(')[0] ?? '').trim();

  // --- Etapa 4: captura o primeiro numero ---------------------------------
  const encontrado = REGEX_NUMERO.exec(texto);
  if (!encontrado) return null;

  let numeroTexto = encontrado[0];

  // --- Etapa 5: normaliza separadores para o formato de `Number()` --------
  const temVirgula = numeroTexto.includes(',');
  const temPonto = numeroTexto.includes('.');

  if (temVirgula && temPonto) {
    // Ex.: "1.282,34" -> "1282.34" (ponto = milhar, virgula = decimal)
    numeroTexto = numeroTexto.replaceAll('.', '').replace(',', '.');
  } else if (temVirgula) {
    // Ex.: "173,5" -> "173.5"
    numeroTexto = numeroTexto.replace(',', '.');
  } else if (temPonto) {
    // Ambiguo: pode ser milhar ("212.303") ou decimal ("10.18").
    // E milhar somente se todo grupo apos um ponto tiver 3 digitos.
    const grupos = numeroTexto.split('.');
    const ehMilhar = grupos.slice(1).every((grupo) => grupo.length === 3);
    if (ehMilhar) {
      numeroTexto = numeroTexto.replaceAll('.', '');
    }
    // Caso contrario preserva o ponto: e um decimal.
  }

  const numero = Number(numeroTexto);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * Aplica `extrairNumero` a uma serie historica inteira.
 *
 * @param serie Mapa `ano -> valor textual`.
 * @param anos Anos a percorrer, na ordem desejada.
 */
export function extrairSerieNumerica<A extends string>(
  serie: Partial<Record<A, string | null>>,
  anos: readonly A[],
): Record<A, number | null> {
  const resultado = {} as Record<A, number | null>;
  for (const ano of anos) {
    resultado[ano] = extrairNumero(serie[ano]);
  }
  return resultado;
}
