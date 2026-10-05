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
 */

import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { Cabecalho } from '@/components/layout/Cabecalho';
import { Fundo } from '@/components/layout/Fundo';
import { Rodape } from '@/components/layout/Rodape';
import { Apresentacao } from '@/components/apresentacao/Apresentacao';
import { AssistenteIA } from '@/components/chat/AssistenteIA';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Explorador } from '@/components/explorador/Explorador';
import { Relatorio } from '@/components/relatorio/Relatorio';
import { usePreferencias } from '@/hooks/usePreferencias';
import { ehRetornoOpenRouter } from '@/lib/ia/pkce';
import { VARIANTES_PAGINA } from '@/lib/movimento';
import { paginaDoHash, paginaPorId, type IdPagina } from '@/lib/navegacao';

/**
 * Componente raiz da aplicação.
 */
export function App(): JSX.Element {
  const { tema, reduzirMovimento } = usePreferencias();
  // O retorno do login OpenRouter (`/auth/openrouter`) abre direto no Assistente.
  const [paginaAtiva, setPaginaAtiva] = useState<IdPagina>(() =>
    ehRetornoOpenRouter() ? 'assistente' : paginaDoHash(),
  );
  const rolarAoTopo = useRef(false);

  const escuro = tema === 'dark';

  // Mantém a página sincronizada com os botões voltar/avançar do navegador.
  useEffect(() => {
    const aoMudarHash = (): void => {
      rolarAoTopo.current = true;
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
      rolarAoTopo.current = true;
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

  return (
    <MotionConfig reducedMotion={reduzirMovimento ? 'always' : 'never'}>
      <Fundo />

      <div className="flex min-h-dvh flex-col">
        <Cabecalho ativa={paginaAtiva} onNavegar={navegar} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait" onExitComplete={aoTerminarSaida}>
            <motion.div
              key={paginaAtiva}
              id={`pagina-${paginaAtiva}`}
              variants={VARIANTES_PAGINA}
              initial="inicial"
              animate="visivel"
              exit="saida"
            >
              {paginaAtiva === 'apresentacao' && <Apresentacao escuro={escuro} onNavegar={navegar} />}
              {paginaAtiva === 'dashboard' && (
                <Dashboard escuro={escuro} pagina={pagina} onInicio={irAoInicio} />
              )}
              {paginaAtiva === 'relatorio' && <Relatorio pagina={pagina} onInicio={irAoInicio} />}
              {paginaAtiva === 'explorador' && <Explorador pagina={pagina} onInicio={irAoInicio} />}
              {paginaAtiva === 'assistente' && <AssistenteIA pagina={pagina} onInicio={irAoInicio} />}
            </motion.div>
          </AnimatePresence>
        </main>

        <Rodape />
      </div>
    </MotionConfig>
  );
}
