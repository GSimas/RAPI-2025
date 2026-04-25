# 📊 Dashboard RAPI Florianópolis 2024-2025

![Streamlit](https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Plotly](https://img.shields.io/badge/Plotly-239120?style=for-the-badge&logo=plotly&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_3.1_Flash_Lite-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)

Uma aplicação web interativa e inteligente desenvolvida para visualizar, analisar e interagir com o **9º Relatório Anual de Progresso dos Indicadores de Florianópolis (RAPI)**. O relatório monitora o desenvolvimento sustentável da cidade através de 205 indicadores ambientais, urbanos e fiscais, com base na metodologia do Programa Cidades Emergentes e Sustentáveis (CES) do BID.

## ✨ Principais Funcionalidades

- 📈 **Exploração Gráfica Interativa:** Gráficos Plotly dinâmicos que exibem a evolução histórica dos indicadores com rótulos adaptáveis e formatação numérica no padrão brasileiro.
- 🚦 **Semaforização Automatizada:** Lógica avançada em Python para interpretar regras de texto complexas (ex: `> 90 ou 120-200`) e colorir automaticamente as barras dos gráficos em Verde (Satisfatório), Amarelo (Atenção) ou Vermelho (Crítico).
- 🤖 **Consultor IA Integrado (Gemini 3.1 Flash-Lite):** Um chatbot nativo na aplicação capaz de cruzar dados e responder perguntas sobre o relatório.
  - *Arquitetura RAG (Retrieval-Augmented Generation):* Motor de busca leve embutido que fatia o texto completo do relatório e envia apenas o contexto relevante para a API, garantindo altíssima precisão, respostas rápidas e otimização extrema do consumo de tokens (Free Tier friendly).
- 🧹 **Tratamento de Dados Complexos (ETL):** Expressões regulares (RegEx) personalizadas para converter textos não-estruturados e memórias de cálculo (ex: `0,1631 m3 = 163,1 l/hab`) em dados numéricos limpos.
- 🌓 **Design Responsivo Light/Dark:** Interface 100% responsiva que se adapta automaticamente às preferências de tema do usuário no sistema operacional.
- 📥 **Exportação de Dados:** Tabela exploratória completa permitindo o download em CSV para auditorias e análises externas.

## 🛠️ Tecnologias Utilizadas

- **Linguagem:** Python 3.10+
- **Frontend/Framework:** Streamlit
- **Visualização de Dados:** Plotly Express & Plotly Graph Objects
- **Manipulação de Dados:** Pandas
- **Inteligência Artificial:** SDK `google-genai` (Modelo: `gemini-3.1-flash-lite-preview`)

## 🚀 Como Executar O Projeto Localmente

### 1. Clone o repositório
```bash
git clone [https://github.com/GSimas/RAPI-2025.git](https://github.com/GSimas/RAPI-2025.git)
cd RAPI-2025
```

### 2. Instale as dependências
Crie um ambiente virtual (opcional, mas recomendado) e instale os pacotes necessários:
```bash
pip install streamlit pandas plotly google-genai
```

### 3. Configure as Variáveis de Ambiente (API Key)
Para que o Chatbot com IA funcione, você precisa de uma chave de API do Google AI Studio.
Crie uma pasta oculta chamada `.streamlit` na raiz do projeto e dentro dela crie um arquivo chamado `secrets.toml`:

```toml
# Arquivo: .streamlit/secrets.toml
GEMINI_API_KEY = "SUA_CHAVE_DE_API_AQUI"
```

### 4. Execute a aplicação
```bash
streamlit run dashboard.py
```
O servidor será iniciado e a aplicação abrirá automaticamente no seu navegador padrão (normalmente em `http://localhost:8501`).

## 📍 Fonte dos Dados
Os dados originais foram extraídos do [Relatório RAPI 2024-2025](https://materiais.floripamanha.org/rapi-relatorio-anual-progresso-indicadores-25), uma iniciativa conjunta entre a Associação FloripAmanhã, a Universidade Federal de Santa Catarina (UFSC) e o Observatório Social do Brasil – Florianópolis.

## 👨‍💻 Créditos
Dashboard desenvolvida por **Gustavo Simas da Silva**. 
- [LinkedIn](https://www.linkedin.com/in/simasgs/)