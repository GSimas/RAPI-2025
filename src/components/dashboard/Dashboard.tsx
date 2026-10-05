/**
 * ==========================================================
 * Página - Dashboard Interativo
 * ==========================================================
 *
 * Reúne, para o indicador selecionado:
 * - cabeçalho com órgão responsável, categorização e situação atual;
 * - três métricas (2023, 2024 com variação, referência ideal);
 * - abas internas com o gráfico de evolução, as regras de semaforização
 *   e os dados brutos — espelhando os `st.tabs` internos do original.
 *
 * Trocar de indicador ou de aba interna é animado: o bloco anterior sai
 * e o novo entra, sem saltos de layout.
 */

import { TriangleAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { lazy, Suspense, useMemo, useRef, useState, type JSX } from 'react';
import { BotaoBaixarPng } from '@/components/ui/BotaoBaixarPng';
import { Segmentado, type OpcaoSegmentado } from '@/components/ui/Segmentado';
import { LimiteErro } from '@/components/ui/LimiteErro';
import { TituloPagina } from '@/components/ui/Titulos';
import { useFiltros } from '@/hooks/useFiltros';
import { slugArquivo } from '@/lib/csv';
import { formatarVariacao, ouND } from '@/lib/format';
import { EASE_SCIENTATA } from '@/lib/movimento';
import type { DefinicaoPagina } from '@/lib/navegacao';
import { CORES_SEMAFORO, possuiFaixasDiscretas } from '@/lib/semaforo';
import { usePreferencias } from '@/hooks/usePreferencias';
import { montarSerieHistorica, possuiDadosPlotaveis } from '@/lib/serie';
import { ANO_ANTERIOR, ANO_ATUAL, type IndicadorRAPI } from '@/types/rapi';
import { CartaoMetrica } from './CartaoMetrica';
import { PainelFiltros } from './PainelFiltros';
import { TabelaSerie } from './TabelaSerie';

// O recharts não bloqueia o restante do Dashboard (cabeçalho, filtros e
// métricas pintam antes); o gráfico chega em seguida, com a altura reservada.
const GraficoEvolucao = lazy(() => import('./GraficoEvolucao').then((m) => ({ default: m.GraficoEvolucao })));

interface DashboardProps {
  readonly escuro: boolean;
  readonly pagina: DefinicaoPagina;
  readonly onInicio: () => void;
}

/** Identificadores das abas internas do dashboard. */
type SubAba = 'grafico' | 'regras' | 'dados';


/** Entrada/saída dos blocos trocados (indicador e aba interna). */
const TROCA = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_SCIENTATA } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2 } },
} as const;

/**
 * Painel analítico de um indicador, com filtros encadeados.
 */
export function Dashboard({ escuro, pagina, onInicio }: DashboardProps): JSX.Element {
  const filtros = useFiltros();
  const [subAba, setSubAba] = useState<SubAba>('grafico');
  const indicador = filtros.indicador;
  const { t } = usePreferencias();

  return (
    <div>
      <TituloPagina pagina={pagina} onInicio={onInicio} />

      <div className="space-y-6">
        <PainelFiltros filtros={filtros} />

        <AnimatePresence mode="wait" initial={false}>
          {indicador ? (
            <motion.div key={indicador.id} {...TROCA}>
              <DetalheIndicador
                indicador={indicador}
                escuro={escuro}
                subAba={subAba}
                onSubAba={setSubAba}
              />
            </motion.div>
          ) : (
            <motion.p key="vazio" {...TROCA} className="card p-8 text-center text-muted">
              {t.dashboard.nenhum}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
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
function DetalheIndicador({ indicador, escuro, subAba, onSubAba }: DetalheIndicadorProps): JSX.Element {
  const serie = useMemo(() => montarSerieHistorica(indicador), [indicador]);
  const refGrafico = useRef<HTMLElement>(null);
  const temGrafico = possuiDadosPlotaveis(serie);

  const numAtual = indicador.valoresNumericos[ANO_ATUAL];
  const numAnterior = indicador.valoresNumericos[ANO_ANTERIOR];
  const delta = formatarVariacao(numAtual, numAnterior, ANO_ANTERIOR);

  const statusAtual = serie.find((p) => p.ano === ANO_ATUAL)?.status ?? 'neutro';
  const corAtual = CORES_SEMAFORO[statusAtual === 'neutro' ? 'cinza' : statusAtual];
  const temFaixas = possuiFaixasDiscretas(indicador.faixas);
  const { t } = usePreferencias();
  const td = t.dashboard;
  const subAbas: readonly OpcaoSegmentado<SubAba>[] = [
    { id: 'grafico', rotulo: td.subabas.grafico },
    { id: 'regras', rotulo: td.subabas.regras },
    { id: 'dados', rotulo: td.subabas.dados },
  ];

  return (
    <div className="space-y-6">
      {/* --- Cabeçalho do indicador --------------------------------- */}
      <header className="card">
        <p className="card-titulo">
          <span className="text-signal">B</span> · {td.selecionado}
        </p>

        <div className="p-5 sm:p-6">
          <h2 className="max-w-4xl text-2xl leading-snug font-semibold tracking-[-0.025em] text-balance text-ink sm:text-3xl">
            {indicador.indicador}
          </h2>

          <dl className="mt-6 grid gap-5 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-[1fr_2fr_auto]">
            <div>
              <dt className="rotulo">{td.orgao}</dt>
              <dd className="mt-1.5 text-sm text-ink/85">{indicador.orgaoResponsavel}</dd>
            </div>

            <div>
              <dt className="rotulo">{td.categorizacao}</dt>
              <dd className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/85">
                {[indicador.dimensao, indicador.tema, indicador.subtema].map((nivel, indice) => (
                  <span key={`${nivel}-${indice}`} className="inline-flex items-center gap-2">
                    {indice > 0 && (
                      <span aria-hidden="true" className="text-faint">
                        /
                      </span>
                    )}
                    {nivel}
                  </span>
                ))}
              </dd>
            </div>

            <div>
              <dt className="rotulo">{td.situacao(ANO_ATUAL)}</dt>
              <dd className="mt-1.5">
                <span
                  className="inline-flex items-center gap-2 border px-2.5 py-1 font-mono text-xs"
                  style={{
                    borderColor: `color-mix(in srgb, ${corAtual} 45%, transparent)`,
                    color: corAtual,
                  }}
                >
                  <span className="relative flex size-2">
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 animate-ping opacity-60"
                      style={{ backgroundColor: corAtual }}
                    />
                    <span aria-hidden="true" className="relative size-2" style={{ backgroundColor: corAtual }} />
                  </span>
                  {t.semaforo.rotulos[statusAtual]}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {/* --- Métricas ----------------------------------------------- */}
      <div className="grid gap-px border border-line bg-line lg:grid-cols-3">
        <CartaoMetrica
          rotulo={`01 · ${td.resultado(ANO_ANTERIOR)}`}
          valor={ouND(indicador.dadosAnuais[ANO_ANTERIOR])}
          corAcento="var(--faint)"
        />
        <CartaoMetrica
          rotulo={`02 · ${td.resultado(ANO_ATUAL)}`}
          valor={ouND(indicador.dadosAnuais[ANO_ATUAL])}
          delta={delta}
          corAcento="var(--signal-fill)"
        />
        <CartaoMetrica
          rotulo={`03 · ${temFaixas ? td.referenciaIdeal : td.referencia}`}
          valor={
            indicador.faixas.verde ??
            indicador.faixas.geral ??
            td.semReferencia
          }
          corAcento={temFaixas ? CORES_SEMAFORO.verde : 'var(--faint)'}
        />
      </div>

      {/* --- Abas internas ------------------------------------------- */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
          <span className="rotulo hidden lg:inline">
            <span className="text-signal">C</span> · {td.detalhes}
          </span>
          {/* `min-w-0 max-w-full`: no celular a barra rola dentro do card em vez de alargar a página. */}
          <div className="min-w-0 max-w-full lg:ml-auto">
            <Segmentado
              opcoes={subAbas}
              ativa={subAba}
              onChange={onSubAba}
              rotulo={td.detalhesAria}
              prefixo="detalhe"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={subAba}
              role="tabpanel"
              id={`detalhe-painel-${subAba}`}
              aria-labelledby={`detalhe-aba-${subAba}`}
              {...TROCA}
            >
              {subAba === 'grafico' &&
                (temGrafico ? (
                  <figure ref={refGrafico} className="p-1">
                    <figcaption className="mb-4 flex items-start gap-4">
                      <span className="min-w-0">
                        <span className="rotulo block">{td.evolucao} · {indicador.tema}</span>
                        <span className="mt-1 block text-sm font-semibold text-ink">
                          {indicador.indicador}
                        </span>
                      </span>
                      <BotaoBaixarPng
                        alvo={refGrafico}
                        nomeArquivo={`rapi-${slugArquivo(indicador.indicador)}`}
                      />
                    </figcaption>
                    <LimiteErro className="h-[420px]">
                      <Suspense fallback={<div className="h-[420px] w-full" />}>
                        <GraficoEvolucao serie={serie} escuro={escuro} titulo={indicador.indicador} />
                      </Suspense>
                    </LimiteErro>
                    <p className="mt-3 text-xs text-faint">
                      {td.notaGrafico}
                    </p>
                  </figure>
                ) : (
                  <p className="flex items-start gap-3 border border-semaforo-amarelo/40 bg-semaforo-amarelo/5 px-4 py-3 text-sm text-ink/85">
                    <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-semaforo-amarelo" />
                    {td.semGrafico}
                  </p>
                ))}

              {subAba === 'regras' && <PainelFaixas indicador={indicador} />}

              {subAba === 'dados' && <TabelaSerie serie={serie} indicador={indicador.indicador} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/**
 * Exibe as regras de semaforização cadastradas para o indicador.
 */
function PainelFaixas({ indicador }: { readonly indicador: IndicadorRAPI }): JSX.Element {
  const { faixas } = indicador;
  const { t } = usePreferencias();

  if (Object.keys(faixas).length === 0) {
    return (
      <p className="text-sm text-muted">
        {t.dashboard.semRegras}
      </p>
    );
  }

  // Indicadores com regra única descritiva (campo `geral`).
  if (!possuiFaixasDiscretas(faixas)) {
    return (
      <div className="border border-signal/30 bg-signal/5 px-5 py-4">
        <p className="rotulo text-signal">{t.dashboard.criterioGeral}</p>
        <p className="mt-2 text-sm text-ink">{faixas.geral}</p>
      </div>
    );
  }

  const blocos = [
    { chave: 'verde', rotulo: t.semaforo.cores.verde, texto: faixas.verde, cor: CORES_SEMAFORO.verde },
    { chave: 'amarelo', rotulo: t.semaforo.cores.amarelo, texto: faixas.amarelo, cor: CORES_SEMAFORO.amarelo },
    { chave: 'vermelho', rotulo: t.semaforo.cores.vermelho, texto: faixas.vermelho, cor: CORES_SEMAFORO.vermelho },
  ] as const;

  return (
    <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
      {blocos.map((bloco, indice) => (
        <motion.div
          key={bloco.chave}
          data-brilho
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_SCIENTATA, delay: indice * 0.08 }}
          className="bg-surface px-5 py-5 [--brilho-forca:0.07] [--brilho-raio:260px]"
          style={{ boxShadow: `inset 0 2px 0 ${bloco.cor}` }}
        >
          <p className="rotulo flex items-center gap-2">
            <span aria-hidden="true" className="size-2" style={{ backgroundColor: bloco.cor }} />
            {bloco.rotulo}
          </p>
          <p className="mt-3 text-sm break-words text-ink">{bloco.texto ?? 'N/A'}</p>
        </motion.div>
      ))}
    </div>
  );
}
