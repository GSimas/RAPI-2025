/**
 * ==========================================================
 * <Cabecalho /> - barra superior de navegação
 * ==========================================================
 *
 * Substitui a barra lateral e as abas: marca à esquerda, páginas ao
 * centro (com sublinhado que desliza até a página ativa), configurações
 * (tema, idioma, letra, movimento) e o botão do Assistente à direita. Em telas pequenas, as páginas abrem num painel
 * que desce do topo.
 *
 * Uma linha amarela percorre a base do cabeçalho a cada troca de página,
 * sinalizando a transição.
 */

import { ArrowUpRight, Menu, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, type JSX } from 'react';
import { usePreferencias } from '@/hooks/usePreferencias';
import { EASE_SCIENTATA, MOLA_INDICADOR } from '@/lib/movimento';
import { PAGINAS, type IdPagina } from '@/lib/navegacao';
import { SimboloRapi } from './Marca';
import { PainelPreferencias } from './PainelPreferencias';

interface CabecalhoProps {
  readonly ativa: IdPagina;
  readonly onNavegar: (id: IdPagina) => void;
}

/** Páginas listadas no menu (o Assistente tem botão próprio). */
const PAGINAS_MENU = PAGINAS.filter((pagina) => pagina.id !== 'assistente');

/**
 * Cabeçalho fixo da aplicação.
 */
export function Cabecalho({ ativa, onNavegar }: CabecalhoProps): JSX.Element {
  const { t } = usePreferencias();
  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha o painel móvel com Escape.
  useEffect(() => {
    if (!menuAberto) return;
    const aoTeclar = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') setMenuAberto(false);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [menuAberto]);

  const navegar = (id: IdPagina): void => {
    setMenuAberto(false);
    onNavegar(id);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* --- Marca ------------------------------------------------- */}
        <a
          href="#apresentacao"
          onClick={(evento) => {
            evento.preventDefault();
            navegar('apresentacao');
          }}
          className="sem-brilho group flex shrink-0 items-center gap-3"
        >
          <SimboloRapi className="size-9 transition-transform duration-500 ease-scientata group-hover:rotate-[-6deg]" />
          <span className="flex flex-col leading-none">
            <span className="rotulo hidden text-[0.5625rem] sm:block">
              {t.cabecalho.marcaRotulo}
            </span>
            <span className="mt-1 text-[0.9375rem] font-bold tracking-[-0.02em] text-ink">
              RAPI <span className="serif text-base font-normal text-signal">2024–25</span>
              {/* O nome acessível começa pelo texto visível (WCAG 2.5.3). */}
              <span className="sr-only"> — {t.cabecalho.irInicio}</span>
            </span>
          </span>
        </a>

        {/* --- Navegação (desktop) ----------------------------------- */}
        <nav aria-label={t.cabecalho.paginas} className="ml-4 hidden h-full items-stretch md:flex">
          {PAGINAS_MENU.map((pagina) => {
            const selecionada = pagina.id === ativa;
            return (
              <a
                key={pagina.id}
                href={`#${pagina.id}`}
                aria-current={selecionada ? 'page' : undefined}
                onClick={(evento) => {
                  evento.preventDefault();
                  navegar(pagina.id);
                }}
                className={[
                  'relative flex items-center px-3.5 text-sm font-medium',
                  selecionada ? 'text-ink' : 'text-muted hover:text-ink',
                ].join(' ')}
                style={{ ['--brilho-raio' as string]: '90px', ['--brilho-forca' as string]: 0.14 }}
              >
                {t.paginas[pagina.id].rotulo}
                {selecionada && (
                  <motion.span
                    layoutId="sublinhado-nav"
                    transition={MOLA_INDICADOR}
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-px h-0.5 bg-signal-fill"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* --- Ações ------------------------------------------------- */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <PainelPreferencias />

          <a
            href="#assistente"
            aria-current={ativa === 'assistente' ? 'page' : undefined}
            onClick={(evento) => {
              evento.preventDefault();
              navegar('assistente');
            }}
            className="botao-primario group px-3 py-2 sm:px-4"
          >
            <Sparkles
              aria-hidden="true"
              className="size-4 transition-transform duration-500 ease-scientata group-hover:rotate-12 group-hover:scale-110"
            />
            {/* Visualmente oculto no celular, mas sempre nomeia o link. */}
            <span className="sr-only sm:not-sr-only">{t.cabecalho.assistente}</span>
          </a>

          <button
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            className="botao-icone size-9 md:hidden"
            aria-expanded={menuAberto}
            aria-controls="menu-movel"
            aria-label={menuAberto ? t.cabecalho.fecharMenu : t.cabecalho.abrirMenu}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={menuAberto ? 'x' : 'menu'}
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
                transition={{ duration: 0.3, ease: EASE_SCIENTATA }}
                className="flex"
              >
                {menuAberto ? <X className="size-5" /> : <Menu className="size-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Linha de transição que percorre o cabeçalho a cada troca de página. */}
      <motion.span
        key={ativa}
        aria-hidden="true"
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{
          scaleX: { duration: 0.7, ease: EASE_SCIENTATA },
          opacity: { duration: 0.4, delay: 0.55 },
        }}
        className="absolute inset-x-0 -bottom-px h-px origin-left bg-signal-fill"
      />

      {/* --- Painel móvel ------------------------------------------- */}
      <AnimatePresence>
        {menuAberto && (
          <motion.nav
            id="menu-movel"
            aria-label={t.cabecalho.paginas}
            initial={{ opacity: 0, y: -12, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, y: -8, clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.5, ease: EASE_SCIENTATA }}
            className="absolute inset-x-0 top-full border-b border-line bg-canvas/95 backdrop-blur-xl md:hidden"
          >
            <motion.ul
              initial="inicial"
              animate="visivel"
              variants={{ visivel: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
              className="px-4 py-3"
            >
              {PAGINAS.map((pagina) => (
                <motion.li
                  key={pagina.id}
                  variants={{
                    inicial: { opacity: 0, x: -12 },
                    visivel: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE_SCIENTATA } },
                  }}
                >
                  <a
                    href={`#${pagina.id}`}
                    aria-current={pagina.id === ativa ? 'page' : undefined}
                    onClick={(evento) => {
                      evento.preventDefault();
                      navegar(pagina.id);
                    }}
                    className="group flex items-center gap-4 border-b border-line py-3.5 last:border-0"
                  >
                    <span className="rotulo w-6">{pagina.numero}</span>
                    <span
                      className={[
                        'flex-1 text-lg font-semibold tracking-[-0.02em]',
                        pagina.id === ativa ? 'text-signal' : 'text-ink',
                      ].join(' ')}
                    >
                      {t.paginas[pagina.id].rotulo}
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 text-faint transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-signal"
                    />
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
