/**
 * ==========================================================
 * <Select /> - campo de seleção rotulado
 * ==========================================================
 *
 * Equivalente ao `st.selectbox`: um `<select>` nativo (leve, acessível e
 * com boa ergonomia em telas de toque) acompanhado de rótulo associado.
 */

import { useId, type JSX } from 'react';

/** Uma opção da lista. */
export interface OpcaoSelect {
  readonly valor: string;
  readonly rotulo: string;
}

interface SelectProps {
  readonly rotulo: string;
  readonly valor: string;
  readonly opcoes: readonly OpcaoSelect[];
  readonly onChange: (valor: string) => void;
  /** Desabilita o campo (ex.: quando há uma única opção possível). */
  readonly desabilitado?: boolean;
  /** Texto auxiliar exibido abaixo do campo. */
  readonly ajuda?: string;
}

/**
 * Campo de seleção controlado, com rótulo e texto de ajuda opcionais.
 */
export function Select({
  rotulo,
  valor,
  opcoes,
  onChange,
  desabilitado = false,
  ajuda,
}: SelectProps): JSX.Element {
  const id = useId();
  const idAjuda = `${id}-ajuda`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="rotulo-campo">
        {rotulo}
      </label>

      <select
        id={id}
        className="campo disabled:cursor-not-allowed disabled:opacity-60"
        value={valor}
        disabled={desabilitado || opcoes.length === 0}
        onChange={(evento) => onChange(evento.target.value)}
        aria-describedby={ajuda ? idAjuda : undefined}
      >
        {opcoes.length === 0 && <option value="">— sem opções —</option>}
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>

      {ajuda && (
        <p id={idAjuda} className="text-xs text-slate-500 dark:text-slate-400">
          {ajuda}
        </p>
      )}
    </div>
  );
}
