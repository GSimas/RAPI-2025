/**
 * ==========================================================
 * Aba 2 - Dashboard Interativo
 * ==========================================================
 *
 * Reúne, para o indicador selecionado:
 * - cabeçalho com órgão responsável e categorização;
 * - três cartões de métricas (2023, 2024 com variação, referência ideal);
 * - sub-abas com o gráfico de evolução, as regras de semaforização e os
 *   dados brutos — espelhando os `st.tabs` internos do original.
 */

import { useMemo, useState, type JSX } from 'react';
import { ANO_ANTERIOR, ANO_ATUAL, type IndicadorRAPI } from '@/types/rapi';
import { formatarVariacao, ouND } from '@/lib/format';
import { montarSerieHistorica, possuiDadosPlotaveis } from '@/lib/serie';
import { CORES_SEMAFORO, ROTULOS_SEMAFORO, possuiFaixasDiscretas } from '@/lib/semaforo';
import { ICONE_DIMENSAO } from '@/lib/taxonomia';
import { useFiltros } from '@/hooks/useFiltros';
import { CartaoMetrica } from './CartaoMetrica';
import { GraficoEvolucao } from './GraficoEvolucao';
import { PainelFiltros } from './PainelFiltros';
import { TabelaSerie } from './TabelaSerie';

interface DashboardProps {
  readonly escuro: boolean;
}

/** Identificadores das sub-abas internas do dashboard. */
type SubAba = 'grafico' | 'regras' | 'dados';

const SUB_ABAS: readonly { id: SubAba; rotulo: string; icone: string }[] = [
  { id: 'grafico', rotulo: 'Evolução Histórica', icone: '📈' },
  { id: 'regras', rotulo: 'Regras de Semaforização', icone: '🚦' },
  { id: 'dados', rotulo: 'Dados Brutos do Indicador', icone: '🗄️' },
];

/**
 * Painel analítico de um indicador, com filtros encadeados.
 */
export function Dashboard({ escuro }: DashboardProps): JSX.Element {
  const filtros = useFiltros();
  const [subAba, setSubAba] = useState<SubAba>('grafico');
  const indicador = filtros.indicador;

  return (
    <div className="animate-fade-in space-y-6">
      <PainelFiltros filtros={filtros} />

      {indicador ? (
        <DetalheIndicador
          indicador={indicador}
          escuro={escuro}
          subAba={subAba}
          onSubAba={setSubAba}
        />
      ) : (
        <p className="cartao p-6 text-center text-slate-500 dark:text-slate-400">
          Nenhum indicador corresponde à combinação de filtros selecionada.
        </p>
      )}
    </div>
  );
}

interface DetalheIndicadorProps {
  readonly indicador: IndicadorRAPI;
  readonly escuro: boolean;
  readonly subAba: SubAba;
  readonly onSubAba: (aba: SubAba) => void;
}

/**
 * Bloco de detalhamento do indicador selecionado.
 */
function DetalheIndicador({
  indicador,
  escuro,
  subAba,
  onSubAba,
}: DetalheIndicadorProps): JSX.Element {
  const serie = useMemo(() => montarSerieHistorica(indicador), [indicador]);
  const temGrafico = possuiDadosPlotaveis(serie);

  const numAtual = indicador.valoresNumericos[ANO_ATUAL];
  const numAnterior = indicador.valoresNumericos[ANO_ANTERIOR];
  const delta = formatarVariacao(numAtual, numAnterior, ANO_ANTERIOR);

  const statusAtual = serie.find((p) => p.ano === ANO_ATUAL)?.status ?? 'neutro';
  const temFaixas = possuiFaixasDiscretas(indicador.faixas);

  return (
    <div className="space-y-6">
      {/* --- Cabeçalho do indicador --------------------------------- */}
      <header className="cartao p-5">
        <h2 className="text-lg leading-snug font-bold text-balance text-rapi-600 sm:text-xl dark:text-rapi-400">
          {indicador.indicador}
        </h2>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="rotulo-campo">Órgão Responsável</dt>
            <dd className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              <span aria-hidden="true">🏛️ </span>
              {indicador.orgaoResponsavel}
            </dd>
          </div>

          <div className="lg:col-span-2">
            <dt className="rotulo-campo">Categorização</dt>
            <dd className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              <span aria-hidden="true">📂 </span>
              {ICONE_DIMENSAO[indicador.dimensao]} {indicador.dimensao} › {indicador.tema} ›{' '}
              {indicador.subtema}
            </dd>
          </div>

          <div>
            <dt className="rotulo-campo">Situação em {ANO_ATUAL}</dt>
            <dd className="mt-1 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <span
                aria-hidden="true"
                className="inline-block size-3 rounded-full"
                style={{ backgroundColor: CORES_SEMAFORO[corDoStatus(statusAtual)] }}
              />
              {ROTULOS_SEMAFORO[statusAtual]}
            </dd>
          </div>
        </dl>
      </header>

      {/* --- Métricas ----------------------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-3">
        <CartaoMetrica
          rotulo={`Resultado (${ANO_ANTERIOR})`}
          valor={ouND(indicador.dadosAnuais[ANO_ANTERIOR])}
          corAcento="#94a3b8"
        />

        <CartaoMetrica
          rotulo={`Resultado Atual (${ANO_ATUAL})`}
          valor={ouND(indicador.dadosAnuais[ANO_ATUAL])}
          delta={delta}
          corAcento="#1f77b4"
        />

        <CartaoMetrica
          rotulo={temFaixas ? 'Referência Ideal (Verde)' : 'Referência'}
          valor={
            indicador.faixas.verde ??
            indicador.faixas.geral ??
            'Sem valor de referência ou métrica qualitativa.'
          }
          corAcento={temFaixas ? CORES_SEMAFORO.verde : '#94a3b8'}
        />
      </div>

      {/* --- Sub-abas ------------------------------------------------ */}
      <div className="cartao overflow-hidden">
        <div
          role="tablist"
          aria-label="Detalhes do indicador"
          className="flex gap-1 overflow-x-auto border-b border-slate-200 px-2 pt-2 dark:border-slate-800"
        >
          {SUB_ABAS.map((aba) => {
            const ativa = aba.id === subAba;
            return (
              <button
                key={aba.id}
                type="button"
                role="tab"
                aria-selected={ativa}
                aria-controls={`sub-painel-${aba.id}`}
                id={`sub-aba-${aba.id}`}
                onClick={() => onSubAba(aba.id)}
                className={[
                  'flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition',
                  ativa
                    ? 'border-rapi-600 text-rapi-600 dark:border-rapi-400 dark:text-rapi-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100',
                ].join(' ')}
              >
                <span aria-hidden="true">{aba.icone}</span>
                {aba.rotulo}
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-5">
          {subAba === 'grafico' && (
            <div role="tabpanel" id="sub-painel-grafico" aria-labelledby="sub-aba-grafico">
              {temGrafico ? (
                <>
                  <GraficoEvolucao serie={serie} escuro={escuro} />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    A cor de cada barra reflete a regra de semaforização aplicada ao valor
                    daquele ano. A linha pontilhada indica a tendência da série.
                  </p>
                </>
              ) : (
                <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  ⚠️ Não foi possível gerar o gráfico de tendência. Valores em formato de texto
                  ou ND.
                </p>
              )}
            </div>
          )}

          {subAba === 'regras' && (
            <div role="tabpanel" id="sub-painel-regras" aria-labelledby="sub-aba-regras">
              <PainelFaixas indicador={indicador} />
            </div>
          )}

          {subAba === 'dados' && (
            <div role="tabpanel" id="sub-painel-dados" aria-labelledby="sub-aba-dados">
              <TabelaSerie serie={serie} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Traduz o status semafórico para a chave da paleta de cores. */
function corDoStatus(status: 'verde' | 'amarelo' | 'vermelho' | 'neutro'): keyof typeof CORES_SEMAFORO {
  return status === 'neutro' ? 'cinza' : status;
}

/**
 * Exibe as regras de semaforização cadastradas para o indicador.
 */
function PainelFaixas({ indicador }: { readonly indicador: IndicadorRAPI }): JSX.Element {
  const { faixas } = indicador;

  if (Object.keys(faixas).length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Nenhuma regra de semaforização cadastrada para este indicador.
      </p>
    );
  }

  // Indicadores com regra única descritiva (campo `geral`).
  if (!possuiFaixasDiscretas(faixas)) {
    return (
      <div className="rounded-lg border border-rapi-200 bg-rapi-50 px-4 py-3 dark:border-rapi-900 dark:bg-rapi-950/40">
        <p className="text-xs font-semibold tracking-wide text-rapi-700 uppercase dark:text-rapi-300">
          Critério geral
        </p>
        <p className="mt-1 text-sm text-rapi-900 dark:text-rapi-100">{faixas.geral}</p>
      </div>
    );
  }

  const blocos = [
    {
      chave: 'verde' as const,
      emoji: '🟢',
      rotulo: 'Verde',
      texto: faixas.verde,
      classe:
        'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100',
    },
    {
      chave: 'amarelo' as const,
      emoji: '🟡',
      rotulo: 'Amarelo',
      texto: faixas.amarelo,
      classe:
        'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
    },
    {
      chave: 'vermelho' as const,
      emoji: '🔴',
      rotulo: 'Vermelho',
      texto: faixas.vermelho,
      classe:
        'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {blocos.map((bloco) => (
        <div key={bloco.chave} className={`rounded-lg border px-4 py-3 ${bloco.classe}`}>
          <p className="text-sm font-semibold">
            <span aria-hidden="true">{bloco.emoji} </span>
            {bloco.rotulo}
          </p>
          <p className="mt-1.5 text-sm break-words">{bloco.texto ?? 'N/A'}</p>
        </div>
      ))}
    </div>
  );
}
