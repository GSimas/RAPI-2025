/**
 * Declaracao de modulo JSON para as Netlify Functions.
 *
 * Assim como no frontend, `resolveJsonModule` fica desligado para nao
 * pagar o custo de inferir o tipo literal de um arquivo com 206 objetos.
 * O conteudo entra como `unknown` e e validado em runtime.
 */
declare module '*.json' {
  const conteudo: unknown;
  export default conteudo;
}
