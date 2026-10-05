/**
 * ==========================================================
 * <Numeros /> e <Modulos /> - blocos da página inicial
 * ==========================================================
 *
 * - `<Numeros />`: faixa com as grandezas do relatório, com contagem
 *   animada.
 * - `<Modulos />`: grade de entradas para as demais páginas, no padrão
 *   "Quatro formas de ler..." dos dashboards Scientata.
 */

import { ArrowUpRight, ChartColumn, FileText, Sparkles, Table2, type LucideIcon } from 'lucide-react';
import type { JSX } from 'react';
import { Contador } from '@/components/ui/Contador';
import { Revelar, RevelarGrupo } from '@/components/ui/Revelar';
import { usePreferencias } from '@/hooks/usePreferencias';
import { TOTAL_INDICADORES } from '@/lib/dataset';
import { PAGINAS, type IdPagina } from '@/lib/navegacao';

/** Valores das grandezas, na ordem dos rótulos de `TEXTOS.numeros.itens`. */
const VALORES = [TOTAL_INDICADORES, 3, 12, 25, 9] as const;

/**
 * Faixa de números do relatório.
 */
export function Numeros(): JSX.Element {
  const { t } = usePreferencias();

  return (
    <RevelarGrupo className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
      {t.numeros.itens.map((item, indice) => (
        <Revelar
          key={indice}
          emGrupo
          className={[
            'bg-canvas',
            // A última célula ocupa a linha inteira quando a grade tem 2 colunas.
            indice === VALORES.length - 1 ? 'col-span-2 sm:col-span-1' : '',
          ].join(' ')}
        >
          <div data-brilho className="h-full bg-surface/70 px-5 py-6 [--brilho-forca:0.08] [--brilho-raio:260px]">
            <p className="rotulo">
              {String(indice + 1).padStart(2, '0')} · {item.rotulo}
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">
              <Contador
                valor={VALORES[indice] ?? 0}
                sufixo={indice === VALORES.length - 1 ? t.numeros.sufixoEdicao : ''}
              />
            </p>
            <p className="mt-1.5 text-xs text-faint">{item.nota}</p>
          </div>
        </Revelar>
      ))}
    </RevelarGrupo>
  );
}

/** Ícone de cada módulo. */
const ICONES: Readonly<Record<Exclude<IdPagina, 'apresentacao'>, LucideIcon>> = {
  dashboard: ChartColumn,
  relatorio: FileText,
  explorador: Table2,
  assistente: Sparkles,
};

interface ModulosProps {
  readonly onNavegar: (id: IdPagina) => void;
}

/**
 * Grade de entradas para as páginas da aplicação.
 */
export function Modulos({ onNavegar }: ModulosProps): JSX.Element {
  const { t } = usePreferencias();
  const tm = t.modulos;
  const modulos = PAGINAS.filter(
    (pagina): pagina is (typeof PAGINAS)[number] & { id: Exclude<IdPagina, 'apresentacao'> } => pagina.id !== 'apresentacao',
  );

  return (
    <section aria-labelledby="titulo-modulos">
      <Revelar className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <h2 id="titulo-modulos" className="text-4xl leading-[1] font-semibold tracking-[-0.035em] text-ink sm:text-5xl">
          {tm.titulo} <span className="serif text-signal">{tm.destaque}</span>
        </h2>
        <p className="max-w-md text-muted lg:justify-self-end">{tm.descricao}</p>
      </Revelar>

      <RevelarGrupo className="mt-10 grid gap-px border border-line bg-line md:grid-cols-2">
        {modulos.map((pagina) => {
          const Icone = ICONES[pagina.id];
          const textos = tm.itens[pagina.id];
          return (
            <Revelar key={pagina.id} emGrupo className="bg-canvas">
              <button
                type="button"
                onClick={() => onNavegar(pagina.id)}
                className="group flex h-full w-full flex-col bg-surface/70 p-6 text-left sm:p-8"
                style={{ ['--brilho-raio' as string]: '420px', ['--brilho-forca' as string]: 0.1 }}
              >
                <span className="flex items-center justify-between">
                  <span className="rotulo text-signal">
                    {pagina.numero} · {t.paginas[pagina.id].rotulo}
                  </span>
                  <Icone
                    aria-hidden="true"
                    className="size-4 text-faint transition-all duration-500 ease-scientata group-hover:scale-110 group-hover:text-signal"
                  />
                </span>

                <span className="mt-10 block text-2xl font-semibold tracking-[-0.025em] text-ink transition-transform duration-500 ease-scientata group-hover:translate-x-1 sm:text-3xl">
                  {textos.titulo} <span className="serif text-signal">{textos.destaque}</span>
                </span>

                <span className="mt-3 block max-w-md text-sm leading-relaxed text-muted">{textos.descricao}</span>

                <span className="rotulo mt-8 inline-flex items-center gap-1.5 text-faint transition-colors duration-300 group-hover:text-signal">
                  {pagina.id === 'assistente' ? tm.abrirAssistente : tm.abrir}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </button>
            </Revelar>
          );
        })}
      </RevelarGrupo>
    </section>
  );
}
