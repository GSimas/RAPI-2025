/**
 * ==========================================================
 * Aba 5 - Assistente IA (chatbot)
 * ==========================================================
 *
 * Interface de conversa com o Consultor RAPI. O histórico é mantido no
 * cliente e reenviado a cada turno, já que a função serverless é stateless
 * (ao contrário da `chat_session` guardada no `st.session_state`).
 */

import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { enviarPergunta, ErroChat, prepararHistorico } from '@/lib/chatApi';
import type { MensagemChat } from '@/types/rapi';
import { BolhaMensagem } from './BolhaMensagem';
import { CampoPergunta } from './CampoPergunta';

/** Perguntas de exemplo exibidas no estado vazio. */
const SUGESTOES: readonly string[] = [
  'Qual o valor do consumo de água em 2024 e o que o relatório recomenda?',
  'Quais indicadores de saneamento estão em situação crítica?',
  'Compare o desempenho da educação entre 2023 e 2024.',
  'O que o relatório diz sobre a gestão do gasto público?',
];

/** Gera um identificador único para cada mensagem do histórico. */
function novoId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Painel de conversa com o assistente analítico do RAPI.
 */
export function AssistenteIA(): JSX.Element {
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [carregando, setCarregando] = useState(false);
  const fimDaListaRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Rola até a última mensagem sempre que a conversa cresce.
  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens, carregando]);

  // Cancela qualquer requisição pendente ao desmontar o componente.
  useEffect(() => () => abortRef.current?.abort(), []);

  const perguntar = useCallback(
    async (texto: string): Promise<void> => {
      const pergunta = texto.trim();
      if (pergunta === '' || carregando) return;

      const historico = prepararHistorico(mensagens);

      setMensagens((atuais) => [
        ...atuais,
        { id: novoId(), role: 'user', content: pergunta },
      ]);
      setCarregando(true);

      const controlador = new AbortController();
      abortRef.current = controlador;

      try {
        const { resposta } = await enviarPergunta(pergunta, historico, controlador.signal);
        setMensagens((atuais) => [
          ...atuais,
          { id: novoId(), role: 'assistant', content: resposta },
        ]);
      } catch (erro) {
        const mensagem =
          erro instanceof ErroChat
            ? erro.message
            : 'Ops! Tivemos um problema inesperado ao consultar o assistente.';

        setMensagens((atuais) => [
          ...atuais,
          { id: novoId(), role: 'assistant', content: mensagem, erro: true },
        ]);
      } finally {
        setCarregando(false);
        abortRef.current = null;
      }
    },
    [carregando, mensagens],
  );

  const limpar = useCallback(() => {
    abortRef.current?.abort();
    setMensagens([]);
  }, []);

  return (
    <div className="animate-fade-in flex h-[calc(100vh-14rem)] min-h-[32rem] flex-col">
      {/* --- Cabeçalho ----------------------------------------------- */}
      <header className="flex flex-wrap items-start justify-between gap-3 pb-4">
        <div>
          <h2 className="titulo-secao">
            <span aria-hidden="true">🤖 </span>
            Consultor RAPI com IA Gemini
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
            Pergunte sobre os dados, cruzamentos de indicadores ou resumos do relatório. As
            respostas são geradas por IA — sempre confira com o relatório oficial, pois o modelo
            pode fornecer informações imprecisas.
          </p>
        </div>

        {mensagens.length > 0 && (
          <button
            type="button"
            onClick={limpar}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Limpar conversa
          </button>
        )}
      </header>

      {/* --- Histórico ------------------------------------------------ */}
      <div
        className="cartao flex-1 overflow-y-auto p-4 sm:p-6"
        role="log"
        aria-live="polite"
        aria-label="Histórico da conversa"
      >
        {mensagens.length === 0 && !carregando ? (
          <EstadoVazio onSugestao={perguntar} />
        ) : (
          <div className="space-y-4">
            {mensagens.map((mensagem) => (
              <BolhaMensagem key={mensagem.id} mensagem={mensagem} />
            ))}

            {carregando && <IndicadorDigitando />}
          </div>
        )}

        <div ref={fimDaListaRef} />
      </div>

      {/* --- Entrada -------------------------------------------------- */}
      <div className="pt-4">
        <CampoPergunta onEnviar={perguntar} desabilitado={carregando} />
      </div>
    </div>
  );
}

/**
 * Estado inicial da conversa, com perguntas sugeridas.
 */
function EstadoVazio({ onSugestao }: { readonly onSugestao: (texto: string) => void }): JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 py-8 text-center">
      <span aria-hidden="true" className="text-4xl">
        💬
      </span>

      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          Comece a conversa
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          O assistente conhece os 205 indicadores e o texto analítico do relatório.
        </p>
      </div>

      <ul className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
        {SUGESTOES.map((sugestao) => (
          <li key={sugestao}>
            <button
              type="button"
              onClick={() => onSugestao(sugestao)}
              className="h-full w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm text-slate-700 transition hover:border-rapi-400 hover:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-rapi-600 dark:hover:bg-slate-800"
            >
              {sugestao}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Feedback visual enquanto o modelo elabora a resposta.
 */
function IndicadorDigitando(): JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-rapi-100 text-sm dark:bg-rapi-950"
      >
        🤖
      </span>

      <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 dark:bg-slate-800">
        <span className="flex gap-1" aria-hidden="true">
          {[0, 150, 300].map((atraso) => (
            <span
              key={atraso}
              className="size-1.5 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500"
              style={{ animationDelay: `${atraso}ms` }}
            />
          ))}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Analisando os indicadores e textos do RAPI…
        </span>
      </div>
    </div>
  );
}
