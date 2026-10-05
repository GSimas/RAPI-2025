/**
 * Total de indicadores do RAPI, calculado no build (ver `vite.config.ts`).
 *
 * Fica separado de `dataset.ts` para que a página inicial, que só exibe
 * este número, não precise baixar e normalizar o JSON completo.
 */
export const TOTAL_INDICADORES: number = __TOTAL_INDICADORES__;
