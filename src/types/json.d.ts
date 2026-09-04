/**
 * Declaracao para importacao de arquivos `.json`.
 *
 * `resolveJsonModule` esta desligado de proposito: deixar o TypeScript
 * inferir o tipo literal de um arquivo com 206 objetos deixa a checagem
 * lenta e produz tipos pouco uteis. O arquivo entra como `unknown` e e
 * validado/normalizado em runtime por `src/lib/dataset.ts`.
 */
declare module '*.json' {
  const conteudo: unknown;
  export default conteudo;
}
