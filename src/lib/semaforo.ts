/**
 * ==========================================================
 * Motor de semaforizacao dinamica
 * ==========================================================
 *
 * Porte fiel da funcao `avaliar_cor_semaforo` do `app.py` original.
 *
 * As faixas do RAPI nao sao numeros estruturados: sao expressoes escritas
 * em portugues por diferentes orgaos. Este modulo interpreta essas regras
 * em runtime, cobrindo:
 *
 * - intervalos com varios separadores: `120-200`, `120–200`, `75% a 90%`,
 *   `10 até 20`;
 * - operadores de comparacao simbolicos e por extenso: `<`, `<=`, `≤`,
 *   `>`, `>=`, `≥`, `abaixo`, `acima`, `menor`, `maior`, `minimo`, `maximo`;
 * - condicoes compostas unidas por `ou`: `< 80 ou > 250`;
 * - percentuais, que sao ignorados na comparacao (`> 90%` == `> 90`).
 */

import type { FaixasSemaforizacao, StatusSemaforo } from '@/types/rapi';

/**
 * Paleta oficial da semaforizacao, identica a do dashboard Streamlit.
 */
export const CORES_SEMAFORO = {
  verde: '#2ca02c',
  amarelo: '#ff7f0e',
  vermelho: '#d62728',
  /** Sem dado numerico ou indicador sem faixas cadastradas. */
  cinza: 'rgba(128, 128, 128, 0.5)',
  /** Valor valido que nao se enquadra em nenhuma faixa (regra qualitativa). */
  azul: 'rgba(31, 119, 180, 0.4)',
} as const;

/** Rotulos legiveis para cada status, usados em legendas e `aria-label`. */
export const ROTULOS_SEMAFORO: Record<StatusSemaforo, string> = {
  verde: 'Satisfatório',
  amarelo: 'Atenção',
  vermelho: 'Crítico',
  neutro: 'Sem classificação',
};

/** Captura numeros inteiros ou decimais dentro de uma condicao. */
const REGEX_NUMEROS_REGRA = /\d+\.\d+|\d+/g;

/**
 * Avalia se um valor satisfaz uma regra textual de faixa.
 *
 * A regra e normalizada antes da analise:
 * - minusculas;
 * - virgula -> ponto (decimal) e `%` removido;
 * - travessoes (`–`, `—`), ` a ` e ` até ` unificados em `-`;
 * - a expressao e quebrada em condicoes independentes por ` ou `.
 *
 * Para cada condicao, os numeros presentes decidem a interpretacao:
 * - 2 ou mais numeros -> intervalo fechado `[min, max]`;
 * - exatamente 1      -> comparacao pelo operador encontrado no texto.
 *
 * @param regraTexto Texto da faixa (ex.: `"75%–90%"`, `"< 80 ou > 250"`).
 * @param valor Valor numerico a testar.
 * @returns `true` se o valor satisfaz ao menos uma das condicoes.
 */
export function avaliarCondicao(regraTexto: string | null | undefined, valor: number): boolean {
  if (regraTexto === null || regraTexto === undefined) return false;
  if (String(regraTexto).trim() === '') return false;

  // Normaliza: minusculas, decimal com ponto, sem simbolo de porcentagem.
  let regra = String(regraTexto).toLowerCase().replaceAll(',', '.').replaceAll('%', '');

  // Unifica todos os separadores de intervalo em um hifen simples.
  regra = regra
    .replaceAll('–', '-') // travessao curto
    .replaceAll('—', '-') // travessao longo
    .replaceAll(' a ', '-')
    .replaceAll(' até ', '-');

  // Condicoes compostas: "< 80 ou > 250" vira ["< 80", "> 250"].
  const condicoes = regra.split(' ou ');

  for (const cond of condicoes) {
    const encontrados = cond.match(REGEX_NUMEROS_REGRA);
    if (!encontrados || encontrados.length === 0) continue;

    const nums = encontrados.map(Number);

    if (nums.length >= 2) {
      // --- Intervalo: usa os dois primeiros numeros como limites ---------
      const a = nums[0] as number;
      const b = nums[1] as number;
      if (Math.min(a, b) <= valor && valor <= Math.max(a, b)) return true;
      continue;
    }

    // --- Operador com um unico limite ------------------------------------
    const limite = nums[0] as number;

    if (cond.includes('<=') || cond.includes('≤') || cond.includes('máximo')) {
      if (valor <= limite) return true;
    } else if (cond.includes('<') || cond.includes('abaixo') || cond.includes('menor')) {
      if (valor < limite) return true;
    } else if (cond.includes('>=') || cond.includes('≥') || cond.includes('mínimo')) {
      if (valor >= limite) return true;
    } else if (cond.includes('>') || cond.includes('acima') || cond.includes('maior')) {
      if (valor > limite) return true;
    } else if (cond.includes('igual') || cond.includes('==')) {
      if (valor === limite) return true;
    }
  }

  return false;
}

/**
 * Classifica um valor segundo as faixas de um indicador.
 *
 * As faixas sao testadas na ordem verde -> amarelo -> vermelho e a primeira
 * que casar define o resultado, exatamente como no original.
 *
 * @returns `'neutro'` quando nao ha valor, nao ha faixas cadastradas, ou
 *          nenhuma regra se aplica (faixa puramente qualitativa).
 */
export function avaliarStatusSemaforo(
  valor: number | null | undefined,
  faixas: FaixasSemaforizacao | null | undefined,
): StatusSemaforo {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return 'neutro';
  if (!faixas || Object.keys(faixas).length === 0) return 'neutro';

  if (avaliarCondicao(faixas.verde, valor)) return 'verde';
  if (avaliarCondicao(faixas.amarelo, valor)) return 'amarelo';
  if (avaliarCondicao(faixas.vermelho, valor)) return 'vermelho';

  return 'neutro';
}

/**
 * Retorna a cor da semaforizacao para um valor, preservando a distincao do
 * codigo Python entre os dois casos neutros:
 *
 * - **cinza** — nao ha valor numerico ou o indicador nao possui faixas;
 * - **azul**  — ha valor e ha faixas, mas nenhuma regra se aplica
 *   (tipicamente faixas descritivas/qualitativas).
 *
 * @returns Cor hexadecimal (`#2ca02c`, `#ff7f0e`, `#d62728`) ou rgba neutra.
 */
export function avaliarCorSemaforo(
  valor: number | null | undefined,
  faixas: FaixasSemaforizacao | null | undefined,
): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return CORES_SEMAFORO.cinza;
  if (!faixas || Object.keys(faixas).length === 0) return CORES_SEMAFORO.cinza;

  const status = avaliarStatusSemaforo(valor, faixas);
  if (status === 'verde') return CORES_SEMAFORO.verde;
  if (status === 'amarelo') return CORES_SEMAFORO.amarelo;
  if (status === 'vermelho') return CORES_SEMAFORO.vermelho;

  return CORES_SEMAFORO.azul;
}

/**
 * Indica se o indicador possui faixas discretas (verde/amarelo/vermelho),
 * em oposicao a uma regra unica descritiva (`geral`) ou nenhuma faixa.
 */
export function possuiFaixasDiscretas(faixas: FaixasSemaforizacao): boolean {
  return Boolean(faixas.verde ?? faixas.amarelo ?? faixas.vermelho);
}
