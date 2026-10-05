/**
 * ==========================================================
 * <BotaoBaixarPng /> - exporta um gráfico como imagem
 * ==========================================================
 *
 * Captura o elemento indicado (título, legenda e gráfico) com
 * `html-to-image` e baixa um PNG em alta resolução, com o fundo do tema
 * atual. Elementos marcados com `data-exportar="nao"` (como o próprio
 * botão) ficam fora da imagem.
 *
 * A biblioteca é carregada sob demanda, no primeiro clique.
 */

import { Check, ImageDown, LoaderCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type JSX, type RefObject } from 'react';
import { usePreferencias } from '@/hooks/usePreferencias';
import { baixarBlob, carimboData } from '@/lib/csv';
import { EASE_SCIENTATA } from '@/lib/movimento';

interface BotaoBaixarPngProps {
  /** Elemento a ser capturado. */
  readonly alvo: RefObject<HTMLElement | null>;
  /** Base do nome do arquivo, sem extensão. */
  readonly nomeArquivo: string;
}

type Estado = 'ocioso' | 'gerando' | 'pronto' | 'erro';

/** Exclui da captura os elementos marcados como não exportáveis. */
function incluirNaImagem(no: HTMLElement): boolean {
  return !(no instanceof HTMLElement && no.dataset['exportar'] === 'nao');
}

/**
 * Botão que baixa o gráfico como PNG.
 */
export function BotaoBaixarPng({ alvo, nomeArquivo }: BotaoBaixarPngProps): JSX.Element {
  const [estado, setEstado] = useState<Estado>('ocioso');
  const tp = usePreferencias().t.png;

  const baixar = async (): Promise<void> => {
    const elemento = alvo.current;
    if (!elemento || estado === 'gerando') return;

    setEstado('gerando');
    try {
      const { toBlob } = await import('html-to-image');
      const fundo = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
      const opcoes = {
        pixelRatio: 2,
        backgroundColor: fundo || '#13100a',
        filter: incluirNaImagem,
        cacheBust: true,
      };

      // Tenta embutir as fontes; se a folha externa não puder ser lida, segue sem elas.
      let blob = await toBlob(elemento, opcoes).catch(() => null);
      blob ??= await toBlob(elemento, { ...opcoes, skipFonts: true });
      if (!blob) throw new Error('Falha ao gerar a imagem.');

      baixarBlob(`${nomeArquivo}-${carimboData()}.png`, blob);
      setEstado('pronto');
    } catch {
      setEstado('erro');
    } finally {
      setTimeout(() => setEstado('ocioso'), 1_800);
    }
  };

  const rotulo =
    estado === 'gerando' ? tp.gerando : estado === 'pronto' ? tp.pronto : estado === 'erro' ? tp.erro : tp.baixar;

  return (
    <button
      type="button"
      onClick={() => void baixar()}
      data-exportar="nao"
      aria-label={rotulo}
      title={rotulo}
      className="group ml-auto inline-flex items-center gap-1.5 border border-line px-2 py-1 font-mono text-[0.625rem] tracking-[0.14em] text-muted uppercase hover:border-signal/50 hover:text-signal"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={estado}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25, ease: EASE_SCIENTATA }}
          className="flex"
        >
          {estado === 'gerando' ? (
            <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
          ) : estado === 'pronto' ? (
            <Check aria-hidden="true" className="size-3.5 text-signal" />
          ) : (
            <ImageDown
              aria-hidden="true"
              className="size-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
            />
          )}
        </motion.span>
      </AnimatePresence>
      PNG
    </button>
  );
}
