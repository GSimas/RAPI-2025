# Dashboard RAPI 2024-2025 · Florianópolis

Aplicação web (SPA) que dá visibilidade aos **205 indicadores** do Relatório Anual de
Progresso dos Indicadores (RAPI) de Florianópolis — 9ª edição, baseada na metodologia do
Programa Cidades Emergentes e Sustentáveis (CES) do BID.

Construída com **Vite + React + TypeScript + Tailwind CSS**, com backend serverless em
**Netlify Functions**.

> Migração da versão anterior em Python/Streamlit (`app.py`), preservando integralmente as
> regras de negócio: extração numérica, semaforização dinâmica e o assistente com IA.

---

## Stack

| Camada       | Tecnologia                                              |
| ------------ | ------------------------------------------------------- |
| Build        | Vite 7                                                  |
| UI           | React 19 + TypeScript 5.9 (modo estrito)                |
| Estilos      | Tailwind CSS v4 (configuração CSS-first), tema claro/escuro |
| Gráficos     | Recharts 3                                              |
| Movimento    | `motion` (transições, revelação ao rolar, indicadores)  |
| Exportação   | PNG (`html-to-image`), CSV e XLSX (`fflate`), no navegador |
| Backend      | Netlify Functions (TypeScript, respostas em streaming)  |
| IA           | Acesso do usuário: OpenRouter (OAuth PKCE) ou BYOK — OpenAI, Anthropic, Gemini, DeepSeek, Mistral, Groq, xAI |

---

## Estrutura do projeto

```
.
├── dados_rapi_completo.json        # Base dos 206 registros (fonte única)
├── index.html                      # Entrada da SPA (+ script anti-flash de tema)
├── netlify.toml                    # Build, functions e redirects
├── .env.example                    # Variáveis de ambiente documentadas
│
├── netlify/functions/
│   ├── chat.ts                     # POST /api/chat — assistente (streaming NDJSON)
│   ├── modelos.ts                  # POST /api/modelos — modelos por provedor / validação BYOK
│   └── _lib/
│       ├── provedores.ts           # Catálogo fixo de provedores (URLs só no servidor)
│       ├── conversa.ts             # Streaming OpenAI-compatível e Anthropic
│       ├── guardrails.ts           # Higiene, LGPD, anti-injeção, instrução de sistema, canário
│       ├── seguranca.ts            # Origem, limite de taxa, corpo, credencial
│       ├── corpus.ts               # Texto integral do relatório (base do RAG)
│       ├── rag.ts                  # Busca por relevância de palavras-chave
│       └── indicadoresCsv.ts       # CSV enxuto dos indicadores (economia de tokens)
│
└── src/
    ├── types/rapi.ts               # IndicadorRAPI, FaixasSemaforizacao, DadosAnuais…
    ├── lib/
    │   ├── numeroParser.ts         # Porte de `extrair_numero`
    │   ├── semaforo.ts             # Porte de `avaliar_cor_semaforo`
    │   ├── taxonomia.ts            # 3 dimensões → 12 pilares → 25 temas
    │   ├── dataset.ts              # Carga, normalização e filtros
    │   ├── serie.ts                # Série histórica de um indicador
    │   ├── format.ts               # Formatação pt-BR
    │   ├── paletaGrafico.ts        # Cores dos gráficos por tema
    │   ├── csv.ts                  # Exportação CSV no cliente
    │   ├── xlsx.ts                 # Gerador XLSX (carregado sob demanda)
    │   ├── chatApi.ts              # Cliente de `/api/chat` e `/api/modelos`
    │   ├── ia/                     # Provedores, sessão da credencial e login PKCE
    │   ├── navegacao.ts            # Páginas da SPA e roteamento por hash
    │   └── movimento.ts            # Curvas e variantes de animação (motion)
    ├── hooks/                      # useTheme, useFiltros, useBrilho (luz sob o cursor)
    ├── content/                    # Texto editorial das seções do relatório
    └── components/
        ├── layout/                 # Cabeçalho, Fundo, Marca, Rodapé, SeletorTema
        ├── apresentacao/           # Início: hero, números, módulos, seções 1-5
        ├── dashboard/              # Dashboard interativo
        ├── relatorio/              # Relatório e análises
        ├── explorador/             # Explorador geral
        ├── chat/                   # Assistente IA
        └── ui/                     # Títulos, Revelar, Segmentado, BotaoBaixarPng, tabela/…
```

---

## Rodando localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Variáveis de ambiente (opcional)

Nenhuma chave de IA é necessária no servidor: cada usuário traz o próprio acesso (login
OpenRouter ou chave BYOK). O `.env.example` documenta apenas o opcional `ALLOWED_ORIGINS`.

### 3. Servidor de desenvolvimento

**Opção A — Netlify CLI** (sobe o frontend **e** as functions de uma vez):

```bash
netlify dev
```

Aplicação em <http://localhost:8888>.

**Opção B — dois processos** (frontend e functions separados):

```bash
# terminal 1 — apenas as functions
netlify functions:serve --port 9999

# terminal 2 — apenas o frontend, com /api apontando para as functions
NETLIFY_FUNCTIONS_URL=http://localhost:9999 npm run dev
```

Aplicação em <http://localhost:5173>. O proxy do Vite traduz `/api/*` para
`/.netlify/functions/*`, reproduzindo os redirects do `netlify.toml`.

> Use a opção B se o `netlify dev` falhar ao preparar o ambiente Deno das Edge Functions
> (erro `EBUSY` no Windows, geralmente causado por antivírus). Este projeto não usa Edge
> Functions — a preparação do Deno é apenas overhead do CLI e não afeta o deploy.

**Opção C — só o frontend**, sem o assistente de IA:

```bash
npm run dev
```

### 4. Build de produção

```bash
npm run build
```

O script executa `tsc -b` antes do `vite build`: **qualquer erro de tipagem falha o build**.
A saída fica em `dist/`.

Para checar apenas os tipos:

```bash
npm run typecheck
```

---

## Deploy no Netlify

O `netlify.toml` já traz tudo configurado:

- `command = "npm run build"` · `publish = "dist"` · `functions = "netlify/functions"`
- redirects `/api/chat` e `/api/modelos` → `/.netlify/functions/*`
- fallback de SPA: `/*` → `/index.html` (status 200), que também atende o retorno do login
  OpenRouter em `/auth/openrouter`
- cabeçalhos de segurança: CSP restritiva, HSTS, COOP, `Permissions-Policy`, `nosniff`

Passos:

1. Conecte o repositório no Netlify (as configurações são lidas do `netlify.toml`).
2. Faça o deploy. Não há chave de IA a cadastrar.

---

## As cinco abas

| Aba                     | Conteúdo                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| 📖 Apresentação         | Seções 1–5 do relatório e gráfico de barras empilhadas da semaforização (2020-2024)       |
| 📊 Dashboard Interativo | Filtros encadeados, cartões de métricas, evolução histórica, faixas e dados brutos        |
| 📝 Relatório e Análises | Seções 7, 8 e 9 — considerações, recomendações e créditos                                  |
| 🗂️ Explorador Geral     | Tabela dos 206 registros com busca global, filtros por coluna, ordenação e exportação     |
| 🤖 Assistente IA        | Chat em streaming sobre os indicadores e o texto do relatório (OpenRouter ou BYOK)        |

Todos os gráficos têm botão **PNG**; todas as tabelas têm filtro por coluna conforme o tipo
(texto, categoria, número, data), ordenação por coluna e exportação **CSV** ou **Excel (XLSX)**
do recorte visível.

---

## Configurações e idiomas

A engrenagem no cabeçalho reúne **tema** claro/escuro, **idioma** PT/EN, **tamanho da letra**
(pequena, média, grande) e **reduzir movimento**. As escolhas valem na hora, ficam salvas no
navegador (`rapi-preferencias`) e são aplicadas antes da primeira pintura por `public/tema.js`.
"Reduzir movimento" começa igual à preferência do sistema operacional e desliga transições,
animações dos gráficos e o fundo animado.

- Textos da interface: `src/i18n/textos.ts` (a versão em inglês é tipada pela portuguesa).
- Conteúdo do relatório: `src/content/*.ts` (PT) e `src/content/*.en.ts` (EN, tradução livre).
  Nomes de indicadores, órgãos e faixas seguem no original.
- O assistente responde no idioma escolhido (cabeçalho `Accept-Language` enviado às funções).

---

## Assistente de IA

### Acesso

1. **OpenRouter (OAuth PKCE)** — opção em destaque. Login sem copiar chaves; o modelo padrão
   é `openrouter/free`, que roteia entre os modelos gratuitos. O usuário pode escolher qualquer
   modelo do catálogo (busca + filtro Grátis/Todos).
2. **BYOK** — chave própria da OpenAI, Anthropic, Google Gemini, DeepSeek, Mistral, Groq, xAI ou
   OpenRouter. A chave é validada listando os modelos disponíveis para ela.

A credencial fica no `sessionStorage` (ou no `localStorage`, se o usuário marcar "Lembrar"),
viaja só no cabeçalho `Authorization` para `/api/*` e nunca é registrada em log.

### Guardrails e segurança

- **Servidor**: verificação de origem, limite de taxa por IP, limite de tamanho do corpo,
  catálogo fixo de provedores (sem SSRF), validação do id de modelo, tempo limite.
- **Entrada**: normalização Unicode, remoção de caracteres invisíveis, mascaramento de
  e-mail/CPF/CNPJ/telefone/chaves antes do envio ao provedor (LGPD), recusa de tentativas de
  injeção de prompt sem chamar o modelo, neutralização de delimitadores.
- **Prompt**: escopo restrito ao RAPI, fidelidade aos dados, neutralidade político-partidária,
  conteúdo de usuário e do relatório isolado como dado.
- **Saída**: canário na instrução de sistema interrompe vazamentos; tamanho máximo; renderização
  de Markdown sem HTML (sem `dangerouslySetInnerHTML`).
- **Login PKCE**: `code_challenge` S256, `state` anti-CSRF, verificador de uso único com
  validade de 10 minutos e limpeza da URL.

### Transparência (ISO/IEC 42001)

Toda conversa começa com um aviso de que o usuário interage com um sistema de IA, informando
finalidade, provedor e modelo em uso, limitações, tratamento de dados, controles aplicados,
supervisão humana e canal de contato. Cada resposta indica o modelo que a gerou.

---

## Regras de negócio preservadas

### Extração numérica (`src/lib/numeroParser.ts`)

Porte fiel de `extrair_numero`. Os valores do relatório chegam "sujos" e a função:

1. descarta vazios e o literal `ND`;
2. isola o trecho **após** o `=` em memórias de cálculo;
3. remove notas de rodapé entre parênteses;
4. captura o primeiro número (milhar brasileiro ou decimal simples);
5. desambigua os separadores: ponto é milhar apenas quando todos os grupos têm 3 dígitos.

```
'178,9 litros'          → 178.9
'1080 unidades'         → 1080
'212.303'               → 212303
'1.282,34'              → 1282.34
'10.18%'                → 10.18
'4.523/18.800 = 24,05%' → 24.05
'334,3 km/(base 2022)'  → 334.3
'ND'                    → null
```

### Semaforização dinâmica (`src/lib/semaforo.ts`)

Porte fiel de `avaliar_cor_semaforo`. Interpreta as faixas escritas em linguagem natural:

- intervalos: `120–200`, `75% a 90%`, `10 até 20`;
- operadores: `<`, `<=`, `≤`, `>`, `>=`, `≥`, `abaixo`, `acima`, `menor`, `maior`, `mínimo`, `máximo`;
- condições compostas: `< 80 ou > 250`.

Cores: verde `#2ca02c` · amarelo `#ff7f0e` · vermelho `#d62728` · neutro (rgba cinza/azul).

> Ambos os portes foram validados contra a implementação Python original em todas as
> **1.236** combinações indicador × ano do dataset, com **zero divergências**.

### RAG leve (`netlify/functions/_lib/rag.ts`)

O corpus (84 mil caracteres) é fragmentado pelos títulos numerados do relatório e pontuado
por interseção de palavras-chave (4+ letras, sem acento) com a pergunta. Só os **3 trechos
mais relevantes** — limitados a ~4.500 caracteres — são injetados no prompt, junto de um CSV
enxuto dos indicadores. Isso mantém o consumo baixo — inclusive nos modelos gratuitos.

---

## Fonte e créditos

- Dados originais extraídos do
  [Relatório RAPI 2025](https://materiais.floripamanha.org/rapi-relatorio-anual-progresso-indicadores-25)
  — Associação FloripAmanhã, UFSC e Observatório Social do Brasil (Florianópolis).
- Orgulhosamente desenvolvida por
  [Gustavo Simas da Silva](https://www.linkedin.com/in/simasgs/).

É permitida a reprodução parcial ou total deste material desde que citada a fonte
Rede Ver a Cidade Floripa, 2024-2025.
