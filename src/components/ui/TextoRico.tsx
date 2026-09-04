/**
 * ==========================================================
 * <TextoRico /> - negrito inline sem HTML bruto
 * ==========================================================
 *
 * O dashboard Streamlit original usava `unsafe_allow_html=True` para
 * aplicar `<b>` no meio dos parágrafos. Aqui o mesmo efeito é obtido de
 * forma segura: os textos guardam marcadores `**assim**` e este componente
 * os converte em elementos React — sem `dangerouslySetInnerHTML`.
 */

import { Fragment, type JSX } from 'react';

/** Divide o texto mantendo os delimitadores `**` nos grupos capturados. */
const PADRAO_NEGRITO = /(\*\*[^*]+\*\*)/g;

interface TextoRicoProps {
  /** Texto com marcadores `**negrito**`. */
  readonly texto: string;
}

/**
 * Renderiza um texto convertendo `**trechos**` em `<strong>`.
 *
 * @example <TextoRico texto="Total de **205 indicadores** no relatório." />
 */
export function TextoRico({ texto }: TextoRicoProps): JSX.Element {
  const partes = texto.split(PADRAO_NEGRITO);

  return (
    <>
      {partes.map((parte, indice) => {
        if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) {
          return (
            <strong key={indice} className="font-semibold text-slate-900 dark:text-slate-100">
              {parte.slice(2, -2)}
            </strong>
          );
        }
        return <Fragment key={indice}>{parte}</Fragment>;
      })}
    </>
  );
}
