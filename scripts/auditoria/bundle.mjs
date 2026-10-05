/**
 * Tamanho do JS inicial (o que o `index.html` carrega antes de pintar) e
 * total de chunks, sem compressão / gzip / brotli. Rode depois de `npm run build`.
 *
 *   node scripts/auditoria/bundle.mjs [pasta-dist]
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const dist = process.argv[2] ?? 'dist';
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const iniciais = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1]);
const todos = readdirSync(join(dist, 'assets'))
  .filter((arquivo) => arquivo.endsWith('.js'))
  .map((arquivo) => `assets/${arquivo}`);

function tamanhos(arquivos) {
  let bruto = 0;
  let gzip = 0;
  let brotli = 0;
  for (const arquivo of arquivos) {
    const conteudo = readFileSync(join(dist, arquivo));
    bruto += conteudo.length;
    gzip += gzipSync(conteudo, { level: 9 }).length;
    brotli += brotliCompressSync(conteudo).length;
  }
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  return `${kb(bruto)} | gzip ${kb(gzip)} | brotli ${kb(brotli)}`;
}

console.log(`JS inicial (${iniciais.length} arquivo(s)): ${tamanhos(iniciais)}`);
console.log(`JS total   (${todos.length} chunks, ${todos.length - iniciais.length} assíncronos): ${tamanhos(todos)}`);
