/**
 * ==========================================================
 * <BotoesExportar /> - download do recorte em CSV ou XLSX
 * ==========================================================
 *
 * Exporta exatamente as linhas visíveis (filtros e ordenação aplicados).
 * Números seguem como números no XLSX; o gerador de XLSX é carregado
 * sob demanda no primeiro uso.
 */

import { FileSpreadsheet, FileText } from 'lucide-react';
import { useState, type JSX } from 'react';
import { usePreferencias } from '@/hooks/usePreferencias';
import { baixarBlob, baixarCsv, carimboData, montarCsv } from '@/lib/csv';
import type { ColunaTabela, ValorBruto } from './modelo';

interface BotoesExportarProps<T> {
  readonly colunas: readonly ColunaTabela<T>[];
  readonly linhas: readonly T[];
  readonly nomeArquivo: string;
  readonly tituloPlanilha: string;
}

/**
 * Par de botões de exportação.
 */
export function BotoesExportar<T>({
  colunas,
  linhas,
  nomeArquivo,
  tituloPlanilha,
}: BotoesExportarProps<T>): JSX.Element {
  const [gerando, setGerando] = useState(false);
  const { t } = usePreferencias();
  const tt = t.tabela;
  const vazio = linhas.length === 0;

  const matriz = (): ValorBruto[][] => linhas.map((linha) => colunas.map((coluna) => coluna.valor(linha)));
  const cabecalhos = colunas.map((coluna) => coluna.titulo);
  const nomeBase = `${nomeArquivo}-${carimboData()}`;

  const exportarCsv = (): void => {
    baixarCsv(`${nomeBase}.csv`, montarCsv(cabecalhos, matriz()));
  };

  const exportarXlsx = async (): Promise<void> => {
    setGerando(true);
    try {
      const { gerarXlsx } = await import('@/lib/xlsx');
      baixarBlob(`${nomeBase}.xlsx`, gerarXlsx(cabecalhos, matriz(), tituloPlanilha));
    } finally {
      setGerando(false);
    }
  };

  const classe =
    'group inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-ink hover:text-signal disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div role="group" aria-label={tt.exportar} className="inline-flex divide-x divide-line border border-line-forte">
      <button type="button" onClick={exportarCsv} disabled={vazio} className={classe} title={tt.csvTitulo}>
        <FileText aria-hidden="true" className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
        CSV
      </button>
      <button
        type="button"
        onClick={() => void exportarXlsx()}
        disabled={vazio || gerando}
        className={classe}
        title={tt.excelTitulo}
      >
        <FileSpreadsheet aria-hidden="true" className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
        {gerando ? tt.gerando : 'Excel'}
      </button>
    </div>
  );
}
