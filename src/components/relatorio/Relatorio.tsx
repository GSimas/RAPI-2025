/**
 * ==========================================================
 * Aba 3 - Relatório e Análises Completas
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
import {
  AGRADECIMENTOS_INTRO,
  BLOCOS_CONSIDERACOES,
  CONSIDERACOES_FINAIS,
  GRUPO_TRABALHO,
  INTRODUCAO_CONSIDERACOES,
  NOTA_LICENCA,
  type TemaAnalise,
} from '@/content/relatorio';
import { CartaoExpansivel } from '@/components/ui/CartaoExpansivel';

/**
 * Página completa de análises qualitativas do relatório.
 */
export function Relatorio(): JSX.Element {
  return (
    <div className="animate-fade-in space-y-10">
      {/* --- Seção 7 ------------------------------------------------- */}
      <section aria-labelledby="titulo-consideracoes">
        <h2 id="titulo-consideracoes" className="titulo-secao">
          7. Considerações e Recomendações
        </h2>

        <p className="texto-relatorio mt-3 max-w-4xl">{INTRODUCAO_CONSIDERACOES}</p>

        <div className="mt-6 space-y-4">
          {BLOCOS_CONSIDERACOES.map((bloco) => (
            <CartaoExpansivel
              key={bloco.id}
              icone={bloco.icone}
              titulo={`${bloco.numero} ${bloco.titulo}`}
              badge={`${bloco.temas.length} temas`}
              corAcento={bloco.corAcento}
            >
              <div className="space-y-6">
                {bloco.temas.map((tema) => (
                  <BlocoTema key={tema.id} tema={tema} />
                ))}
              </div>
            </CartaoExpansivel>
          ))}
        </div>
      </section>

      {/* --- Seção 8 ------------------------------------------------- */}
      <section
        aria-labelledby="titulo-finais"
        className="border-t border-slate-200 pt-8 dark:border-slate-800"
      >
        <h2 id="titulo-finais" className="titulo-secao">
          8. Considerações Finais
        </h2>

        <div className="mt-3 max-w-4xl space-y-3">
          {CONSIDERACOES_FINAIS.map((paragrafo, indice) => (
            <p key={indice} className="texto-relatorio">
              {paragrafo}
            </p>
          ))}
        </div>
      </section>

      {/* --- Seção 9 ------------------------------------------------- */}
      <section
        aria-labelledby="titulo-creditos"
        className="border-t border-slate-200 pt-8 dark:border-slate-800"
      >
        <h2 id="titulo-creditos" className="titulo-secao">
          9. Agradecimentos e Créditos
        </h2>

        <p className="texto-relatorio mt-3 max-w-4xl">{AGRADECIMENTOS_INTRO}</p>

        <h3 className="mt-6 text-base font-semibold text-slate-800 dark:text-slate-100">
          Grupo de Trabalho de Indicadores (RAPI 2024-2025)
        </h3>

        <dl className="mt-3 grid gap-4 lg:grid-cols-3">
          {GRUPO_TRABALHO.map((item) => (
            <div key={item.instituicao} className="cartao p-4">
              <dt className="text-sm font-semibold text-rapi-600 dark:text-rapi-400">
                {item.instituicao}
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {item.integrantes}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 text-sm text-slate-500 italic dark:text-slate-400">{NOTA_LICENCA}</p>
      </section>
    </div>
  );
}

/**
 * Bloco de análise de um tema (ex.: "7.1.1 Tema: Água").
 */
function BlocoTema({ tema }: { readonly tema: TemaAnalise }): JSX.Element {
  return (
    <article aria-labelledby={`tema-${tema.id}`}>
      <h4
        id={`tema-${tema.id}`}
        className="text-sm font-bold text-slate-800 sm:text-base dark:text-slate-100"
      >
        {tema.numero} {tema.titulo}
      </h4>

      <div className="mt-2 space-y-2.5">
        {tema.paragrafos.map((paragrafo, indice) => (
          <p key={indice} className="texto-relatorio">
            {paragrafo}
          </p>
        ))}
      </div>
    </article>
  );
}
