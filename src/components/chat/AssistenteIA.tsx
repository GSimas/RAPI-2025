/**
 * ==========================================================
 * Página - Assistente IA (chatbot)
 * ==========================================================
 *
 * Fluxo:
 *
 * 1. **Conexão** — o usuário entra com a OpenRouter (OAuth PKCE, com
 *    modelos grátis) ou traz a chave de um provedor (BYOK). O retorno do
 *    login PKCE (`/auth/openrouter`) é concluído aqui.
 * 2. **Conversa** — inicia sempre com o aviso de transparência
 *    (ISO/IEC 42001). As respostas chegam em streaming e podem ser
 *    interrompidas; o modelo pode ser trocado a qualquer momento.
 *
 * O histórico vive só no cliente e é reenviado a cada turno, já que a
 * função serverless é stateless. Recusas dos guardrails, erros e
 * respostas incompletas não voltam para o modelo.
 */

import { ArrowUpRight, LogOut, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { TituloPagina } from '@/components/ui/Titulos';
import { enviarPergunta, ErroChat, listarModelos, prepararHistorico, type EventoChat, type ModeloIA } from '@/lib/chatApi';
import { TOTAL_INDICADORES } from '@/lib/total';
import { concluirLoginOpenRouter, ehRetornoOpenRouter } from '@/lib/ia/pkce';
import { PROVEDORES } from '@/lib/ia/provedores';
import { encerrarConexao, lerConexao, salvarConexao, type Conexao } from '@/lib/ia/sessao';
import { usePreferencias } from '@/hooks/usePreferencias';
import { EASE_SCIENTATA } from '@/lib/movimento';
import type { DefinicaoPagina } from '@/lib/navegacao';
import type { MensagemChat } from '@/types/rapi';
import { AvisoIA } from './AvisoIA';
import { BolhaMensagem } from './BolhaMensagem';
import { CampoPergunta } from './CampoPergunta';
import { ConexaoIA } from './ConexaoIA';
import { SeletorModelo } from './SeletorModelo';

interface AssistenteIAProps {
  readonly pagina: DefinicaoPagina;
  readonly onInicio: () => void;
}

/** Gera um identificador único para cada mensagem do histórico. */
function novoId(): string {
  return crypto.randomUUID();
}

/**
 * Página do assistente analítico do RAPI.
 */
export function AssistenteIA({ pagina, onInicio }: AssistenteIAProps): JSX.Element {
  const { t, idioma } = usePreferencias();
  const tc = t.chat;
  const [conexao, setConexao] = useState<Conexao | null>(lerConexao);
  const [modelos, setModelos] = useState<ModeloIA[]>([]);
  const [carregandoModelos, setCarregandoModelos] = useState(false);
  const [concluindoLogin, setConcluindoLogin] = useState(ehRetornoOpenRouter);
  const [erroLogin, setErroLogin] = useState<string | null>(null);

  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [carregando, setCarregando] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // --- Retorno do login OpenRouter (PKCE) --------------------------------
  useEffect(() => {
    if (!ehRetornoOpenRouter()) return;
    concluirLoginOpenRouter()
      .then((nova) => {
        salvarConexao(nova);
        setConexao(nova);
        setModelos([]);
      })
      .catch((falha: unknown) => {
        setErroLogin(falha instanceof Error ? falha.message : tc.falhaLogin);
      })
      .finally(() => setConcluindoLogin(false));
  }, []);

  // --- Modelos do provedor conectado ------------------------------------
  const provedorAtual = conexao?.provedor;
  const chaveAtual = conexao?.chave;
  useEffect(() => {
    if (!provedorAtual || !chaveAtual) return;
    let ativo = true;
    setCarregandoModelos(true);

    listarModelos(provedorAtual, provedorAtual === 'openrouter' ? undefined : chaveAtual)
      .then((lista) => {
        if (ativo) setModelos(lista);
      })
      .catch((falha: unknown) => {
        if (!ativo) return;
        // Chave revogada ou expirada: volta para a tela de conexão.
        if (falha instanceof ErroChat && falha.status === 401) {
          encerrarConexao();
          setConexao(null);
          setErroLogin(falha.message);
        }
      })
      .finally(() => {
        if (ativo) setCarregandoModelos(false);
      });

    return () => {
      ativo = false;
    };
  }, [provedorAtual, chaveAtual]);

  // Rola o histórico (e só ele) até a última mensagem quando a conversa cresce.
  useEffect(() => {
    const lista = listaRef.current;
    if (lista) lista.scrollTo({ top: lista.scrollHeight, behavior: 'smooth' });
  }, [mensagens, carregando]);

  // Cancela qualquer requisição pendente ao desmontar o componente.
  useEffect(() => () => abortRef.current?.abort(), []);

  // --- Ações -------------------------------------------------------------
  const conectar = useCallback((nova: Conexao, lista: readonly ModeloIA[]) => {
    salvarConexao(nova);
    setConexao(nova);
    setModelos([...lista]);
    setErroLogin(null);
  }, []);

  const sair = useCallback(() => {
    abortRef.current?.abort();
    encerrarConexao();
    setConexao(null);
    setModelos([]);
    setMensagens([]);
  }, []);

  const trocarModelo = useCallback(
    (modelo: string) => {
      if (!conexao) return;
      const nova = { ...conexao, modelo };
      salvarConexao(nova);
      setConexao(nova);
    },
    [conexao],
  );

  /** Atualiza a mensagem do assistente que está sendo gerada. */
  const atualizar = (id: string, mudar: (mensagem: MensagemChat) => MensagemChat): void => {
    setMensagens((atuais) => atuais.map((m) => (m.id === id ? mudar(m) : m)));
  };

  const perguntar = useCallback(
    async (texto: string): Promise<void> => {
      const pergunta = texto.trim();
      if (pergunta === '' || carregando || !conexao) return;

      const historico = prepararHistorico(mensagens);
      const idResposta = novoId();

      setMensagens((atuais) => [
        ...atuais,
        { id: novoId(), role: 'user', content: pergunta },
        { id: idResposta, role: 'assistant', content: '', transmitindo: true },
      ]);
      setCarregando(true);

      const controlador = new AbortController();
      abortRef.current = controlador;

      const aoEvento = (evento: EventoChat): void => {
        switch (evento.tipo) {
          case 'delta':
            atualizar(idResposta, (m) => ({ ...m, content: m.content + evento.texto }));
            break;
          case 'modelo':
            atualizar(idResposta, (m) => ({ ...m, modelo: evento.modelo }));
            break;
          case 'aviso':
            atualizar(idResposta, (m) => ({ ...m, avisos: [...(m.avisos ?? []), evento.mensagem] }));
            break;
          case 'bloqueio':
            atualizar(idResposta, (m) => ({ ...m, content: evento.mensagem, bloqueio: true }));
            break;
          case 'erro':
            atualizar(idResposta, (m) =>
              m.content
                ? { ...m, avisos: [...(m.avisos ?? []), evento.mensagem], erro: true }
                : { ...m, content: evento.mensagem, erro: true },
            );
            break;
          case 'fim':
            atualizar(idResposta, (m) => ({ ...m, transmitindo: false }));
            break;
        }
      };

      try {
        await enviarPergunta({ pergunta, historico, conexao, aoEvento, sinal: controlador.signal, idioma });
      } catch (erro) {
        const interrompida = erro instanceof ErroChat && erro.status === 499;
        const mensagem =
          erro instanceof ErroChat ? erro.message : tc.inesperado;

        atualizar(idResposta, (m) =>
          interrompida
            ? { ...m, avisos: [...(m.avisos ?? []), tc.interrompidaPorVoce], erro: m.content === '', content: m.content || tc.interrompida }
            : m.content
              ? { ...m, avisos: [...(m.avisos ?? []), mensagem], erro: true }
              : { ...m, content: mensagem, erro: true },
        );

        // Credencial ausente ou recusada pelo servidor: volta para a tela de conexão.
        if (erro instanceof ErroChat && erro.status === 401) {
          encerrarConexao();
          setConexao(null);
          setModelos([]);
          setErroLogin(mensagem);
        }
      } finally {
        atualizar(idResposta, (m) => ({ ...m, transmitindo: false }));
        setCarregando(false);
        abortRef.current = null;
      }
    },
    [carregando, mensagens, conexao, idioma, tc],
  );

  const parar = useCallback(() => abortRef.current?.abort(), []);

  const novaConversa = useCallback(() => {
    abortRef.current?.abort();
    setMensagens([]);
  }, []);

  const nomeProvedor = conexao ? PROVEDORES[conexao.provedor].nome : undefined;
  const modeloAtual = modelos.find((m) => m.id === conexao?.modelo);

  return (
    <div>
      <TituloPagina pagina={pagina} onInicio={onInicio} />

      <AnimatePresence mode="wait" initial={false}>
        {!conexao ? (
          <motion.div
            key="conexao"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_SCIENTATA } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
            className="space-y-6"
          >
            <AvisoIA />
            <ConexaoIA onConectar={conectar} erroLogin={erroLogin} concluindoLogin={concluindoLogin} />
          </motion.div>
        ) : (
          <motion.div
            key="conversa"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_SCIENTATA } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
            className="card flex h-[min(80vh,58rem)] min-h-[32rem] flex-col"
          >
            {/* --- Barra do chat ---------------------------------------- */}
            <div className="card-titulo flex-wrap gap-y-2">
              <span className="relative flex size-2">
                <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-signal-fill opacity-60" />
                <span aria-hidden="true" className="relative size-2 rounded-full bg-signal-fill" />
              </span>
              <span>
                {nomeProvedor} · {conexao.origem === 'pkce' ? tc.login : 'BYOK'}
              </span>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <SeletorModelo
                  modelos={modelos.length > 0 ? modelos : [{ id: conexao.modelo, nome: conexao.modelo }]}
                  valor={conexao.modelo}
                  onChange={trocarModelo}
                  carregando={carregandoModelos && modelos.length === 0}
                  desabilitado={carregando}
                />

                <AnimatePresence>
                  {mensagens.length > 0 && (
                    <motion.button
                      type="button"
                      onClick={novaConversa}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.35, ease: EASE_SCIENTATA }}
                      className="group inline-flex items-center gap-1.5 px-2 py-1.5 hover:text-signal"
                      title={tc.novaTitulo}
                    >
                      <RotateCcw aria-hidden="true" className="size-3 transition-transform duration-500 group-hover:-rotate-180" />
                      <span className="sr-only sm:not-sr-only">{tc.nova}</span>
                    </motion.button>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={sair}
                  className="group inline-flex items-center gap-1.5 px-2 py-1.5 hover:text-signal"
                  title={tc.sairTitulo}
                >
                  <LogOut aria-hidden="true" className="size-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                  {tc.sair}
                </button>
              </div>
            </div>

            {/* --- Histórico -------------------------------------------- */}
            <div
              ref={listaRef}
              className="flex-1 overflow-y-auto px-4 py-6 sm:px-8"
              role="log"
              aria-live="polite"
              // Enquanto a resposta chega aos pedaços, o leitor de tela espera e lê o texto completo.
              aria-busy={carregando}
              aria-label={tc.historico}
            >
              <div className="mx-auto max-w-3xl space-y-6">
                <AvisoIA provedor={nomeProvedor} modelo={modeloAtual?.nome ?? conexao.modelo} />

                <AnimatePresence initial={false}>
                  {mensagens.length === 0 && <Sugestoes key="sugestoes" onSugestao={perguntar} />}
                </AnimatePresence>

                {mensagens.map((mensagem) => (
                  <BolhaMensagem key={mensagem.id} mensagem={mensagem} />
                ))}
              </div>
            </div>

            {/* --- Entrada ---------------------------------------------- */}
            <div className="border-t border-line p-3 sm:p-4">
              <div className="mx-auto max-w-3xl">
                <CampoPergunta onEnviar={perguntar} onParar={parar} carregando={carregando} />
                <p className="mt-2 text-center text-[0.6875rem] text-faint">
                  {tc.rodape}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Perguntas sugeridas para começar a conversa.
 */
function Sugestoes({ onSugestao }: { readonly onSugestao: (texto: string) => void }): JSX.Element {
  const tc = usePreferencias().t.chat;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_SCIENTATA, delay: 0.15 } }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.25 } }}
    >
      <p className="text-center text-lg font-semibold tracking-[-0.02em] text-ink">
        {tc.comecamos} <span className="serif text-signal">{tc.comecamosDestaque}</span>
      </p>
      <p className="mt-1 text-center text-xs text-muted">
        {tc.conheco(TOTAL_INDICADORES)}
      </p>

      <motion.ul
        initial="inicial"
        animate="visivel"
        variants={{ visivel: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } } }}
        className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-2"
      >
        {tc.sugestoes.map((sugestao, indice) => (
          <motion.li
            key={sugestao}
            className="bg-canvas"
            variants={{
              inicial: { opacity: 0, y: 10 },
              visivel: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_SCIENTATA } },
            }}
          >
            <button
              type="button"
              onClick={() => onSugestao(sugestao)}
              className="group flex h-full w-full flex-col gap-3 bg-surface/80 p-4 text-left"
              style={{ ['--brilho-raio' as string]: '260px', ['--brilho-forca' as string]: 0.1 }}
            >
              <span className="rotulo flex w-full items-center justify-between">
                {String(indice + 1).padStart(2, '0')}
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-3.5 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-signal"
                />
              </span>
              <span className="text-sm leading-relaxed text-ink/85 group-hover:text-ink">{sugestao}</span>
            </button>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
}
