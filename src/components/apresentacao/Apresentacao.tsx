/**
 * ==========================================================
 * Página inicial - Apresentação
 * ==========================================================
 *
 * Abre com o hero, a faixa de números e a grade de módulos; em seguida
 * reúne as Seções 1 a 5 do relatório:
 * - Seções 1, 2 e 3 em formato editorial (rótulo à esquerda, texto à direita);
 * - Seção 4 nos três cards expansíveis das dimensões;
 * - Seção 5 com a legenda proporcional e o gráfico de evolução.
 */

import { motion } from 'motion/react';
import { useRef, type JSX } from 'react';
import { BotaoBaixarPng } from '@/components/ui/BotaoBaixarPng';
import { useConteudoApresentacao } from '@/content';
import { AvisoTraducao } from '@/components/ui/AvisoTraducao';
import { usePreferencias } from '@/hooks/usePreferencias';
import { TOTAL_INDICADORES } from '@/lib/dataset';
import { EASE_SCIENTATA } from '@/lib/movimento';
import type { IdPagina } from '@/lib/navegacao';
import { CartaoExpansivel } from '@/components/ui/CartaoExpansivel';
import { Revelar, RevelarGrupo } from '@/components/ui/Revelar';
import { TextoRico } from '@/components/ui/TextoRico';
import { CabecalhoSecao } from '@/components/ui/Titulos';
import { GraficoSemaforizacao } from './GraficoSemaforizacao';
import { Hero } from './Hero';
import { Modulos, Numeros } from './Modulos';

interface ApresentacaoProps {
  readonly escuro: boolean;
  readonly onNavegar: (id: IdPagina) => void;
}

/**
 * Página de abertura do dashboard.
 */
export function Apresentacao({ escuro, onNavegar }: ApresentacaoProps): JSX.Element {
  const refGrafico = useRef<HTMLElement>(null);
  const { t } = usePreferencias();
  const ta = t.apresentacao;
  const { SECOES_INTRODUTORIAS, CARDS_DIMENSOES, LEGENDA_SEMAFORO } = useConteudoApresentacao();

  return (
    <div>
      <Hero onNavegar={onNavegar} />

      <div className="space-y-28 sm:space-y-36">
        <Numeros />

        <Modulos onNavegar={onNavegar} />

        {/* --- Seções 1-3 -------------------------------------------- */}
        <section aria-labelledby="titulo-sobre">
          <Revelar>
            <CabecalhoSecao
              id="titulo-sobre"
              rotulo={ta.sobre.rotulo}
              titulo={ta.sobre.titulo}
              destaque={ta.sobre.destaque}
            >
              <AvisoTraducao />
            </CabecalhoSecao>
          </Revelar>

          <div className="mt-12 border-t border-line">
            {SECOES_INTRODUTORIAS.map((secao) => (
              <Revelar
                key={secao.id}
                className="grid gap-4 border-b border-line py-10 lg:grid-cols-[18rem_1fr] lg:gap-12"
              >
                <div>
                  <p className="rotulo text-signal">{secao.numero.padStart(2, '0')}</p>
                  <h3
                    id={`titulo-${secao.id}`}
                    className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink"
                  >
                    {secao.titulo}
                  </h3>
                </div>
                <div className="max-w-3xl space-y-4">
                  {secao.paragrafos.map((paragrafo, indice) => (
                    <p key={indice} className="texto-relatorio">
                      <TextoRico texto={paragrafo} />
                    </p>
                  ))}
                </div>
              </Revelar>
            ))}
          </div>
        </section>

        {/* --- Seção 4: estrutura analítica --------------------------- */}
        <section aria-labelledby="titulo-estrutura">
          <Revelar>
            <CabecalhoSecao
              id="titulo-estrutura"
              rotulo={ta.estrutura.rotulo}
              titulo={ta.estrutura.titulo}
              destaque={ta.estrutura.destaque}
            >
              {ta.estrutura.texto}
            </CabecalhoSecao>
          </Revelar>

          <RevelarGrupo className="mt-10 grid items-start gap-4 lg:grid-cols-3">
            {CARDS_DIMENSOES.map((card) => (
              <Revelar key={card.id} emGrupo>
                <CartaoExpansivel
                  rotulo={ta.indicadores(card.totalIndicadores)}
                  titulo={card.titulo}
                  corAcento={card.corAcento}
                >
                  <dl className="space-y-4">
                    {card.grupos.map((grupo) => (
                      <div key={grupo.titulo} className="border-l border-line pl-3">
                        <dt className="text-sm font-semibold text-ink">{grupo.titulo}</dt>
                        {grupo.detalhe && (
                          <dd className="mt-1 text-sm leading-relaxed text-muted">
                            {grupo.detalhe}
                          </dd>
                        )}
                      </div>
                    ))}
                  </dl>
                </CartaoExpansivel>
              </Revelar>
            ))}
          </RevelarGrupo>
        </section>

        {/* --- Seção 5: semaforização --------------------------------- */}
        <section aria-labelledby="titulo-semaforizacao">
          <Revelar>
            <CabecalhoSecao
              id="titulo-semaforizacao"
              rotulo={ta.semaforo.rotulo}
              titulo={ta.semaforo.titulo}
              destaque={ta.semaforo.destaque}
            >
              {ta.semaforo.texto(TOTAL_INDICADORES)}
            </CabecalhoSecao>
          </Revelar>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.35fr]">
            <RevelarGrupo className="card divide-y divide-line">
              {LEGENDA_SEMAFORO.map((linha) => (
                <Revelar key={linha.rotulo} emGrupo>
                  <div data-brilho className="px-5 py-4 [--brilho-forca:0.06] [--brilho-raio:300px]">
                    <div className="flex items-baseline gap-3">
                      <span
                        aria-hidden="true"
                        className="size-2.5 shrink-0 translate-y-[-1px]"
                        style={{ backgroundColor: linha.cor }}
                      />
                      <span className="flex-1 text-sm font-semibold text-ink">{linha.rotulo}</span>
                      <span className="font-mono text-2xl tracking-[-0.02em] text-ink tabular-nums">
                        {linha.quantidade}
                      </span>
                    </div>
                    <p className="mt-1 pl-5.5 text-sm text-muted">{linha.descricao}</p>

                    {/* Barra proporcional ao total de indicadores. */}
                    <div className="mt-3 ml-5.5 h-1 bg-line" aria-hidden="true">
                      <motion.div
                        className="h-full origin-left"
                        style={{
                          backgroundColor: linha.cor,
                          width: `${(linha.quantidade / TOTAL_INDICADORES) * 100}%`,
                        }}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: EASE_SCIENTATA, delay: 0.2 }}
                      />
                    </div>
                  </div>
                </Revelar>
              ))}
            </RevelarGrupo>

            <Revelar atraso={0.1}>
              <figure ref={refGrafico} className="card h-full">
                <figcaption className="card-titulo">
                  <span className="text-signal">A</span> · {ta.grafico.titulo}
                  <BotaoBaixarPng alvo={refGrafico} nomeArquivo="rapi-evolucao-semaforizacao" />
                </figcaption>
                <div className="p-4 sm:p-5">
                  <GraficoSemaforizacao escuro={escuro} />
                  <p className="mt-3 text-xs text-faint">
                    {ta.grafico.legenda}
                  </p>
                </div>
              </figure>
            </Revelar>
          </div>
        </section>
      </div>
    </div>
  );
}
