/**
 * ==========================================================
 * <ConexaoIA /> - como o usuário acessa o assistente
 * ==========================================================
 *
 * Duas opções:
 *
 * 1. **OpenRouter (OAuth PKCE)** — em destaque: login sem copiar chaves,
 *    com roteamento automático entre modelos gratuitos e acesso ao
 *    catálogo completo de modelos;
 * 2. **BYOK** — o usuário traz a chave de um provedor (OpenAI,
 *    Anthropic, Gemini, DeepSeek, Mistral, Groq, xAI ou OpenRouter). A
 *    chave é validada listando os modelos disponíveis para ela.
 */

import { ArrowUpRight, Check, Eye, EyeOff, KeyRound, LoaderCircle, Lock, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useState, type FormEvent, type JSX } from 'react';
import { ErroChat, listarModelos, type ModeloIA } from '@/lib/chatApi';
import { iniciarLoginOpenRouter } from '@/lib/ia/pkce';
import { PROVEDORES, PROVEDORES_BYOK, escolherModeloPadrao, type IdProvedor } from '@/lib/ia/provedores';
import type { Conexao } from '@/lib/ia/sessao';
import { usePreferencias } from '@/hooks/usePreferencias';
import { EASE_SCIENTATA } from '@/lib/movimento';

interface ConexaoIAProps {
  readonly onConectar: (conexao: Conexao, modelos: readonly ModeloIA[]) => void;
  /** Mensagem de falha vinda do retorno do login PKCE. */
  readonly erroLogin?: string | null;
  /** O retorno do login está sendo processado. */
  readonly concluindoLogin?: boolean;
}

/** Caixa "lembrar neste navegador". */
function Lembrar({ valor, onChange }: { readonly valor: boolean; readonly onChange: (v: boolean) => void }): JSX.Element {
  const tc = usePreferencias().t.chat.conexao;
  return (
    <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-muted hover:text-ink">
      <input
        type="checkbox"
        checked={valor}
        onChange={(evento) => onChange(evento.target.checked)}
        className="mt-0.5 size-3.5 shrink-0 accent-[var(--signal-fill)]"
      />
      <span>
        {tc.lembrar} <span className="text-faint">{tc.lembrarNota}</span>
      </span>
    </label>
  );
}

/**
 * Painel de conexão com as duas formas de acesso.
 */
export function ConexaoIA({ onConectar, erroLogin, concluindoLogin = false }: ConexaoIAProps): JSX.Element {
  return (
    <div className="grid gap-px border border-line bg-line lg:grid-cols-[1.15fr_1fr]">
      <OpcaoOpenRouter erroLogin={erroLogin ?? null} concluindo={concluindoLogin} />
      <OpcaoByok onConectar={onConectar} />
    </div>
  );
}

// ==========================================================
// 1. OpenRouter (PKCE)
// ==========================================================

function OpcaoOpenRouter({ erroLogin, concluindo }: { readonly erroLogin: string | null; readonly concluindo: boolean }): JSX.Element {
  const tc = usePreferencias().t.chat.conexao;
  const [lembrar, setLembrar] = useState(false);
  const [redirecionando, setRedirecionando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const entrar = async (): Promise<void> => {
    setErro(null);
    setRedirecionando(true);
    try {
      await iniciarLoginOpenRouter(lembrar);
    } catch (falha) {
      setRedirecionando(false);
      setErro(falha instanceof Error ? falha.message : tc.falhaInicio);
    }
  };

  const mensagemErro = erro ?? erroLogin;
  const ocupado = redirecionando || concluindo;

  return (
    <section
      aria-labelledby="titulo-openrouter"
      data-brilho
      className="relative flex flex-col bg-surface p-6 shadow-[inset_0_2px_0_var(--signal-fill)] [--brilho-forca:0.1] [--brilho-raio:480px] sm:p-8"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip border-signal/50 text-signal">
          <Sparkles aria-hidden="true" className="size-3" /> {tc.recomendado}
        </span>
        <span className="chip">{tc.gratis}</span>
        <span className="chip">OAuth PKCE</span>
      </div>

      <h2 id="titulo-openrouter" className="mt-6 text-3xl leading-tight font-semibold tracking-[-0.03em] text-ink">
        {tc.entrarCom} <span className="serif text-signal">OpenRouter.</span>
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        {tc.openrouterTexto}
      </p>

      <ul className="mt-5 space-y-2 text-sm text-ink/85">
        {tc.vantagens.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal" />
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-4 pt-8">
        <Lembrar valor={lembrar} onChange={setLembrar} />

        <button type="button" onClick={() => void entrar()} disabled={ocupado} className="botao-primario group w-full sm:w-auto">
          {ocupado ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <KeyRound aria-hidden="true" className="size-4 transition-transform duration-500 group-hover:-rotate-12" />
          )}
          {concluindo ? tc.concluindo : redirecionando ? tc.redirecionando : tc.entrar}
        </button>

        <p className="text-xs text-faint">
          {tc.redirecionamentoNota}
        </p>

        <AnimatePresence>
          {mensagemErro && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="border border-semaforo-vermelho/40 bg-semaforo-vermelho/5 px-3 py-2 text-sm text-ink"
            >
              {mensagemErro}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ==========================================================
// 2. BYOK
// ==========================================================

function OpcaoByok({ onConectar }: { readonly onConectar: ConexaoIAProps['onConectar'] }): JSX.Element {
  const tc = usePreferencias().t.chat.conexao;
  const [provedor, setProvedor] = useState<IdProvedor>('openai');
  const [chave, setChave] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [validando, setValidando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const idChave = useId();
  const dados = PROVEDORES[provedor];

  const conectar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault();
    const limpa = chave.trim();
    if (limpa.length < 16 || /\s/.test(limpa)) {
      setErro(tc.incompleta);
      return;
    }

    setErro(null);
    setValidando(true);
    try {
      const modelos = await listarModelos(provedor, limpa);
      const modelo = escolherModeloPadrao(provedor, modelos.map((m) => m.id));
      if (!modelo) throw new ErroChat(tc.semModelo);
      setChave('');
      onConectar({ provedor, chave: limpa, modelo, origem: 'byok', lembrar }, modelos);
    } catch (falha) {
      setErro(falha instanceof ErroChat ? falha.message : tc.falhaValidar);
    } finally {
      setValidando(false);
    }
  };

  return (
    <section aria-labelledby="titulo-byok" className="flex flex-col bg-surface/70 p-6 sm:p-8">
      <span className="chip self-start">{tc.byok}</span>

      <h2 id="titulo-byok" className="mt-6 text-2xl leading-tight font-semibold tracking-[-0.025em] text-ink">
        {tc.traga} <span className="serif text-signal">{tc.chave}</span>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {tc.byokTexto}
      </p>

      <form onSubmit={(evento) => void conectar(evento)} className="mt-6 flex flex-1 flex-col gap-5" autoComplete="off">
        <fieldset>
          <legend className="rotulo mb-2">{tc.provedor}</legend>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {PROVEDORES_BYOK.map((opcao) => {
              const ativo = opcao.id === provedor;
              return (
                <label
                  key={opcao.id}
                  className={[
                    'relative cursor-pointer border px-2 py-2 text-center text-xs font-semibold transition-colors',
                    ativo ? 'border-signal bg-signal/10 text-ink' : 'border-line text-muted hover:border-line-forte hover:text-ink',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="provedor-byok"
                    value={opcao.id}
                    checked={ativo}
                    onChange={() => {
                      setProvedor(opcao.id);
                      setErro(null);
                    }}
                    className="sr-only"
                  />
                  {opcao.nome}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label htmlFor={idChave} className="rotulo">
              {tc.chaveDe(dados.nome)}
            </label>
            <a href={dados.urlChave} target="_blank" rel="noopener noreferrer" className="group rotulo inline-flex items-center gap-1 hover:text-signal">
              {tc.obterChave}
              <ArrowUpRight aria-hidden="true" className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
          <div className="relative">
            <input
              id={idChave}
              type={mostrar ? 'text' : 'password'}
              className="campo pr-10 font-mono"
              placeholder={provedor === 'mistral' ? tc.exemploMistral : dados.exemploChave}
              value={chave}
              onChange={(evento) => setChave(evento.target.value)}
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="off"
              maxLength={512}
              required
            />
            <button
              type="button"
              onClick={() => setMostrar((m) => !m)}
              className="botao-icone absolute top-1/2 right-1 size-8 -translate-y-1/2 p-0"
              aria-label={mostrar ? tc.ocultar : tc.mostrar}
            >
              {mostrar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Lembrar valor={lembrar} onChange={setLembrar} />

        <div className="mt-auto space-y-3">
          <button type="submit" disabled={validando || chave.trim() === ''} className="botao-secundario w-full sm:w-auto">
            {validando ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Lock aria-hidden="true" className="size-4" />}
            {validando ? tc.validando : tc.validar}
          </button>

          <AnimatePresence>
            {erro && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_SCIENTATA } }}
                exit={{ opacity: 0 }}
                className="border border-semaforo-vermelho/40 bg-semaforo-vermelho/5 px-3 py-2 text-sm text-ink"
              >
                {erro}
              </motion.p>
            )}
          </AnimatePresence>

          <p className="text-xs leading-relaxed text-faint">
            {tc.seguranca}
          </p>
        </div>
      </form>
    </section>
  );
}
