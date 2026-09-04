/**
 * ==========================================================
 * RAG leve por relevância de palavras-chave
 * ==========================================================
 *
 * Porte da função `buscar_contexto_relevante` do `app.py`, com uma
 * correção importante de fragmentação.
 *
 * O original dividia o relatório por `\n\n`. Como o `TEXTO_RAPI_COMPLETO`
 * é um bloco com quebras simples, essa divisão produzia apenas 2 pedaços
 * gigantes — na prática, o texto inteiro (~84 mil caracteres) viajava em
 * cada pergunta. Aqui o corpus é quebrado pelos títulos numerados do
 * relatório (`7.1.1`, `8.`, `a)`…) e, quando um trecho ainda fica longo,
 * em janelas menores. O resultado é o mesmo algoritmo de pontuação,
 * porém injetando só os fragmentos realmente relevantes — o que preserva
 * tokens e mantém o uso dentro do Free Tier.
 */

/** Quantidade de fragmentos injetados por pergunta. */
const TOP_N_PADRAO = 3;

/** Tamanho máximo de um fragmento, em caracteres. */
const TAMANHO_MAXIMO_FRAGMENTO = 1_400;

/** Teto de caracteres do contexto montado, como salvaguarda de custo. */
const ORCAMENTO_CONTEXTO = 4_500;

/** Comprimento mínimo para um fragmento ser considerado. */
const TAMANHO_MINIMO_FRAGMENTO = 50;

/**
 * Reconhece o início de uma seção do relatório:
 * `7.`, `7.1`, `7.1.1`, `a)`, `b)` ou títulos em caixa alta.
 */
const INICIO_DE_SECAO = /^(?:\d+(?:\.\d+)*\.?\s+\S|[a-z]\)\s)/;

/** Palavras com 4+ caracteres, usadas na pontuação de relevância. */
const PALAVRAS_RELEVANTES = /[\p{L}\p{N}_]{4,}/gu;

/**
 * Quebra o corpus em fragmentos coesos.
 *
 * A quebra ocorre nos títulos numerados; blocos que ainda excedem
 * `TAMANHO_MAXIMO_FRAGMENTO` são subdivididos por linha, preservando
 * frases inteiras.
 */
export function fragmentarCorpus(textoCompleto: string): string[] {
  const linhas = textoCompleto.split('\n');
  const blocos: string[] = [];
  let atual: string[] = [];

  const fecharBloco = (): void => {
    const bloco = atual.join(' ').replace(/\s+/g, ' ').trim();
    if (bloco.length >= TAMANHO_MINIMO_FRAGMENTO) blocos.push(bloco);
    atual = [];
  };

  for (const linha of linhas) {
    const limpa = linha.trim();
    if (limpa === '') continue;

    // Um novo título fecha o bloco anterior.
    if (INICIO_DE_SECAO.test(limpa) && atual.length > 0) fecharBloco();

    atual.push(limpa);

    // Bloco longo demais: fecha para manter os fragmentos enxutos.
    if (atual.join(' ').length >= TAMANHO_MAXIMO_FRAGMENTO) fecharBloco();
  }
  fecharBloco();

  return blocos;
}

/**
 * Extrai o conjunto de palavras relevantes de um texto.
 *
 * Os acentos são removidos antes da comparação: quem pergunta "consumo de
 * agua" deve encontrar os mesmos trechos de quem escreve "água". Sem essa
 * dobra, perguntas sem acentuação — a maioria, na prática — pontuavam zero
 * nas palavras mais importantes e o RAG devolvia trechos irrelevantes.
 */
function palavrasDe(texto: string): Set<string> {
  const semAcento = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return new Set(semAcento.match(PALAVRAS_RELEVANTES) ?? []);
}

/** Corpus já fragmentado e indexado — calculado uma única vez por instância. */
interface IndiceRag {
  readonly fragmentos: readonly string[];
  readonly vocabularios: readonly Set<string>[];
}

let indiceCache: IndiceRag | null = null;

/**
 * Constrói (e memoriza) o índice do corpus.
 *
 * Como as Netlify Functions reaproveitam a mesma instância entre
 * invocações próximas, o índice costuma ser montado apenas uma vez.
 */
function obterIndice(textoCompleto: string): IndiceRag {
  if (indiceCache) return indiceCache;

  const fragmentos = fragmentarCorpus(textoCompleto);
  indiceCache = {
    fragmentos,
    vocabularios: fragmentos.map(palavrasDe),
  };
  return indiceCache;
}

/**
 * Seleciona os fragmentos mais relevantes para a pergunta.
 *
 * A pontuação é o tamanho da interseção entre as palavras (4+ letras) da
 * pergunta e as do fragmento — exatamente o critério do original. Apenas
 * fragmentos com pelo menos uma correspondência entram no resultado.
 *
 * @param pergunta Texto da pergunta do usuário.
 * @param textoCompleto Corpus integral do relatório.
 * @param topN Número máximo de fragmentos retornados.
 * @returns Trechos concatenados, ou string vazia se nada for relevante.
 */
export function buscarContextoRelevante(
  pergunta: string,
  textoCompleto: string,
  topN: number = TOP_N_PADRAO,
): string {
  const palavrasPergunta = palavrasDe(pergunta);
  if (palavrasPergunta.size === 0) return '';

  const { fragmentos, vocabularios } = obterIndice(textoCompleto);

  const pontuados = fragmentos.map((fragmento, indice) => {
    const vocabulario = vocabularios[indice];
    let pontos = 0;

    if (vocabulario) {
      for (const palavra of palavrasPergunta) {
        if (vocabulario.has(palavra)) pontos += 1;
      }
    }

    return { fragmento, pontos };
  });

  const melhores = pontuados
    .filter((item) => item.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, topN);

  // Respeita o orçamento de caracteres, cortando os fragmentos excedentes.
  const selecionados: string[] = [];
  let total = 0;

  for (const { fragmento } of melhores) {
    if (total + fragmento.length > ORCAMENTO_CONTEXTO) break;
    selecionados.push(fragmento);
    total += fragmento.length;
  }

  return selecionados.join('\n...\n');
}
