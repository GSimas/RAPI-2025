/**
 * ==========================================================
 * <LimiteErro /> - Error Boundary granular
 * ==========================================================
 *
 * Isola falhas de renderização (um gráfico com dado atípico, um chunk que
 * não carregou) para que apenas aquele trecho mostre o aviso, sem derrubar
 * o restante do painel. "Tentar novamente" remonta o conteúdo; se a falha
 * foi o download de um chunk (comum logo após um novo deploy), recarrega a
 * página para buscar os arquivos novos.
 */

import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Component, type ErrorInfo, type JSX, type ReactNode } from 'react';
import { usePreferencias } from '@/hooks/usePreferencias';

interface LimiteErroProps {
  readonly children: ReactNode;
  /** Classes extras do aviso (ex.: altura mínima igual à do gráfico, evitando salto de layout). */
  readonly className?: string;
}

interface EstadoLimite {
  readonly erro: Error | null;
}

/** Falha ao baixar um módulo dinâmico (`import()`), que só se resolve recarregando. */
function ehFalhaDeChunk(erro: Error): boolean {
  return /dynamically imported module|importing a module script failed|error loading dynamically/i.test(
    erro.message,
  );
}

export class LimiteErro extends Component<LimiteErroProps, EstadoLimite> {
  override state: EstadoLimite = { erro: null };

  static getDerivedStateFromError(erro: Error): EstadoLimite {
    return { erro };
  }

  override componentDidCatch(erro: Error, info: ErrorInfo): void {
    console.error('[LimiteErro]', erro, info.componentStack);
  }

  private readonly tentarNovamente = (): void => {
    if (this.state.erro && ehFalhaDeChunk(this.state.erro)) window.location.reload();
    else this.setState({ erro: null });
  };

  override render(): ReactNode {
    if (!this.state.erro) return this.props.children;
    return <AvisoFalha className={this.props.className} onTentar={this.tentarNovamente} />;
  }
}

function AvisoFalha({
  className = '',
  onTentar,
}: {
  readonly className?: string | undefined;
  readonly onTentar: () => void;
}): JSX.Element {
  const te = usePreferencias().t.erro;

  return (
    <div role="alert" className={`card flex flex-col items-start justify-center gap-3 p-6 ${className}`}>
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-semaforo-amarelo" />
        {te.titulo}
      </p>
      <p className="text-sm text-muted">{te.texto}</p>
      <button type="button" onClick={onTentar} className="botao-secundario group">
        <RotateCcw
          aria-hidden="true"
          className="size-4 transition-transform duration-500 group-hover:-rotate-180"
        />
        {te.tentar}
      </button>
    </div>
  );
}
