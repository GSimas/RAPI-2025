/**
 * ==========================================================
 * <BolhaMensagem /> - uma mensagem do chat
 * ==========================================================
 *
 * O Gemini responde em Markdown leve. Em vez de embutir um parser
 * completo (e HTML bruto), renderizamos aqui o subconjunto que o modelo
 * de fato usa: parágrafos, listas, títulos e ênfase — tudo como elementos
 * React, sem `dangerouslySetInnerHTML`.
 */

import { Fragment, type JSX } from 'react';
import type { MensagemChat } from '@/types/rapi';

interface BolhaMensagemProps {
  readonly mensagem: MensagemChat;
}

/** Captura trechos `**negrito**`, `*itálico*` e `` `código` ``. */
const PADRAO_INLINE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;

/**
 * Converte marcações inline de Markdown em elementos React.
 */
function InlineMarkdown({ texto }: { readonly texto: string }): JSX.Element {
  const partes = texto.split(PADRAO_INLINE);

  return (
    <>
      {partes.map((parte, indice) => {
        if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) {
          return (
            <strong key={indice} className="font-semibold">
              {parte.slice(2, -2)}
            </strong>
          );
        }
        if (parte.startsWith('`') && parte.endsWith('`') && parte.length > 2) {
          return (
            <code
              key={indice}
              className="rounded bg-slate-200/70 px-1 py-0.5 font-mono text-[0.85em] dark:bg-slate-700/70"
            >
              {parte.slice(1, -1)}
            </code>
          );
        }
        if (parte.startsWith('*') && parte.endsWith('*') && parte.length > 2) {
          return <em key={indice}>{parte.slice(1, -1)}</em>;
        }
        return <Fragment key={indice}>{parte}</Fragment>;
      })}
    </>
  );
}

/**
 * Renderiza o corpo da mensagem em blocos: títulos, listas e parágrafos.
 */
function CorpoMarkdown({ texto }: { readonly texto: string }): JSX.Element {
  const linhas = texto.split('\n');
  const blocos: JSX.Element[] = [];

  let itensLista: string[] = [];

  /** Fecha a lista acumulada, se houver, e a adiciona aos blocos. */
  const fecharLista = (): void => {
    if (itensLista.length === 0) return;

    blocos.push(
      <ul key={`lista-${blocos.length}`} className="ml-4 list-disc space-y-1">
        {itensLista.map((item, indice) => (
          <li key={indice}>
            <InlineMarkdown texto={item} />
          </li>
        ))}
      </ul>,
    );
    itensLista = [];
  };

  for (const linha of linhas) {
    const limpa = linha.trim();

    if (limpa === '') {
      fecharLista();
      continue;
    }

    // Itens de lista: "- item", "* item" ou "1. item".
    const itemLista = /^(?:[-*•]|\d+\.)\s+(.*)$/.exec(limpa);
    if (itemLista?.[1]) {
      itensLista.push(itemLista[1]);
      continue;
    }

    fecharLista();

    // Títulos "## Texto".
    const titulo = /^(#{1,4})\s+(.*)$/.exec(limpa);
    if (titulo?.[2]) {
      blocos.push(
        <p key={`titulo-${blocos.length}`} className="font-semibold">
          <InlineMarkdown texto={titulo[2]} />
        </p>,
      );
      continue;
    }

    blocos.push(
      <p key={`p-${blocos.length}`}>
        <InlineMarkdown texto={limpa} />
      </p>,
    );
  }

  fecharLista();

  return <div className="space-y-2">{blocos}</div>;
}

/**
 * Bolha de conversa, alinhada à direita para o usuário e à esquerda para
 * o assistente.
 */
export function BolhaMensagem({ mensagem }: BolhaMensagemProps): JSX.Element {
  const doUsuario = mensagem.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${doUsuario ? 'flex-row-reverse' : ''}`}>
      <span
        aria-hidden="true"
        className={[
          'flex size-8 shrink-0 items-center justify-center rounded-full text-sm',
          doUsuario
            ? 'bg-rapi-600 text-white'
            : mensagem.erro
              ? 'bg-red-100 dark:bg-red-950'
              : 'bg-rapi-100 dark:bg-rapi-950',
        ].join(' ')}
      >
        {doUsuario ? '🧑' : mensagem.erro ? '⚠️' : '🤖'}
      </span>

      <div
        className={[
          'max-w-[85ch] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          doUsuario
            ? 'rounded-tr-sm bg-rapi-600 text-white'
            : mensagem.erro
              ? 'rounded-tl-sm border border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200'
              : 'rounded-tl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
        ].join(' ')}
      >
        <p className="sr-only">{doUsuario ? 'Você:' : 'Assistente:'}</p>
        <CorpoMarkdown texto={mensagem.content} />
      </div>
    </div>
  );
}
