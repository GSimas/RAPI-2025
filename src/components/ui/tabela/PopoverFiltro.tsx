/**
 * ==========================================================
 * <PopoverFiltro /> - filtro de uma coluna
 * ==========================================================
 *
 * Painel flutuante aberto pelo ícone de funil do cabeçalho. O conteúdo
 * depende do tipo da coluna (ver `modelo.ts`). Os filtros se aplicam
 * enquanto o usuário digita ou marca opções.
 *
 * É renderizado num portal com posição fixa, para não ser cortado pela
 * área rolável da tabela; acompanha a âncora durante a rolagem e fecha
 * com Escape ou clique fora.
 */

import { Search } from 'lucide-react';
import { motion } from 'motion/react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from 'react';
import { createPortal } from 'react-dom';
import { usePreferencias } from '@/hooks/usePreferencias';
import { localeNumeros } from '@/lib/format';
import { EASE_SCIENTATA } from '@/lib/movimento';
import { normalizarChave } from '@/lib/taxonomia';
import {
  chaveCategoria,
  lerNumero,
  type ColunaTabela,
  type Filtro,
  type ModoTexto,
} from './modelo';

interface PopoverFiltroProps<T> {
  readonly coluna: ColunaTabela<T>;
  /** Todas as linhas da tabela (base para categorias e faixas). */
  readonly linhas: readonly T[];
  readonly filtro: Filtro | undefined;
  readonly onChange: (filtro: Filtro | undefined) => void;
  /** Botão que abriu o painel (referência de posição). */
  readonly ancora: HTMLElement;
  readonly onFechar: () => void;
}

/** Largura do painel, em px. */
const LARGURA = 288;

/** Formata números no locale ativo. */
const formatoNumero = { format: (n: number): string => new Intl.NumberFormat(localeNumeros(), { maximumFractionDigits: 4 }).format(n) };

/**
 * Painel de filtro de uma coluna.
 */
export function PopoverFiltro<T>({
  coluna,
  linhas,
  filtro,
  onChange,
  ancora,
  onFechar,
}: PopoverFiltroProps<T>): JSX.Element {
  const refPainel = useRef<HTMLDivElement>(null);
  const { t } = usePreferencias();
  const tf = t.filtro;
  const [posicao, setPosicao] = useState({ top: 0, left: 0 });
  const idTitulo = useId();

  // --- Posição: abaixo da âncora, contida na janela ---------------------
  useLayoutEffect(() => {
    const posicionar = (): void => {
      const caixa = ancora.getBoundingClientRect();
      const left = Math.min(
        Math.max(caixa.right - LARGURA, 8),
        window.innerWidth - LARGURA - 8,
      );
      setPosicao({ top: caixa.bottom + 6, left });
    };
    posicionar();
    window.addEventListener('scroll', posicionar, true);
    window.addEventListener('resize', posicionar);
    return () => {
      window.removeEventListener('scroll', posicionar, true);
      window.removeEventListener('resize', posicionar);
    };
  }, [ancora]);

  // --- Fecha com Escape ou clique fora ---------------------------------
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') {
        onFechar();
        ancora.focus();
      }
    };
    const aoClicar = (evento: PointerEvent): void => {
      const alvo = evento.target as Node;
      if (!refPainel.current?.contains(alvo) && !ancora.contains(alvo)) onFechar();
    };
    window.addEventListener('keydown', aoTeclar);
    window.addEventListener('pointerdown', aoClicar);
    return () => {
      window.removeEventListener('keydown', aoTeclar);
      window.removeEventListener('pointerdown', aoClicar);
    };
  }, [ancora, onFechar]);

  // Foca o primeiro campo ao abrir.
  useEffect(() => {
    refPainel.current?.querySelector<HTMLElement>('input, select')?.focus();
  }, []);

  return createPortal(
    <motion.div
      ref={refPainel}
      role="dialog"
      aria-labelledby={idTitulo}
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, ease: EASE_SCIENTATA }}
      style={{ top: posicao.top, left: posicao.left, width: LARGURA }}
      className="fixed z-50 origin-top-right border border-line-forte bg-elevated shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p id={idTitulo} className="rotulo truncate">
          {tf.titulo} · <span className="text-ink">{coluna.titulo}</span>
        </p>
        <span className="chip shrink-0 text-[0.625rem]">{tf.tipos[coluna.tipo]}</span>
      </div>

      <div className="p-4">
        {coluna.tipo === 'texto' && (
          <FiltroTexto filtro={filtro?.tipo === 'texto' ? filtro : undefined} onChange={onChange} />
        )}
        {coluna.tipo === 'categoria' && (
          <FiltroCategoria
            coluna={coluna}
            linhas={linhas}
            filtro={filtro?.tipo === 'categoria' ? filtro : undefined}
            onChange={onChange}
          />
        )}
        {coluna.tipo === 'numero' && (
          <FiltroNumero
            coluna={coluna}
            linhas={linhas}
            filtro={filtro?.tipo === 'numero' ? filtro : undefined}
            onChange={onChange}
          />
        )}
        {coluna.tipo === 'data' && (
          <FiltroData filtro={filtro?.tipo === 'data' ? filtro : undefined} onChange={onChange} />
        )}
      </div>

      <div className="flex justify-between border-t border-line px-4 py-2.5">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          disabled={!filtro}
          className="rotulo hover:text-signal disabled:opacity-40"
        >
          {tf.limpar}
        </button>
        <button
          type="button"
          onClick={() => {
            onFechar();
            ancora.focus(); // devolve o foco ao botão de filtro, como no Escape
          }}
          className="rotulo text-signal hover:text-ink"
        >
          {tf.concluir}
        </button>
      </div>
    </motion.div>,
    document.body,
  );
}

// ==========================================================
// Editores por tipo
// ==========================================================

type FiltroDe<K extends Filtro['tipo']> = Extract<Filtro, { tipo: K }>;

/** Caixa de seleção compacta no estilo da aplicação. */
function Marcador({
  rotulo,
  marcado,
  onChange,
}: {
  readonly rotulo: string;
  readonly marcado: boolean;
  readonly onChange: (marcado: boolean) => void;
}): JSX.Element {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted hover:text-ink">
      <input
        type="checkbox"
        checked={marcado}
        onChange={(evento) => onChange(evento.target.checked)}
        className="size-3.5 accent-[var(--signal-fill)]"
      />
      {rotulo}
    </label>
  );
}

function FiltroTexto({
  filtro,
  onChange,
}: {
  readonly filtro: FiltroDe<'texto'> | undefined;
  readonly onChange: (filtro: Filtro | undefined) => void;
}): JSX.Element {
  const tf = usePreferencias().t.filtro;
  const atual: FiltroDe<'texto'> = filtro ?? { tipo: 'texto', modo: 'contem', termo: '', ocultarVazios: false };

  return (
    <div className="space-y-3">
      <select
        aria-label={tf.condicao}
        className="campo"
        value={atual.modo}
        onChange={(evento) => onChange({ ...atual, modo: evento.target.value as ModoTexto })}
      >
        {(Object.keys(tf.modos) as ModoTexto[]).map((modo) => (
          <option key={modo} value={modo}>
            {tf.modos[modo]}
          </option>
        ))}
      </select>
      <input
        type="text"
        aria-label={tf.termoAria}
        className="campo"
        placeholder={tf.termoPlaceholder}
        value={atual.termo}
        maxLength={200}
        onChange={(evento) => onChange({ ...atual, termo: evento.target.value })}
      />
      <Marcador
        rotulo={tf.ocultarVazias}
        marcado={atual.ocultarVazios}
        onChange={(ocultarVazios) => onChange({ ...atual, ocultarVazios })}
      />
    </div>
  );
}

function FiltroCategoria<T>({
  coluna,
  linhas,
  filtro,
  onChange,
}: {
  readonly coluna: ColunaTabela<T>;
  readonly linhas: readonly T[];
  readonly filtro: FiltroDe<'categoria'> | undefined;
  readonly onChange: (filtro: Filtro | undefined) => void;
}): JSX.Element {
  const [busca, setBusca] = useState('');
  const tf = usePreferencias().t.filtro;

  // Valores distintos com a respectiva contagem, em ordem alfabética.
  const opcoes = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const linha of linhas) {
      const chave = chaveCategoria(coluna, linha);
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }
    return [...contagem.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  }, [coluna, linhas]);

  const todos = opcoes.map(([valor]) => valor);
  const selecionados = new Set(filtro ? filtro.selecionados : todos);
  const termo = normalizarChave(busca);
  const visiveis = termo ? opcoes.filter(([valor]) => normalizarChave(valor).includes(termo)) : opcoes;

  /** Grava a seleção; selecionar tudo equivale a remover o filtro. */
  const aplicar = (conjunto: Set<string>): void => {
    if (conjunto.size === todos.length) onChange(undefined);
    else onChange({ tipo: 'categoria', selecionados: todos.filter((valor) => conjunto.has(valor)) });
  };

  const alternar = (valor: string, marcado: boolean): void => {
    const proximo = new Set(selecionados);
    if (marcado) proximo.add(valor);
    else proximo.delete(valor);
    aplicar(proximo);
  };

  return (
    <div className="space-y-3">
      {opcoes.length > 8 && (
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-faint" />
          <input
            type="search"
            aria-label={tf.buscarValores}
            className="campo pl-8"
            placeholder={tf.buscarValores}
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          className="rotulo hover:text-signal"
          onClick={() => aplicar(new Set([...selecionados, ...visiveis.map(([v]) => v)]))}
        >
          {termo ? tf.marcarVisiveis : tf.marcarTodos}
        </button>
        <button
          type="button"
          className="rotulo hover:text-signal"
          onClick={() => {
            const proximo = new Set(selecionados);
            for (const [valor] of visiveis) proximo.delete(valor);
            aplicar(proximo);
          }}
        >
          {tf.desmarcar}
        </button>
      </div>

      <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
        {visiveis.map(([valor, quantidade]) => (
          <li key={valor} className="flex items-start justify-between gap-2">
            <label className="flex min-w-0 cursor-pointer items-start gap-2 text-xs text-ink/85 hover:text-ink">
              <input
                type="checkbox"
                checked={selecionados.has(valor)}
                onChange={(evento) => alternar(valor, evento.target.checked)}
                className="mt-0.5 size-3.5 shrink-0 accent-[var(--signal-fill)]"
              />
              <span className="break-words">{valor}</span>
            </label>
            <span className="shrink-0 font-mono text-[0.625rem] text-faint tabular-nums">{quantidade}</span>
          </li>
        ))}
        {visiveis.length === 0 && <li className="text-xs text-faint">{tf.nenhumValor}</li>}
      </ul>
    </div>
  );
}

function FiltroNumero<T>({
  coluna,
  linhas,
  filtro,
  onChange,
}: {
  readonly coluna: ColunaTabela<T>;
  readonly linhas: readonly T[];
  readonly filtro: FiltroDe<'numero'> | undefined;
  readonly onChange: (filtro: Filtro | undefined) => void;
}): JSX.Element {
  const tf = usePreferencias().t.filtro;
  const atual: FiltroDe<'numero'> = filtro ?? { tipo: 'numero', min: null, max: null, ocultarVazios: false };

  // Texto dos campos é local, para aceitar digitação parcial ("1,").
  const [textoMin, setTextoMin] = useState(atual.min === null ? '' : String(atual.min).replace('.', ','));
  const [textoMax, setTextoMax] = useState(atual.max === null ? '' : String(atual.max).replace('.', ','));

  const faixa = useMemo(() => {
    let menor = Infinity;
    let maior = -Infinity;
    for (const linha of linhas) {
      const valor = coluna.valor(linha);
      if (typeof valor === 'number' && Number.isFinite(valor)) {
        menor = Math.min(menor, valor);
        maior = Math.max(maior, valor);
      }
    }
    return Number.isFinite(menor) ? { menor, maior } : null;
  }, [coluna, linhas]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1.5">
          <span className="rotulo block">{tf.minimo}</span>
          <input
            type="text"
            inputMode="decimal"
            className="campo font-mono"
            placeholder={faixa ? formatoNumero.format(faixa.menor) : '—'}
            value={textoMin}
            onChange={(evento) => {
              setTextoMin(evento.target.value);
              onChange({ ...atual, min: lerNumero(evento.target.value) });
            }}
          />
        </label>
        <label className="space-y-1.5">
          <span className="rotulo block">{tf.maximo}</span>
          <input
            type="text"
            inputMode="decimal"
            className="campo font-mono"
            placeholder={faixa ? formatoNumero.format(faixa.maior) : '—'}
            value={textoMax}
            onChange={(evento) => {
              setTextoMax(evento.target.value);
              onChange({ ...atual, max: lerNumero(evento.target.value) });
            }}
          />
        </label>
      </div>
      {faixa && (
        <p className="text-[0.6875rem] text-faint">
          {tf.faixa(formatoNumero.format(faixa.menor), formatoNumero.format(faixa.maior))}
        </p>
      )}
      <Marcador
        rotulo={tf.ocultarSemValor}
        marcado={atual.ocultarVazios}
        onChange={(ocultarVazios) => onChange({ ...atual, ocultarVazios })}
      />
    </div>
  );
}

function FiltroData({
  filtro,
  onChange,
}: {
  readonly filtro: FiltroDe<'data'> | undefined;
  readonly onChange: (filtro: Filtro | undefined) => void;
}): JSX.Element {
  const tf = usePreferencias().t.filtro;
  const atual: FiltroDe<'data'> = filtro ?? { tipo: 'data', de: null, ate: null };

  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="space-y-1.5">
        <span className="rotulo block">{tf.de}</span>
        <input
          type="date"
          className="campo font-mono"
          value={atual.de ?? ''}
          onChange={(evento) => onChange({ ...atual, de: evento.target.value || null })}
        />
      </label>
      <label className="space-y-1.5">
        <span className="rotulo block">{tf.ate}</span>
        <input
          type="date"
          className="campo font-mono"
          value={atual.ate ?? ''}
          onChange={(evento) => onChange({ ...atual, ate: evento.target.value || null })}
        />
      </label>
    </div>
  );
}
