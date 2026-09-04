/**
 * ==========================================================
 * Hook dos filtros encadeados do dashboard
 * ==========================================================
 *
 * Substitui os `st.sidebar.selectbox` encadeados do Streamlit por um estado
 * unico e sincronizado. A hierarquia e:
 *
 *   Dimensão -> Pilar -> Tema -> Subtema -> Indicador
 *
 * Sempre que um nivel muda, os niveis abaixo sao revalidados: se a selecao
 * atual deixou de existir no novo recorte, ela cai automaticamente para a
 * primeira opcao valida — nunca restando um filtro "orfao".
 */

import { useCallback, useMemo, useState } from 'react';
import {
  DIMENSOES_DISPONIVEIS,
  indicadoresDe,
  pilaresDe,
  subtemasDe,
  temasDe,
} from '@/lib/dataset';
import type { Dimensao, IndicadorRAPI } from '@/types/rapi';

/** Estado e acoes expostos pelo hook. */
export interface EstadoFiltros {
  /** Selecao corrente em cada nivel da hierarquia. */
  dimensao: Dimensao;
  pilar: string;
  tema: string;
  subtema: string;
  indicadorId: string;

  /** Opcoes validas para cada nivel, ja recortadas pelos niveis acima. */
  opcoesDimensao: readonly Dimensao[];
  opcoesPilar: readonly string[];
  opcoesTema: readonly string[];
  opcoesSubtema: readonly string[];
  opcoesIndicador: readonly IndicadorRAPI[];

  /** Indicador atualmente selecionado (`undefined` se a base estiver vazia). */
  indicador: IndicadorRAPI | undefined;

  selecionarDimensao: (valor: string) => void;
  selecionarPilar: (valor: string) => void;
  selecionarTema: (valor: string) => void;
  selecionarSubtema: (valor: string) => void;
  selecionarIndicador: (id: string) => void;
}

/** Devolve `valor` se ele existir na lista; caso contrario, o primeiro item. */
function manterOuPrimeiro<T>(valor: T, opcoes: readonly T[], padrao: T): T {
  if (opcoes.includes(valor)) return valor;
  return opcoes[0] ?? padrao;
}

/**
 * Gerencia os cinco filtros encadeados do dashboard.
 *
 * @param dimensaoInicial Dimensao pre-selecionada na primeira renderizacao.
 */
export function useFiltros(dimensaoInicial: Dimensao = 'Ambiental'): EstadoFiltros {
  const opcoesDimensao = DIMENSOES_DISPONIVEIS;

  const [dimensao, setDimensao] = useState<Dimensao>(
    manterOuPrimeiro(dimensaoInicial, opcoesDimensao, 'Ambiental'),
  );
  const [pilar, setPilar] = useState<string>(() => pilaresDe(dimensao)[0] ?? '');
  const [tema, setTema] = useState<string>(
    () => temasDe(dimensao, pilaresDe(dimensao)[0] ?? null)[0] ?? '',
  );
  const [subtema, setSubtema] = useState<string>('');
  const [indicadorId, setIndicadorId] = useState<string>('');

  // --- Opcoes derivadas, sempre recortadas pelos niveis superiores --------
  const opcoesPilar = useMemo(() => pilaresDe(dimensao), [dimensao]);
  const pilarValido = manterOuPrimeiro(pilar, opcoesPilar, '');

  const opcoesTema = useMemo(
    () => temasDe(dimensao, pilarValido || null),
    [dimensao, pilarValido],
  );
  const temaValido = manterOuPrimeiro(tema, opcoesTema, '');

  const opcoesSubtema = useMemo(
    () => subtemasDe(dimensao, pilarValido || null, temaValido || null),
    [dimensao, pilarValido, temaValido],
  );
  const subtemaValido = manterOuPrimeiro(subtema, opcoesSubtema, '');

  const opcoesIndicador = useMemo(
    () => indicadoresDe(dimensao, pilarValido || null, temaValido || null, subtemaValido || null),
    [dimensao, pilarValido, temaValido, subtemaValido],
  );

  const indicador = useMemo(
    () => opcoesIndicador.find((i) => i.id === indicadorId) ?? opcoesIndicador[0],
    [opcoesIndicador, indicadorId],
  );

  // --- Acoes: cada nivel reposiciona os niveis abaixo ---------------------
  const selecionarDimensao = useCallback((valor: string) => {
    const nova = valor as Dimensao;
    setDimensao(nova);

    const primeiroPilar = pilaresDe(nova)[0] ?? '';
    const primeiroTema = temasDe(nova, primeiroPilar || null)[0] ?? '';

    setPilar(primeiroPilar);
    setTema(primeiroTema);
    setSubtema('');
    setIndicadorId('');
  }, []);

  const selecionarPilar = useCallback(
    (valor: string) => {
      setPilar(valor);
      setTema(temasDe(dimensao, valor || null)[0] ?? '');
      setSubtema('');
      setIndicadorId('');
    },
    [dimensao],
  );

  const selecionarTema = useCallback((valor: string) => {
    setTema(valor);
    setSubtema('');
    setIndicadorId('');
  }, []);

  const selecionarSubtema = useCallback((valor: string) => {
    setSubtema(valor);
    setIndicadorId('');
  }, []);

  const selecionarIndicador = useCallback((id: string) => setIndicadorId(id), []);

  return {
    dimensao,
    pilar: pilarValido,
    tema: temaValido,
    subtema: subtemaValido,
    indicadorId: indicador?.id ?? '',
    opcoesDimensao,
    opcoesPilar,
    opcoesTema,
    opcoesSubtema,
    opcoesIndicador,
    indicador,
    selecionarDimensao,
    selecionarPilar,
    selecionarTema,
    selecionarSubtema,
    selecionarIndicador,
  };
}
