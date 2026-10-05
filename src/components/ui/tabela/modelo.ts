/**
 * ==========================================================
 * Modelo da tabela de dados: colunas, filtros e ordenação
 * ==========================================================
 *
 * Lógica pura (sem React) usada por `<TabelaDados />`. Cada coluna
 * declara um `tipo`, e o tipo decide como ela é filtrada e ordenada:
 *
 * | tipo        | filtro                                   | ordenação     |
 * |-------------|------------------------------------------|---------------|
 * | `texto`     | contém / não contém / começa / é igual   | alfabética    |
 * | `categoria` | seleção de valores (lista com contagem)  | alfabética    |
 * | `numero`    | intervalo mínimo–máximo                  | numérica      |
 * | `data`      | intervalo de datas (ISO `AAAA-MM-DD`)    | cronológica   |
 *
 * Comparações de texto ignoram acentos e caixa.
 */

import type { ReactNode } from 'react';
import type { Textos } from '@/i18n/textos';
import { localeNumeros } from '@/lib/format';
import { normalizarChave } from '@/lib/taxonomia';

/** Tipos de coluna suportados. */
export type TipoColuna = 'texto' | 'categoria' | 'numero' | 'data';

/** Valor bruto de uma célula: usado para filtrar, ordenar e exportar. */
export type ValorBruto = string | number | null;

/** Definição de uma coluna. */
export interface ColunaTabela<T> {
  readonly id: string;
  readonly titulo: string;
  readonly tipo: TipoColuna;
  /** Valor bruto. Em colunas `data`, uma string ISO (`AAAA-MM-DD`). */
  readonly valor: (linha: T) => ValorBruto;
  /** Texto exibido na célula (padrão: o valor bruto como texto). */
  readonly exibir?: (linha: T) => string;
  /** Renderização customizada da célula. */
  readonly render?: (linha: T) => ReactNode;
  /** Classe de largura mínima (ex.: `min-w-40`). */
  readonly larguraMinima?: string;
}

// ==========================================================
// Filtros
// ==========================================================

/** Modos do filtro textual. */
export type ModoTexto = 'contem' | 'nao-contem' | 'comeca' | 'igual';

export type Filtro =
  | { readonly tipo: 'texto'; readonly modo: ModoTexto; readonly termo: string; readonly ocultarVazios: boolean }
  | { readonly tipo: 'categoria'; readonly selecionados: readonly string[] }
  | { readonly tipo: 'numero'; readonly min: number | null; readonly max: number | null; readonly ocultarVazios: boolean }
  | { readonly tipo: 'data'; readonly de: string | null; readonly ate: string | null };

/** Filtros ativos, por id de coluna. */
export type MapaFiltros = Readonly<Record<string, Filtro>>;

/** Marcador (neutro em qualquer idioma) de células vazias nas listas de categorias. */
export const ROTULO_VAZIO = '—';

/** Texto de exibição padrão de uma célula. */
export function textoCelula<T>(coluna: ColunaTabela<T>, linha: T): string {
  if (coluna.exibir) return coluna.exibir(linha);
  const valor = coluna.valor(linha);
  return valor === null ? '' : String(valor);
}

/** Chave de categoria (o texto exibido, ou o rótulo de vazio). */
export function chaveCategoria<T>(coluna: ColunaTabela<T>, linha: T): string {
  const texto = textoCelula(coluna, linha).trim();
  return texto === '' ? ROTULO_VAZIO : texto;
}

/** Um filtro está de fato restringindo algo? */
export function filtroAtivo(filtro: Filtro | undefined): filtro is Filtro {
  if (!filtro) return false;
  switch (filtro.tipo) {
    case 'texto':
      return filtro.termo.trim() !== '' || filtro.ocultarVazios;
    case 'categoria':
      return true;
    case 'numero':
      return filtro.min !== null || filtro.max !== null || filtro.ocultarVazios;
    case 'data':
      return filtro.de !== null || filtro.ate !== null;
  }
}

/** Testa uma linha contra o filtro de uma coluna. */
export function passaNoFiltro<T>(coluna: ColunaTabela<T>, linha: T, filtro: Filtro): boolean {
  switch (filtro.tipo) {
    case 'texto': {
      const texto = textoCelula(coluna, linha);
      if (filtro.ocultarVazios && texto.trim() === '') return false;

      const termo = normalizarChave(filtro.termo);
      if (termo === '') return true;

      const alvo = normalizarChave(texto);
      if (filtro.modo === 'contem') return alvo.includes(termo);
      if (filtro.modo === 'nao-contem') return !alvo.includes(termo);
      if (filtro.modo === 'comeca') return alvo.startsWith(termo);
      return alvo === termo;
    }

    case 'categoria':
      return filtro.selecionados.includes(chaveCategoria(coluna, linha));

    case 'numero': {
      const bruto = coluna.valor(linha);
      const valor = typeof bruto === 'number' && Number.isFinite(bruto) ? bruto : null;
      if (valor === null) return !filtro.ocultarVazios && filtro.min === null && filtro.max === null;
      if (filtro.min !== null && valor < filtro.min) return false;
      if (filtro.max !== null && valor > filtro.max) return false;
      return true;
    }

    case 'data': {
      const bruto = coluna.valor(linha);
      const valor = typeof bruto === 'string' && bruto !== '' ? bruto.slice(0, 10) : null;
      if (valor === null) return filtro.de === null && filtro.ate === null;
      if (filtro.de !== null && valor < filtro.de) return false;
      if (filtro.ate !== null && valor > filtro.ate) return false;
      return true;
    }
  }
}

/** Formata número para os resumos de filtro, no locale ativo. */
const numeroCurto = { format: (n: number): string => new Intl.NumberFormat(localeNumeros(), { maximumFractionDigits: 4 }).format(n) };

/** Formata uma data ISO como DD/MM/AAAA. */
function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : iso;
}

/** Resumo legível de um filtro ativo, para os chips da barra. */
export function descreverFiltro(filtro: Filtro, tf: Textos['filtro']): string {
  switch (filtro.tipo) {
    case 'texto':
      return filtro.termo.trim() !== ''
        ? `${tf.modos[filtro.modo]} “${filtro.termo.trim()}”`
        : tf.resumo.semVazios;
    case 'categoria':
      return filtro.selecionados.length === 1
        ? (filtro.selecionados[0] ?? '')
        : tf.resumo.valores(filtro.selecionados.length);
    case 'numero':
      if (filtro.min !== null && filtro.max !== null)
        return `${numeroCurto.format(filtro.min)} – ${numeroCurto.format(filtro.max)}`;
      if (filtro.min !== null) return `≥ ${numeroCurto.format(filtro.min)}`;
      if (filtro.max !== null) return `≤ ${numeroCurto.format(filtro.max)}`;
      return tf.resumo.semVazios;
    case 'data':
      if (filtro.de !== null && filtro.ate !== null) return `${dataCurta(filtro.de)} – ${dataCurta(filtro.ate)}`;
      if (filtro.de !== null) return tf.resumo.aPartirDe(dataCurta(filtro.de));
      return tf.resumo.ateData(dataCurta(filtro.ate ?? ''));
  }
}

// ==========================================================
// Ordenação
// ==========================================================

export type Direcao = 'asc' | 'desc';

export interface Ordenacao {
  readonly colunaId: string;
  readonly direcao: Direcao;
}

const colator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

/**
 * Ordena as linhas pela coluna indicada. Células vazias vão sempre para
 * o fim, independentemente da direção.
 */
export function ordenar<T>(linhas: readonly T[], coluna: ColunaTabela<T>, direcao: Direcao): T[] {
  const fator = direcao === 'asc' ? 1 : -1;

  return [...linhas].sort((a, b) => {
    const va = coluna.valor(a);
    const vb = coluna.valor(b);

    const vazioA = va === null || va === '';
    const vazioB = vb === null || vb === '';
    if (vazioA || vazioB) return vazioA === vazioB ? 0 : vazioA ? 1 : -1;

    if (coluna.tipo === 'numero') return (Number(va) - Number(vb)) * fator;
    if (coluna.tipo === 'data') return String(va).localeCompare(String(vb)) * fator;
    return colator.compare(textoCelula(coluna, a), textoCelula(coluna, b)) * fator;
  });
}

/** Converte texto digitado (pt-BR ou en) em número, ou `null`. */
export function lerNumero(texto: string): number | null {
  const limpo = texto.trim().replace(/\s/g, '');
  if (limpo === '') return null;

  // "1.234,5" → 1234.5 ; "1234.5" → 1234.5
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}
