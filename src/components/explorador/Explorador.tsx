/**
 * ==========================================================
 * Página - Explorador Geral
 * ==========================================================
 *
 * Substitui o `st.dataframe` do "Explorador Geral do Relatório RAPI".
 * Toda a interação (busca global, filtros por coluna, ordenação e
 * exportação CSV/XLSX) é feita no cliente por `<TabelaDados />`.
 */

import { useMemo, type JSX } from 'react';
import { Revelar } from '@/components/ui/Revelar';
import { TabelaDados } from '@/components/ui/tabela/TabelaDados';
import { TituloPagina } from '@/components/ui/Titulos';
import { usePreferencias } from '@/hooks/usePreferencias';
import { INDICADORES } from '@/lib/dataset';
import type { DefinicaoPagina } from '@/lib/navegacao';
import { criarColunas } from './colunas';

interface ExploradorProps {
  readonly pagina: DefinicaoPagina;
  readonly onInicio: () => void;
}

/**
 * Tabela completa dos indicadores.
 */
export function Explorador({ pagina, onInicio }: ExploradorProps): JSX.Element {
  const { t, idioma } = usePreferencias();
  const te = t.explorador;
  const colunas = useMemo(() => criarColunas(t), [t]);

  return (
    <div>
      <TituloPagina pagina={pagina} onInicio={onInicio}>
        {te.dadosOriginais && <p className="text-xs text-faint">{te.dadosOriginais}</p>}
      </TituloPagina>

      <Revelar>
        <TabelaDados
          // Os números exibidos mudam de formato com o idioma.
          key={idioma}
          colunas={colunas}
          linhas={INDICADORES}
          chaveLinha={(indicador) => indicador.id}
          legenda={te.legenda}
          nomeArquivo="rapi-2024-2025-indicadores"
          tituloPlanilha={te.planilha}
          buscaGlobal
        />
      </Revelar>

      <p className="mt-3 text-xs text-faint">{te.nota}</p>
    </div>
  );
}
