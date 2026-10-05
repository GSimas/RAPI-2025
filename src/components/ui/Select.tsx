/**
 * ==========================================================
 * <Select /> - campo de seleção rotulado
 * ==========================================================
 *
 * Equivalente ao `st.selectbox`: um `<select>` nativo (leve, acessível e
 * com boa ergonomia em telas de toque) com rótulo mono e seta própria.
 */

import { ChevronDown } from 'lucide-react';
import { useId, type JSX } from 'react';
import { usePreferencias } from '@/hooks/usePreferencias';

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
  const { t } = usePreferencias();

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="rotulo">
        {rotulo}
      </label>

      <div className="group relative">
        <select
          id={id}
          className="campo truncate disabled:cursor-not-allowed disabled:opacity-50"
          value={valor}
          disabled={desabilitado || opcoes.length === 0}
          onChange={(evento) => onChange(evento.target.value)}
          aria-describedby={ajuda ? idAjuda : undefined}
        >
          {opcoes.length === 0 && <option value="">{t.select.semOpcoes}</option>}
          {opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>

        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-faint transition-colors duration-300 group-hover:text-signal"
        />
      </div>

      {ajuda && (
        <p id={idAjuda} className="text-xs text-faint">
          {ajuda}
        </p>
      )}
    </div>
  );
}
