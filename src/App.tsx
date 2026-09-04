/**
 * ==========================================================
 * <App /> - casca da aplicação
 * ==========================================================
 *
 * Monta o layout (barra lateral + cabeçalho + abas + rodapé) e controla
 * qual das cinco seções está visível. A aba ativa é refletida no hash da
 * URL, tornando cada seção compartilhável e navegável pelo histórico do
 * navegador — algo que o Streamlit não oferecia.
 */

import { useCallback, useEffect, useState, type JSX } from 'react';
import { Abas, ABAS, type IdAba } from '@/components/layout/Abas';
import { Rodape } from '@/components/layout/Rodape';
import { SeletorTema } from '@/components/layout/SeletorTema';
import { Sidebar } from '@/components/layout/Sidebar';
import { Apresentacao } from '@/components/apresentacao/Apresentacao';
import { AssistenteIA } from '@/components/chat/AssistenteIA';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Explorador } from '@/components/explorador/Explorador';
import { Relatorio } from '@/components/relatorio/Relatorio';
import { useTheme } from '@/hooks/useTheme';

/** Lê a aba a partir do hash da URL, caindo na Apresentação. */
function abaDoHash(): IdAba {
  const alvo = window.location.hash.replace('#', '');
  return ABAS.some((aba) => aba.id === alvo) ? (alvo as IdAba) : 'apresentacao';
}

/**
 * Componente raiz da aplicação.
 */
export function App(): JSX.Element {
  const { tema, alternarTema } = useTheme();
  const [abaAtiva, setAbaAtiva] = useState<IdAba>(abaDoHash);
  const [menuAberto, setMenuAberto] = useState(false);

  const escuro = tema === 'dark';

  // Mantém a aba sincronizada com os botões voltar/avançar do navegador.
  useEffect(() => {
    const aoMudarHash = (): void => setAbaAtiva(abaDoHash());
    window.addEventListener('hashchange', aoMudarHash);
    return () => window.removeEventListener('hashchange', aoMudarHash);
  }, []);

  const trocarAba = useCallback((id: IdAba) => {
    setAbaAtiva(id);
    window.history.replaceState(null, '', `#${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const abaAtual = ABAS.find((aba) => aba.id === abaAtiva);

  return (
    <div className="flex min-h-screen">
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* --- Cabeçalho ------------------------------------------- */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Abrir menu lateral"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="size-5"
                aria-hidden="true"
              >
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                Dashboard RAPI 2024-2025
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {abaAtual?.rotulo}
              </p>
            </div>

            <SeletorTema tema={tema} onAlternar={alternarTema} />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Abas ativa={abaAtiva} onChange={trocarAba} />
          </div>
        </header>

        {/* --- Conteúdo -------------------------------------------- */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div
            role="tabpanel"
            id={`painel-${abaAtiva}`}
            aria-labelledby={`aba-${abaAtiva}`}
            tabIndex={-1}
          >
            {abaAtiva === 'apresentacao' && <Apresentacao escuro={escuro} />}
            {abaAtiva === 'dashboard' && <Dashboard escuro={escuro} />}
            {abaAtiva === 'relatorio' && <Relatorio />}
            {abaAtiva === 'explorador' && <Explorador />}
            {abaAtiva === 'assistente' && <AssistenteIA />}
          </div>
        </main>

        <Rodape />
      </div>
    </div>
  );
}
