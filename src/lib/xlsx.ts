/**
 * ==========================================================
 * Exportação para Excel (XLSX) no lado do cliente
 * ==========================================================
 *
 * Um XLSX é um pacote ZIP de arquivos XML (Office Open XML). Este módulo
 * monta o mínimo necessário — uma planilha, estilos e metadados — e o
 * compacta com `fflate`, sem depender de bibliotecas de planilha pesadas.
 *
 * A planilha sai pronta para análise: cabeçalho em negrito e congelado,
 * autofiltro do Excel na primeira linha, larguras de coluna ajustadas e
 * números gravados como números (não como texto).
 *
 * Importado sob demanda (`import()`), para não pesar o carregamento.
 */

import { strToU8, zipSync } from 'fflate';

/** Valor aceito numa célula. */
export type ValorCelula = string | number | null | undefined;

/** Escapa texto para XML, removendo caracteres de controle inválidos. */
function xml(texto: string): string {
  return texto
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Converte um índice de coluna (0, 1, …) em letras (A, B, …, AA). */
function letraColuna(indice: number): string {
  let n = indice + 1;
  let letras = '';
  while (n > 0) {
    const resto = (n - 1) % 26;
    letras = String.fromCharCode(65 + resto) + letras;
    n = Math.floor((n - 1) / 26);
  }
  return letras;
}

/** Nome de aba válido no Excel: até 31 caracteres, sem `[]:*?/\`. */
function nomeAba(nome: string): string {
  return nome.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31).trim() || 'Dados';
}

/** Monta uma célula XML (`s` é o índice do estilo). */
function celula(referencia: string, valor: ValorCelula, estilo: number): string {
  if (valor === null || valor === undefined || valor === '') {
    return `<c r="${referencia}" s="${estilo}"/>`;
  }
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return `<c r="${referencia}" s="${estilo}"><v>${valor}</v></c>`;
  }
  return `<c r="${referencia}" s="${estilo}" t="inlineStr"><is><t xml:space="preserve">${xml(String(valor))}</t></is></c>`;
}

/**
 * Gera o arquivo XLSX.
 *
 * @param cabecalhos Títulos das colunas.
 * @param linhas Matriz de valores alinhada aos cabecalhos.
 * @param titulo Nome da aba.
 */
export function gerarXlsx(
  cabecalhos: readonly string[],
  linhas: readonly ValorCelula[][],
  titulo: string,
): Blob {
  const ultimaColuna = letraColuna(Math.max(cabecalhos.length - 1, 0));
  const ultimaLinha = linhas.length + 1;

  // Largura de cada coluna: o maior conteúdo (limitado) entre cabeçalho e dados.
  const larguras = cabecalhos.map((cabecalho, coluna) => {
    let maior = cabecalho.length;
    for (const linha of linhas) {
      const valor = linha[coluna];
      if (valor !== null && valor !== undefined) maior = Math.max(maior, String(valor).length);
    }
    return Math.min(Math.max(maior + 2, 8), 60);
  });

  const xmlCabecalho = `<row r="1">${cabecalhos
    .map((titulo, coluna) => celula(`${letraColuna(coluna)}1`, titulo, 1))
    .join('')}</row>`;

  const xmlLinhas = linhas
    .map((linha, indice) => {
      const numero = indice + 2;
      const celulas = cabecalhos
        .map((_, coluna) => {
          const valor = linha[coluna];
          return celula(`${letraColuna(coluna)}${numero}`, valor, typeof valor === 'number' ? 3 : 2);
        })
        .join('');
      return `<row r="${numero}">${celulas}</row>`;
    })
    .join('');

  const planilha = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${larguras.map((largura, i) => `<col min="${i + 1}" max="${i + 1}" width="${largura}" customWidth="1"/>`).join('')}</cols>
<sheetData>${xmlCabecalho}${xmlLinhas}</sheetData>
<autoFilter ref="A1:${ultimaColuna}${ultimaLinha}"/>
</worksheet>`;

  // Estilos: 0 padrão, 1 cabeçalho (negrito, fundo), 2 texto com quebra, 3 número.
  const estilos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.##########"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFCF3F"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  const arquivos: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${xml(nomeAba(titulo))}" sheetId="1" r:id="rId1"/></sheets>
<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${xml(nomeAba(titulo)).replaceAll("'", "''")}'!$A$1:$${ultimaColuna}$${ultimaLinha}</definedName></definedNames>
</workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    'xl/worksheets/sheet1.xml': strToU8(planilha),
    'xl/styles.xml': strToU8(estilos),
  };

  const zip = zipSync(arquivos, { level: 6 });
  return new Blob([zip], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
