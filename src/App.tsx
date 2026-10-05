/**
 * ==========================================================
 * <App /> - casca da aplicação
 * ==========================================================
 *
 * Monta o layout (fundo + cabeçalho + página + rodapé) e controla qual
 * das cinco páginas está visível. A página ativa é refletida no hash da
 * URL, tornando cada seção compartilhável e navegável pelo histórico.
 *
 * A troca de página é animada: a página atual sai desfocando e a nova
 * entra subindo (`AnimatePresence mode="wait"`). A rolagem volta ao topo
 * apenas depois que a saída termina, para não "pular" a página que sai.
 *
 * Só a Apresentação vai no bundle inicial. As demais páginas são chunks
 * `React.lazy`: o download começa no clique (durante a animação de saída)
 * e, alguns segundos após o `load` (passada a animação de entrada, que
 * define o LCP), todas são pré-carregadas no tempo ocioso do navegador —
 * a navegação continua instantânea.
 */

import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type JSX, type MouseEvent } from 'react';
import { Cabecalho } from '@/components/layout/Cabecalho';
import { Fundo } from '@/components/layout/Fundo';
import { Rodape } from '@/components/layout/Rodape';
import { Apresentacao } from '@/components/apresentacao/Apresentacao';
import { LimiteErro } from '@/components/ui/LimiteErro';
import { usePreferencias } from '@/hooks/usePreferencias';
import { ehRetornoOpenRouter } from '@/lib/ia/pkce';
import { VARIANTES_PAGINA } from '@/lib/movimento';
import { paginaDoHash, paginaPorId, type IdPagina } from '@/lib/navegacao';

// `import()` é memoizado pelo navegador: chamar de novo só reaproveita o módulo.
const CARREGAR = {
  dashboard: () => import('@/components/dashboard/Dashboard'),
  relatorio: () => import('@/components/relatorio/Relatorio'),
  explorador: () => import('@/components/explorador/Explorador'),
  assistente: () => import('@/components/chat/AssistenteIA'),
} satisfies Partial<Record<IdPagina, () => Promise<unknown>>>;

const Dashboard = lazy(() => CARREGAR.dashboard().then((m) => ({ default: m.Dashboard })));
const Relatorio = lazy(() => CARREGAR.relatorio().then((m) => ({ default: m.Relatorio })));
const Explorador = lazy(() => CARREGAR.explorador().then((m) => ({ default: m.Explorador })));
const AssistenteIA = lazy(() => CARREGAR.assistente().then((m) => ({ default: m.AssistenteIA })));

/** Começa a baixar o chunk de uma página (sem esperar). */
function preCarregar(id: IdPagina): void {
  if (id in CARREGAR) void CARREGAR[id as keyof typeof CARREGAR]().catch(() => undefined);
}

/**
 * Componente raiz da aplicação.
 */
export function App(): JSX.Element {
  const { t, tema, reduzirMovimento } = usePreferencias();
  // O retorno do login OpenRouter (`/auth/openrouter`) abre direto no Assistente.
  const [paginaAtiva, setPaginaAtiva] = useState<IdPagina>(() =>
    ehRetornoOpenRouter() ? 'assistente' : paginaDoHash(),
  );
  const rolarAoTopo = useRef(false);
  const refMain = useRef<HTMLElement>(null);
  // Anuncia a troca de página a leitores de tela (não no carregamento inicial).
  const [anunciar, setAnunciar] = useState(false);

  // Pré-carrega as demais páginas depois do `load` + 3 s, no tempo ocioso,
  // para não competir com o LCP (a animação do título da página inicial).
  useEffect(() => {
    let cancelado = false;
    let timer = 0;
    const todas = (): void => {
      if (!cancelado) (Object.keys(CARREGAR) as IdPagina[]).forEach(preCarregar);
    };
    const agendar = (): void => {
      timer = window.setTimeout(() => {
        if ('requestIdleCallback' in window) window.requestIdleCallback(todas);
        else todas();
      }, 3000);
    };
    if (document.readyState === 'complete') agendar();
    else window.addEventListener('load', agendar, { once: true });
    return () => {
      cancelado = true;
      clearTimeout(timer);
      window.removeEventListener('load', agendar);
    };
  }, []);

  const escuro = tema === 'dark';

  // Mantém a página sincronizada com os botões voltar/avançar do navegador.
  useEffect(() => {
    const aoMudarHash = (): void => {
      rolarAoTopo.current = true;
      setAnunciar(true);
      setPaginaAtiva(paginaDoHash());
    };
    window.addEventListener('hashchange', aoMudarHash);
    return () => window.removeEventListener('hashchange', aoMudarHash);
  }, []);

  const navegar = useCallback(
    (id: IdPagina) => {
      if (id === paginaAtiva) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      preCarregar(id);
      rolarAoTopo.current = true;
      setAnunciar(true);
      setPaginaAtiva(id);
      window.history.pushState(null, '', `#${id}`);
    },
    [paginaAtiva],
  );

  const aoTerminarSaida = (): void => {
    if (!rolarAoTopo.current) return;
    rolarAoTopo.current = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const pagina = paginaPorId(paginaAtiva);
  const irAoInicio = (): void => navegar('apresentacao');

  // O alvo não pode ser um `#hash` (o hash é a rota), então o foco é movido à mão.
  const pularParaConteudo = (evento: MouseEvent<HTMLAnchorElement>): void => {
    evento.preventDefault();
    refMain.current?.focus();
    refMain.current?.scrollIntoView();
  };

  return (
    <MotionConfig reducedMotion={reduzirMovimento ? 'always' : 'never'}>
      <a
        href="#conteudo"
        onClick={pularParaConteudo}
        className="botao-primario sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2"
      >
        {t.a11y.pularConteudo}
      </a>

      <Fundo />

      <p className="sr-only" aria-live="polite">
        {anunciar ? t.a11y.paginaAtual(t.paginas[paginaAtiva].rotulo) : ''}
      </p>

      <div className="flex min-h-dvh flex-col">
        <Cabecalho ativa={paginaAtiva} onNavegar={navegar} />

        <main
          ref={refMain}
          id="conteudo"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 px-4 outline-none sm:px-6 lg:px-8"
        >
          <AnimatePresence mode="wait" onExitComplete={aoTerminarSaida}>
            <motion.div
              key={paginaAtiva}
              id={`pagina-${paginaAtiva}`}
              variants={VARIANTES_PAGINA}
              initial="inicial"
              animate="visivel"
              exit="saida"
            >
              <LimiteErro className="mt-10">
                <Suspense
                  fallback={
                    // Ocupa a tela para o rodapé não "subir" enquanto o chunk chega.
                    <div className="min-h-dvh" aria-busy="true">
                      <span className="sr-only">{t.a11y.carregando}</span>
                    </div>
                  }
                >
                  {paginaAtiva === 'apresentacao' && <Apresentacao escuro={escuro} onNavegar={navegar} />}
                  {paginaAtiva === 'dashboard' && (
                    <Dashboard escuro={escuro} pagina={pagina} onInicio={irAoInicio} />
                  )}
                  {paginaAtiva === 'relatorio' && <Relatorio pagina={pagina} onInicio={irAoInicio} />}
                  {paginaAtiva === 'explorador' && <Explorador pagina={pagina} onInicio={irAoInicio} />}
                  {paginaAtiva === 'assistente' && <AssistenteIA pagina={pagina} onInicio={irAoInicio} />}
                </Suspense>
              </LimiteErro>
            </motion.div>
          </AnimatePresence>
        </main>

        <Rodape />
      </div>
    </MotionConfig>
  );
}
