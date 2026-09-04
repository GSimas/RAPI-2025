/**
 * ==========================================================
 * Aba 1 - Apresentação (página inicial)
 * ==========================================================
 *
 * Reúne as Seções 1 a 5 do relatório:
 * - Seções 1, 2 e 3 em coluna de texto;
 * - Seção 5 com a legenda e o gráfico de evolução da semaforização;
 * - Seção 4 nos três cards expansíveis das dimensões.
 */

import type { JSX } from 'react';
import { CARDS_DIMENSOES, LEGENDA_SEMAFORO, SECOES_INTRODUTORIAS } from '@/content/apresentacao';
import { TOTAL_INDICADORES } from '@/lib/dataset';
import { CartaoExpansivel } from '@/components/ui/CartaoExpansivel';
import { TextoRico } from '@/components/ui/TextoRico';
import { GraficoSemaforizacao } from './GraficoSemaforizacao';

interface ApresentacaoProps {
  readonly escuro: boolean;
}

/**
 * Página de abertura do dashboard.
 */
export function Apresentacao({ escuro }: ApresentacaoProps): JSX.Element {
  return (
    <div className="animate-fade-in space-y-10">
      {/* --- Título ------------------------------------------------- */}
      <header>
        <p className="text-sm font-semibold tracking-widest text-rapi-600 uppercase dark:text-rapi-400">
          Florianópolis · 9ª edição
        </p>
        <h2 className="mt-2 text-2xl font-bold text-balance text-slate-900 sm:text-3xl lg:text-4xl dark:text-slate-50">
          Relatório Anual de Progresso dos Indicadores (RAPI) 2024-2025
        </h2>
        <p className="mt-3 max-w-3xl text-base text-slate-600 dark:text-slate-400">
          Um panorama técnico e imparcial da sustentabilidade ambiental, urbana e fiscal da
          cidade, apoiado em {TOTAL_INDICADORES} indicadores monitorados desde 2017.
        </p>
      </header>

      {/* --- Seções 1-3 + Seção 5 ----------------------------------- */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-7">
          {SECOES_INTRODUTORIAS.map((secao) => (
            <section key={secao.id} aria-labelledby={`titulo-${secao.id}`}>
              <h3 id={`titulo-${secao.id}`} className="titulo-secao">
                {secao.numero}. {secao.titulo}
              </h3>
              <div className="mt-3 space-y-3">
                {secao.paragrafos.map((paragrafo, indice) => (
                  <p key={indice} className="texto-relatorio">
                    <TextoRico texto={paragrafo} />
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section aria-labelledby="titulo-semaforizacao" className="space-y-4">
          <h3 id="titulo-semaforizacao" className="titulo-secao">
            5. Semaforização dos Indicadores
          </h3>

          <p className="texto-relatorio">
            Numa visão geral, os 205 indicadores de 2024-2025 foram classificados da seguinte
            forma:
          </p>

          <ul className="space-y-2">
            {LEGENDA_SEMAFORO.map((linha) => (
              <li
                key={linha.rotulo}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900"
              >
                <span
                  aria-hidden="true"
                  className="mt-1 size-3 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-900"
                  style={{ backgroundColor: linha.cor }}
                />
                <span className="text-sm leading-snug text-slate-700 dark:text-slate-300">
                  <strong className="font-semibold text-slate-900 dark:text-slate-100">
                    {linha.rotulo} ({linha.quantidade})
                  </strong>
                  : {linha.descricao}
                </span>
              </li>
            ))}
          </ul>

          <figure className="cartao p-4">
            <figcaption className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              Evolução Histórica da Semaforização
            </figcaption>
            <GraficoSemaforizacao escuro={escuro} />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Quantidade de indicadores por classificação, de 2020 a 2024 (Tabela 5.1 do
              relatório).
            </p>
          </figure>
        </section>
      </div>

      {/* --- Seção 4: estrutura analítica --------------------------- */}
      <section aria-labelledby="titulo-estrutura" className="border-t border-slate-200 pt-8 dark:border-slate-800">
        <h3 id="titulo-estrutura" className="titulo-secao">
          4. Estrutura Analítica do RAPI 2024-2025
        </h3>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          O relatório é dividido em 3 grandes dimensões, subdivididas em 12 pilares e 25 temas.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {CARDS_DIMENSOES.map((card) => (
            <CartaoExpansivel
              key={card.id}
              icone={card.icone}
              titulo={card.titulo}
              badge={`${card.totalIndicadores} indicadores`}
              corAcento={card.corAcento}
            >
              <dl className="space-y-3">
                {card.grupos.map((grupo) => (
                  <div key={grupo.titulo}>
                    <dt className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {grupo.titulo}
                    </dt>
                    {grupo.detalhe && (
                      <dd className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                        {grupo.detalhe}
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
            </CartaoExpansivel>
          ))}
        </div>
      </section>
    </div>
  );
}
