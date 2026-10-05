/**
 * ==========================================================
 * <Fundo /> - fundo animado de todas as páginas
 * ==========================================================
 *
 * Camadas, de trás para a frente:
 *
 * 1. **Grade técnica** com halo amarelo no topo (estática);
 * 2. **Aurora** — manchas de luz que derivam devagar (CSS);
 * 3. **Constelação de dados** — pontos que flutuam e se ligam quando
 *    próximos; os que estão perto do cursor se acendem e se conectam a
 *    ele (canvas, ~30 quadros/s, pausado com a aba oculta);
 * 4. **Varredura** — uma linha de luz que percorre a grade;
 * 5. **Holofote** que acompanha o cursor (posicionado por `useBrilho`).
 *
 * Com "reduzir movimento", a aurora e a varredura param e a constelação
 * é desenhada uma única vez, estática.
 */

import { useEffect, useRef, type JSX } from 'react';
import { useBrilho } from '@/hooks/useBrilho';
import { usePreferencias } from '@/hooks/usePreferencias';

interface Ponto {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

/** Distância máxima (px) para ligar dois pontos. */
const DISTANCIA_LIGACAO = 150;
/** Raio (px) de influência do cursor. */
const RAIO_CURSOR = 190;
/** Intervalo mínimo entre quadros (~30 fps). */
const INTERVALO_QUADRO = 1000 / 30;

/**
 * Desenha e anima a constelação no canvas indicado.
 *
 * @returns Função de limpeza.
 */
function animarConstelacao(canvas: HTMLCanvasElement, estatico: boolean): () => void {
  const contexto = canvas.getContext('2d');
  if (!contexto) return () => undefined;

  let largura = 0;
  let altura = 0;
  let pontos: Ponto[] = [];
  let cor = '#ffcf3f';
  let intensidade = 1;
  const cursor = { x: -9999, y: -9999 };

  /** Lê a cor do brilho e a intensidade conforme o tema. */
  const lerTema = (): void => {
    const estilos = getComputedStyle(document.documentElement);
    cor = estilos.getPropertyValue('--brilho-cor').trim() || cor;
    intensidade = document.documentElement.classList.contains('dark') ? 1 : 0.75;
  };

  const redimensionar = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    largura = window.innerWidth;
    altura = window.innerHeight;
    canvas.width = Math.round(largura * dpr);
    canvas.height = Math.round(altura * dpr);
    contexto.setTransform(dpr, 0, 0, dpr, 0, 0);

    const quantidade = Math.max(24, Math.min(72, Math.round((largura * altura) / 24_000)));
    pontos = Array.from({ length: quantidade }, () => ({
      x: Math.random() * largura,
      y: Math.random() * altura,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.4 + 0.6,
    }));
  };

  const desenhar = (): void => {
    contexto.clearRect(0, 0, largura, altura);
    contexto.strokeStyle = cor;
    contexto.fillStyle = cor;

    for (let i = 0; i < pontos.length; i++) {
      const a = pontos[i] as Ponto;

      // Ligações entre pontos próximos.
      for (let j = i + 1; j < pontos.length; j++) {
        const b = pontos[j] as Ponto;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < DISTANCIA_LIGACAO) {
          contexto.globalAlpha = (1 - d / DISTANCIA_LIGACAO) * 0.16 * intensidade;
          contexto.lineWidth = 0.6;
          contexto.beginPath();
          contexto.moveTo(a.x, a.y);
          contexto.lineTo(b.x, b.y);
          contexto.stroke();
        }
      }

      // Ligação com o cursor e brilho dos pontos próximos.
      const dc = Math.hypot(a.x - cursor.x, a.y - cursor.y);
      const perto = dc < RAIO_CURSOR ? 1 - dc / RAIO_CURSOR : 0;
      if (perto > 0) {
        contexto.globalAlpha = perto * 0.35 * intensidade;
        contexto.lineWidth = 0.8;
        contexto.beginPath();
        contexto.moveTo(a.x, a.y);
        contexto.lineTo(cursor.x, cursor.y);
        contexto.stroke();
      }

      contexto.globalAlpha = (0.35 + perto * 0.65) * intensidade;
      contexto.beginPath();
      contexto.arc(a.x, a.y, a.r + perto * 1.6, 0, Math.PI * 2);
      contexto.fill();
    }
    contexto.globalAlpha = 1;
  };

  const mover = (): void => {
    for (const p of pontos) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = largura + 20;
      else if (p.x > largura + 20) p.x = -20;
      if (p.y < -20) p.y = altura + 20;
      else if (p.y > altura + 20) p.y = -20;
    }
  };

  lerTema();
  redimensionar();
  desenhar();

  // Atualiza a cor quando o tema muda.
  const observador = new MutationObserver(() => {
    lerTema();
    if (estatico) desenhar();
  });
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  const aoRedimensionar = (): void => {
    redimensionar();
    desenhar();
  };
  window.addEventListener('resize', aoRedimensionar);

  if (estatico) {
    return () => {
      observador.disconnect();
      window.removeEventListener('resize', aoRedimensionar);
    };
  }

  const aoMoverCursor = (evento: PointerEvent): void => {
    cursor.x = evento.clientX;
    cursor.y = evento.clientY;
  };
  const aoSairCursor = (): void => {
    cursor.x = -9999;
    cursor.y = -9999;
  };
  window.addEventListener('pointermove', aoMoverCursor, { passive: true });
  document.documentElement.addEventListener('pointerleave', aoSairCursor);

  let quadro = 0;
  let ultimo = 0;
  const laco = (agora: number): void => {
    quadro = requestAnimationFrame(laco);
    if (document.hidden || agora - ultimo < INTERVALO_QUADRO) return;
    ultimo = agora;
    mover();
    desenhar();
  };
  quadro = requestAnimationFrame(laco);

  return () => {
    cancelAnimationFrame(quadro);
    observador.disconnect();
    window.removeEventListener('resize', aoRedimensionar);
    window.removeEventListener('pointermove', aoMoverCursor);
    document.documentElement.removeEventListener('pointerleave', aoSairCursor);
  };
}

/**
 * Fundo fixo com grade, aurora, constelação, varredura e holofote.
 */
export function Fundo(): JSX.Element {
  const refHolofote = useRef<HTMLDivElement>(null);
  const refCanvas = useRef<HTMLCanvasElement>(null);
  const { reduzirMovimento } = usePreferencias();
  useBrilho(refHolofote);

  useEffect(() => {
    const canvas = refCanvas.current;
    if (!canvas) return;
    return animarConstelacao(canvas, reduzirMovimento);
  }, [reduzirMovimento]);

  return (
    <>
      <div aria-hidden="true" className="fundo-grade" />
      <div aria-hidden="true" className="fundo-animado">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
        <canvas ref={refCanvas} className="constelacao" />
        <div className="varredura" />
      </div>
      <div aria-hidden="true" ref={refHolofote} className="holofote" data-ativo="false" />
    </>
  );
}
