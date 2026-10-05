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

import { ShieldAlert, TriangleAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { Fragment, type JSX } from 'react';
import { usePreferencias } from '@/hooks/usePreferencias';
import { EASE_SCIENTATA } from '@/lib/movimento';
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
              className="border border-line bg-canvas/60 px-1 py-0.5 font-mono text-[0.85em]"
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
      <ul key={`lista-${blocos.length}`} className="ml-4 list-disc space-y-1 marker:text-signal">
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
 * Feedback visual enquanto o primeiro trecho da resposta não chega.
 */
function IndicadorDigitando(): JSX.Element {
  const tb = usePreferencias().t.chat.bolha;
  return (
    <span className="flex items-center gap-3">
      <span className="flex gap-1" aria-hidden="true">
        {[0, 0.15, 0.3].map((atraso) => (
          <motion.span
            key={atraso}
            className="size-1.5 bg-signal-fill"
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: atraso, ease: 'easeInOut' }}
          />
        ))}
      </span>
      <span className="rotulo">{tb.digitando}</span>
    </span>
  );
}

/**
 * Uma mensagem da conversa: a do usuário num bloco amarelo translúcido à
 * direita; a do assistente como texto editorial à esquerda, sob um
 * rótulo mono. Cada mensagem entra subindo e desfocando.
 */
export function BolhaMensagem({ mensagem }: BolhaMensagemProps): JSX.Element {
  const doUsuario = mensagem.role === 'user';
  const tb = usePreferencias().t.chat.bolha;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, ease: EASE_SCIENTATA }}
      className={doUsuario ? 'flex justify-end' : ''}
    >
      {doUsuario ? (
        <div className="max-w-[85%] border border-signal/35 bg-signal/[0.08] px-4 py-3 text-sm leading-relaxed text-ink">
          <p className="sr-only">{tb.voce}</p>
          <CorpoMarkdown texto={mensagem.content} />
        </div>
      ) : (
        <div
          className={[
            'border-l-2 pl-4',
            mensagem.erro
              ? 'border-semaforo-vermelho'
              : mensagem.bloqueio
                ? 'border-line-forte'
                : 'border-signal-fill',
          ].join(' ')}
        >
          <p
            className={[
              'rotulo mb-2 flex items-center gap-1.5',
              mensagem.erro ? 'text-semaforo-vermelho' : mensagem.bloqueio ? 'text-muted' : 'text-signal',
            ].join(' ')}
          >
            {mensagem.erro && <TriangleAlert aria-hidden="true" className="size-3" />}
            {mensagem.bloqueio && <ShieldAlert aria-hidden="true" className="size-3" />}
            <span className="sr-only">{tb.assistente}</span>
            <span aria-hidden="true">
              {mensagem.erro ? tb.erro : mensagem.bloqueio ? tb.bloqueio : tb.consultor}
            </span>
          </p>

          <div className="text-[0.9375rem] leading-relaxed text-ink/90">
            {mensagem.content ? (
              <CorpoMarkdown texto={mensagem.content} />
            ) : (
              mensagem.transmitindo && <IndicadorDigitando />
            )}
            {mensagem.transmitindo && mensagem.content && (
              <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-piscar bg-signal-fill" />
            )}
          </div>

          {mensagem.avisos && mensagem.avisos.length > 0 && (
            <ul className="mt-3 space-y-1">
              {mensagem.avisos.map((aviso) => (
                <li key={aviso} className="flex items-start gap-1.5 text-xs text-muted">
                  <ShieldAlert aria-hidden="true" className="mt-0.5 size-3 shrink-0 text-signal" />
                  {aviso}
                </li>
              ))}
            </ul>
          )}

          {mensagem.modelo && !mensagem.transmitindo && (
            <p className="mt-3 font-mono text-[0.625rem] tracking-[0.06em] text-faint">
              {tb.geradoPor(mensagem.modelo)}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
