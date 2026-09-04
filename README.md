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
| Backend      | Netlify Functions (TypeScript)                          |
| IA           | `@google/genai` — Gemini 3.1 Flash Lite (preview)       |

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
│   ├── chat.ts                     # POST /api/chat — assistente Gemini
│   └── _lib/
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
    │   └── chatApi.ts              # Cliente de `/api/chat`
    ├── hooks/                      # useTheme, useFiltros
    ├── content/                    # Texto editorial das seções do relatório
    └── components/
        ├── layout/                 # Abas, Sidebar, Rodapé, SeletorTema, Créditos
        ├── apresentacao/           # Aba 1
        ├── dashboard/              # Aba 2
        ├── relatorio/              # Aba 3
        ├── explorador/             # Aba 4
        ├── chat/                   # Aba 5
        └── ui/                     # Select, CartaoExpansivel, TextoRico
```

---

## Rodando localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar a chave da API

```bash
cp .env.example .env
```

Edite `.env` e informe sua `GEMINI_API_KEY` (obtida em <https://aistudio.google.com/apikey>).

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

Aplicação em <http://localhost:5173>. O proxy do Vite traduz `/api/chat` para
`/.netlify/functions/chat`, reproduzindo o redirect do `netlify.toml`.

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
- redirect `/api/chat` → `/.netlify/functions/chat`
- fallback de SPA: `/*` → `/index.html` (status 200)

Passos:

1. Conecte o repositório no Netlify (as configurações são lidas do `netlify.toml`).
2. Em **Site configuration → Environment variables**, cadastre `GEMINI_API_KEY`.
3. Faça o deploy.

> A chave **nunca** é exposta ao navegador: o frontend fala apenas com `/api/chat`, e só a
> função serverless conhece a `GEMINI_API_KEY`.

---

## As cinco abas

| Aba                     | Conteúdo                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| 📖 Apresentação         | Seções 1–5 do relatório e gráfico de barras empilhadas da semaforização (2020-2024)       |
| 📊 Dashboard Interativo | Filtros encadeados, cartões de métricas, evolução histórica, faixas e dados brutos        |
| 📝 Relatório e Análises | Seções 7, 8 e 9 — considerações, recomendações e créditos                                  |
| 🗂️ Explorador Geral     | Tabela dos 206 registros com busca global, ordenação e exportação CSV                      |
| 🤖 Assistente IA        | Chat com o Gemini sobre os indicadores e o texto do relatório                              |

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
enxuto dos indicadores. Isso mantém o consumo dentro do *Free Tier* do Gemini.

---

## Fonte e créditos

- Dados originais extraídos do
  [Relatório RAPI 2025](https://materiais.floripamanha.org/rapi-relatorio-anual-progresso-indicadores-25)
  — Associação FloripAmanhã, UFSC e Observatório Social do Brasil (Florianópolis).
- Orgulhosamente desenvolvida por
  [Gustavo Simas da Silva](https://www.linkedin.com/in/simasgs/).

É permitida a reprodução parcial ou total deste material desde que citada a fonte
Rede Ver a Cidade Floripa, 2024-2025.
