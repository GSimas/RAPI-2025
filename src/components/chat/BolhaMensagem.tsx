/**
 * ==========================================================
 * <BolhaMensagem /> - uma mensagem do chat
 * ==========================================================
 *
 * O Gemini responde em Markdown leve. Em vez de embutir um parser
 * completo (e HTML bruto), renderizamos aqui o subconjunto que o modelo
 * de fato usa: parágrafos, listas, títulos, tabelas e ênfase — tudo como elementos
 * React, sem `dangerouslySetInnerHTML`.
 */

import { ShieldAlert, TriangleAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { Fragment, memo, type JSX } from 'react';
import { usePreferencias } from '@/hooks/usePreferencias';
import { EASE_SCIENTATA } from '@/lib/movimento';
import type { MensagemChat } from '@/types/rapi';

interface BolhaMensagemProps {
  readonly mensagem: MensagemChat;
}

/** Captura trechos `**negrito**`, `*itálico*` e `` `código` ``. */
const PADRAO_INLINE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;

/** Linha delimitadora de tabela GFM: `| --- | :---: | ---: |`. */
const SEPARADOR_TABELA = /^\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?$/;

type Alinhamento = 'text-left' | 'text-center' | 'text-right';

/** Divide uma linha `| a | b |` em células, respeitando `\|` escapado. */
function celulasTabela(linha: string): string[] {
  return linha
    .trim()
    .replace(/^\|/, '')
    .replace(/(?<!\\)\|$/, '')
    .split(/(?<!\\)\|/)
    .map((celula) => celula.trim().replace(/\\\|/g, '|'));
}

/** Alinhamento de cada coluna, lido dos `:` da linha delimitadora. */
function alinhamentosTabela(separador: string): Alinhamento[] {
  return celulasTabela(separador).map((celula) =>
    celula.endsWith(':') ? (celula.startsWith(':') ? 'text-center' : 'text-right') : 'text-left',
  );
}

/**
 * Tabela Markdown renderizada com rolagem horizontal própria, para não
 * estourar a largura da conversa em telas estreitas.
 */
function TabelaMarkdown({
  cabecalho,
  alinhamentos,
  linhas,
}: {
  readonly cabecalho: readonly string[];
  readonly alinhamentos: readonly Alinhamento[];
  readonly linhas: readonly (readonly string[])[];
}): JSX.Element {
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-canvas/60">
          <tr>
            {cabecalho.map((celula, coluna) => (
              <th
                key={coluna}
                scope="col"
                className={`border-b border-line-forte px-3 py-2 font-semibold whitespace-nowrap ${alinhamentos[coluna] ?? 'text-left'}`}
              >
                <InlineMarkdown texto={celula} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, indice) => (
            <tr key={indice} className="border-b border-line last:border-b-0">
              {cabecalho.map((_, coluna) => (
                <td
                  key={coluna}
                  className={`px-3 py-1.5 align-top tabular-nums ${alinhamentos[coluna] ?? 'text-left'}`}
                >
                  <InlineMarkdown texto={linha[coluna] ?? ''} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
 * Renderiza o corpo da mensagem em blocos: títulos, listas, tabelas e parágrafos.
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

  for (let i = 0; i < linhas.length; i++) {
    const limpa = (linhas[i] ?? '').trim();

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

    // Tabela: linha de cabeçalho com "|" seguida da linha delimitadora.
    const proxima = (linhas[i + 1] ?? '').trim();
    if (limpa.includes('|') && SEPARADOR_TABELA.test(proxima)) {
      const corpo: string[][] = [];
      i += 2;
      while (i < linhas.length && (linhas[i] ?? '').includes('|') && (linhas[i] ?? '').trim() !== '') {
        corpo.push(celulasTabela(linhas[i] ?? ''));
        i++;
      }
      i--;
      blocos.push(
        <TabelaMarkdown
          key={`tabela-${blocos.length}`}
          cabecalho={celulasTabela(limpa)}
          alinhamentos={alinhamentosTabela(proxima)}
          linhas={corpo}
        />,
      );
      continue;
    }

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
 *
 * `memo`: durante o streaming só a resposta em curso muda de identidade;
 * as mensagens anteriores não re-renderizam (nem re-interpretam o Markdown)
 * a cada fragmento recebido.
 */
export const BolhaMensagem = memo(function BolhaMensagem({ mensagem }: BolhaMensagemProps): JSX.Element {
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
});
