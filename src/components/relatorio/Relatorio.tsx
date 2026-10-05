/**
 * ==========================================================
 * Página - Relatório e Análises
 * ==========================================================
 *
 * Renderização modular das seções qualitativas do RAPI:
 * - 7. Considerações e Recomendações (por dimensão, em blocos expansíveis);
 * - 8. Considerações Finais;
 * - 9. Agradecimentos e Créditos.
 *
 * O conteúdo vem de `@/content/relatorio` como dado estruturado — sem
 * blocos de HTML bruto, ao contrário do `unsafe_allow_html` original.
 */

import type { JSX } from 'react';
import { useConteudoRelatorio } from '@/content/conteudoRelatorio';
import type { TemaAnalise } from '@/content/relatorio';
import { AvisoTraducao } from '@/components/ui/AvisoTraducao';
import { usePreferencias } from '@/hooks/usePreferencias';
import { CartaoExpansivel } from '@/components/ui/CartaoExpansivel';
import { Revelar, RevelarGrupo } from '@/components/ui/Revelar';
import { CabecalhoSecao, TituloPagina } from '@/components/ui/Titulos';
import type { DefinicaoPagina } from '@/lib/navegacao';

interface RelatorioProps {
  readonly pagina: DefinicaoPagina;
  readonly onInicio: () => void;
}

/**
 * Página completa de análises qualitativas do relatório.
 */
export function Relatorio({ pagina, onInicio }: RelatorioProps): JSX.Element {
  const { t } = usePreferencias();
  const tr = t.relatorio;
  const {
    AGRADECIMENTOS_INTRO,
    BLOCOS_CONSIDERACOES,
    CONSIDERACOES_FINAIS,
    GRUPO_TRABALHO,
    INTRODUCAO_CONSIDERACOES,
    NOTA_LICENCA,
  } = useConteudoRelatorio();

  return (
    <div>
      <TituloPagina pagina={pagina} onInicio={onInicio}>
        <AvisoTraducao />
      </TituloPagina>

      <div className="space-y-24">
        {/* --- Seção 7 ----------------------------------------------- */}
        <section aria-labelledby="titulo-consideracoes">
          <Revelar>
            <CabecalhoSecao
              id="titulo-consideracoes"
              rotulo={tr.s7.rotulo}
              titulo={tr.s7.titulo}
              destaque={tr.s7.destaque}
            >
              <p className="texto-relatorio">{INTRODUCAO_CONSIDERACOES}</p>
            </CabecalhoSecao>
          </Revelar>

          <RevelarGrupo className="mt-10 space-y-3">
            {BLOCOS_CONSIDERACOES.map((bloco) => (
              <Revelar key={bloco.id} emGrupo>
                <CartaoExpansivel
                  rotulo={`${bloco.numero} · ${tr.temas(bloco.temas.length)}`}
                  titulo={bloco.titulo}
                  corAcento={bloco.corAcento}
                >
                  <div className="divide-y divide-line">
                    {bloco.temas.map((tema) => (
                      <BlocoTema key={tema.id} tema={tema} />
                    ))}
                  </div>
                </CartaoExpansivel>
              </Revelar>
            ))}
          </RevelarGrupo>
        </section>

        {/* --- Seção 8 ----------------------------------------------- */}
        <section aria-labelledby="titulo-finais">
          <Revelar>
            <CabecalhoSecao
              id="titulo-finais"
              rotulo={tr.s8.rotulo}
              titulo={tr.s8.titulo}
              destaque={tr.s8.destaque}
            />
          </Revelar>

          <Revelar className="mt-10 grid gap-6 border-t border-line pt-10 lg:grid-cols-[18rem_1fr] lg:gap-12">
            <p className="rotulo text-signal">08</p>
            <div className="max-w-3xl space-y-4">
              {CONSIDERACOES_FINAIS.map((paragrafo, indice) => (
                <p key={indice} className="texto-relatorio">
                  {paragrafo}
                </p>
              ))}
            </div>
          </Revelar>
        </section>

        {/* --- Seção 9 ----------------------------------------------- */}
        <section aria-labelledby="titulo-creditos">
          <Revelar>
            <CabecalhoSecao
              id="titulo-creditos"
              rotulo={tr.s9.rotulo}
              titulo={tr.s9.titulo}
              destaque={tr.s9.destaque}
            >
              <p className="texto-relatorio">{AGRADECIMENTOS_INTRO}</p>
            </CabecalhoSecao>
          </Revelar>

          <Revelar className="mt-10">
            <h3 className="rotulo">{tr.grupoTrabalho}</h3>
          </Revelar>

          <RevelarGrupo className="mt-4 grid gap-px border border-line bg-line lg:grid-cols-3">
            {GRUPO_TRABALHO.map((item, indice) => (
              <Revelar key={item.instituicao} emGrupo className="bg-canvas">
                <div
                  data-brilho
                  className="h-full bg-surface/80 p-6 [--brilho-forca:0.08] [--brilho-raio:320px]"
                >
                  <p className="rotulo text-signal">{String(indice + 1).padStart(2, '0')}</p>
                  <p className="mt-3 text-lg font-semibold tracking-[-0.015em] text-ink">
                    {item.instituicao}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.integrantes}</p>
                </div>
              </Revelar>
            ))}
          </RevelarGrupo>

          <Revelar>
            <p className="serif mt-8 max-w-3xl text-xl leading-snug text-muted">{NOTA_LICENCA}</p>
          </Revelar>
        </section>
      </div>
    </div>
  );
}

/**
 * Bloco de análise de um tema (ex.: "7.1.1 Tema: Água").
 */
function BlocoTema({ tema }: { readonly tema: TemaAnalise }): JSX.Element {
  const { t } = usePreferencias();
  return (
    <article
      aria-labelledby={`tema-${tema.id}`}
      className="grid gap-3 py-6 first:pt-1 last:pb-1 md:grid-cols-[12rem_1fr] md:gap-8"
    >
      <div>
        <p className="rotulo text-signal">{tema.numero}</p>
        <h4 id={`tema-${tema.id}`} className="mt-1.5 text-base leading-snug font-semibold text-ink">
          {tema.titulo.replace(t.relatorio.prefixoTema, '')}
        </h4>
      </div>

      <div className="space-y-3">
        {tema.paragrafos.map((paragrafo, indice) => (
          <p key={indice} className="texto-relatorio text-base">
            {paragrafo}
          </p>
        ))}
      </div>
    </article>
  );
}
