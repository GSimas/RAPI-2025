import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import json
import re

# ==========================================
# 1. CONFIGURAÇÃO DA PÁGINA
# ==========================================
st.set_page_config(
    page_title="Dashboard RAPI 2024-2025 - Florianópolis",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Estilização CSS Customizada para um visual Premium
# Estilização CSS que respeita o Tema (Light/Dark)
st.markdown("""
    <style>
    .metric-card {
        /* Usa a cor de fundo secundária do tema atual */
        background-color: var(--secondary-background-color); 
        /* Usa a cor de texto padrão do tema atual */
        color: var(--text-color);
        border-radius: 10px;
        padding: 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border-left: 5px solid #1f77b4;
        margin-bottom: 10px;
    }
    .titulo-indicador {
        color: #1f77b4; /* Azul mantém o destaque em ambos */
        font-weight: 700;
    }
    .texto-relatorio {
        font-size: 1.1rem;
        line-height: 1.6;
        color: var(--text-color); /* Texto do relatório adapta ao fundo */
        text-align: justify;
    }
    </style>
""", unsafe_allow_html=True)

# ==========================================
# 2. FUNÇÕES DE DADOS E LIMPEZA
# ==========================================
@st.cache_data
def carregar_dados():
    try:
        with open('dados_rapi_completo.json', 'r', encoding='utf-8') as f:
            dados = json.load(f)
        return pd.DataFrame(dados)
    except FileNotFoundError:
        st.error("⚠️ Arquivo 'dados_rapi_completo.json' não encontrado. Certifique-se de que ele está na mesma pasta deste script.")
        return pd.DataFrame()

def extrair_numero(valor):
    """
    Função avançada para extrair números de strings sujas.
    Lida com memórias de cálculo, decimais, milhares e números inteiros longos.
    """
    if pd.isna(valor) or valor is None or str(valor).strip().upper() == 'ND' or str(valor).strip() == '':
        return None
    
    valor_str = str(valor).strip()
    
    # Se houver um sinal de igual, o valor real do indicador está APÓS o igual
    if '=' in valor_str:
        valor_str = valor_str.split('=')[-1]
        
    # Remove qualquer coisa que esteja dentro de parênteses (ex: notas de rodapé)
    valor_str = valor_str.split('(')[0].strip() 
    
    # NOVA REGRA REGEX:
    # 1º tenta achar formato de milhares (ex: 1.282,34 ou 212.303)
    # 2º se não achar, captura números inteiros normais ou com decimal simples (ex: 1080, 2100, 10.18, 173,5)
    match = re.search(r'-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+(?:[.,]\d+)?', valor_str)
    
    if match:
        num_str = match.group(0)
        
        # 1. Tem Ponto e Vírgula (Ex: 1.282,34 -> 1282.34)
        if ',' in num_str and '.' in num_str:
            num_str = num_str.replace('.', '').replace(',', '.')
            
        # 2. Tem apenas Vírgula (Ex: 173,5 -> 173.5)
        elif ',' in num_str:
            num_str = num_str.replace(',', '.')
            
        # 3. Tem apenas Ponto (Pode ser decimal 10.18 ou milhares 212.303)
        elif '.' in num_str:
            partes = num_str.split('.')
            # Se todas as partes após o ponto tiverem exatamente 3 dígitos, é milhar! (Ex: 212.303)
            if all(len(p) == 3 for p in partes[1:]):
                num_str = num_str.replace('.', '')
            # Caso contrário, mantém o ponto pois é um decimal (Ex: 10.18)
        
        try:
            return float(num_str)
        except ValueError:
            return None
            
    return None

def avaliar_cor_semaforo(valor, faixas):
    """
    Determina a cor (Verde, Amarelo, Vermelho) avaliando regras lógicas complexas,
    como intervalos (A-B) e múltiplas condições separadas por 'ou'.
    """
    if valor is None or not faixas:
        return 'rgba(128, 128, 128, 0.5)' # Cinza para ND ou ausência de dados
    
    try:
        v = float(valor)
    except ValueError:
        return 'rgba(128, 128, 128, 0.5)'
        
    def avalia_condicao(regra_texto):
        if not regra_texto or str(regra_texto).strip() == '':
            return False
            
        # Padroniza texto: minúsculo, remove '%', troca vírgulas por pontos
        regra = str(regra_texto).lower().replace(',', '.').replace('%', '')
        
        # Unifica todos os tipos de separadores de intervalo para um hífen simples
        regra = regra.replace('–', '-').replace('—', '-').replace(' a ', '-').replace(' até ', '-')
        
        # Divide regras compostas (Ex: "< 80 ou > 250" vira duas regras separadas)
        condicoes = regra.split(' ou ')
        
        for cond in condicoes:
            # Extrai apenas os números contidos na condição atual
            nums = [float(n) for n in re.findall(r"\d+\.\d+|\d+", cond)]
            if not nums:
                continue
                
            # 1. Lógica para INTERVALOS (achou 2 ou mais números na mesma condição)
            if len(nums) >= 2:
                if min(nums[0], nums[1]) <= v <= max(nums[0], nums[1]):
                    return True
            
            # 2. Lógica para OPERADORES com 1 número (Ex: > 250, < 80)
            elif len(nums) == 1:
                limite = nums[0]
                if '<=' in cond or '≤' in cond or 'máximo' in cond:
                    if v <= limite: return True
                elif '<' in cond or 'abaixo' in cond or 'menor' in cond:
                    if v < limite: return True
                elif '>=' in cond or '≥' in cond or 'mínimo' in cond:
                    if v >= limite: return True
                elif '>' in cond or 'acima' in cond or 'maior' in cond:
                    if v > limite: return True
                elif 'igual' in cond or '==' in cond:
                    if v == limite: return True
        
        return False

    # Testa as regras na ordem (se atender, já retorna a cor)
    if avalia_condicao(faixas.get('verde')): return '#2ca02c'
    if avalia_condicao(faixas.get('amarelo')): return '#ff7f0e'
    if avalia_condicao(faixas.get('vermelho')): return '#d62728'
    
    # Se não se enquadrar em nenhuma (ou for regra de texto puro), volta ao azul original
    return 'rgba(31, 119, 180, 0.4)'

df = carregar_dados()

if not df.empty:
    df['tema'] = df['tema'].fillna('Geral')
    df['subtema'] = df['subtema'].fillna('Geral')

# ==========================================
# 3. SIDEBAR (FILTROS GLOBAIS)
# ==========================================
st.sidebar.image("https://floripasustentavel.com.br/novo/wp-content/uploads/2026/01/Design-sem-nome-13-1.png", width='stretch')
st.sidebar.markdown("---")


if not df.empty:
    st.sidebar.title("🔍 Navegação do Dashboard")
    tema_selecionado = st.sidebar.selectbox("1. Selecione o Tema", df['tema'].unique())
    subtemas_disponiveis = df[df['tema'] == tema_selecionado]['subtema'].unique()
    subtema_selecionado = st.sidebar.selectbox("2. Selecione o Subtema", subtemas_disponiveis)
    indicadores_disponiveis = df[(df['tema'] == tema_selecionado) & (df['subtema'] == subtema_selecionado)]['indicador'].unique()
    indicador_selecionado = st.sidebar.selectbox("3. Selecione o Indicador", indicadores_disponiveis)

st.sidebar.markdown("---")
st.sidebar.info("**RAPI 2024-2025**\n\nRelatório Anual de Progresso dos Indicadores de Florianópolis.")

st.sidebar.markdown("<br>" * 5, unsafe_allow_html=True) 
st.sidebar.markdown("---")

# Informações da Fonte
st.sidebar.markdown("📍 **Fonte de Dados**")
st.sidebar.markdown(
    "Dados originais extraídos do [Relatório RAPI 2025](https://materiais.floripamanha.org/rapi-relatorio-anual-progresso-indicadores-25)"
)

# Créditos de Desenvolvimento
st.sidebar.markdown("🚀 **Créditos**")
st.sidebar.markdown(
    "Plataforma orgulhosamente desenvolvida por [Gustavo Simas da Silva](https://www.linkedin.com/in/simasgs/)"
)

# ==========================================
# 4. ESTRUTURA DE ABAS PRINCIPAIS
# ==========================================
aba_apresentacao, aba_dash, aba_relatorio = st.tabs(["📖 Apresentação (Início)", "📊 Dashboard Interativo", "📝 Relatório e Análises Completas"])

# ==========================================
# ABA 0: APRESENTAÇÃO (PÁGINA INICIAL)
# ==========================================
with aba_apresentacao:
    st.title("Relatório Anual de Progresso dos Indicadores (RAPI) 2024-2025")
    
    col_texto, col_grafico = st.columns([1.2, 1])
    
    with col_texto:
        st.markdown("<h3 style='color:#1f77b4;'>1. Apresentação</h3>", unsafe_allow_html=True)
        st.markdown("""<div class='texto-relatorio'>
        O 9º Relatório Anual de Progresso dos Indicadores de Florianópolis (RAPI) é o resultado da coleta e análise de indicadores de sustentabilidade ambiental, urbana e fiscal, bem como um conjunto de recomendações aos entes públicos. O documento dá visibilidade a um conjunto de <b>205 indicadores</b>, e se baseia na metodologia do Programa Cidades Emergentes e Sustentáveis (CES), do Banco Interamericano de Desenvolvimento (BID).
        <br><br>
        Esse trabalho coletivo envolve, desde 2017, diferentes organizações e tem como objetivo acompanhar, de forma técnica e imparcial, o desenvolvimento da cidade em questões que impactam a sua sustentabilidade e a qualidade de vida de seus cidadãos. O Grupo de Trabalho é composto pela <b>Associação FloripAmanhã, a Universidade Federal de Santa Catarina (UFSC) e o Observatório Social do Brasil – Florianópolis.</b>
        </div>""", unsafe_allow_html=True)
        
        st.markdown("<h3 style='color:#1f77b4;'>2. Contexto</h3>", unsafe_allow_html=True)
        st.markdown("""<div class='texto-relatorio'>
        O RAPI apresenta-se como importante ferramenta para que o poder público, as entidades da sociedade civil e os cidadãos em geral avaliem as questões urbanas a partir do real conhecimento de dados confiáveis e atualizados. Além disso, à medida em que o cidadão se apropria de informações confiáveis sobre seu território, o debate político se torna mais rico, mais participativo e com melhores resultados para toda a população.
        </div>""", unsafe_allow_html=True)
        
        st.markdown("<h3 style='color:#1f77b4;'>3. Objetivo</h3>", unsafe_allow_html=True)
        st.markdown("""<div class='texto-relatorio'>
        Auxiliar o governo e a sociedade a estabelecerem e seguirem prioridades com metas claras e mensuráveis, para o desenvolvimento sustentável da cidade, e contribuir para a avaliação das políticas públicas urbanas, a partir de uma visão técnica, objetiva e metodologicamente embasada. Em nosso 9º exercício de monitoramento, trazemos a público um “raio-x” de temas como mobilidade, saneamento básico, saúde, educação, segurança e uso adequado do solo.
        </div>""", unsafe_allow_html=True)

    with col_grafico:
        st.markdown("<h3 style='color:#1f77b4;'>5. Semaforização dos Indicadores</h3>", unsafe_allow_html=True)
        st.markdown("""<div class='texto-relatorio'>
        Numa visão geral, os 205 indicadores de 2024-2025 foram classificados da seguinte forma:
        <ul>
            <li>🟢 <b>Verde (40)</b>: A cidade atingiu resultados satisfatórios.</li>
            <li>🟡 <b>Amarelo (34)</b>: A cidade revela níveis que ainda requerem atenção.</li>
            <li>🔴 <b>Vermelho (26)</b>: A cidade está abaixo do nível satisfatório (atenção especial).</li>
            <li>⚪ <b>Cinza (36)</b>: Sem dados informados ou fora dos parâmetros.</li>
            <li>🔵 <b>Azul (69)</b>: Indicadores novos não semaforizados.</li>
        </ul>
        </div>""", unsafe_allow_html=True)
        
        # Dados da Tabela 5.1 para gerar o Gráfico Interativo
        dados_semaforo = {
            'Ano': ['2020', '2021', '2022', '2023', '2024'],
            'Azul (Novos)': [62, 56, 72, 75, 69],
            'Cinza (Sem Dados)': [39, 42, 17, 21, 36],
            'Vermelho (Crítico)': [29, 28, 31, 29, 26],
            'Amarelo (Atenção)': [17, 19, 23, 37, 34],
            'Verde (Satisfatório)': [36, 38, 40, 40, 40]
        }
        df_sem = pd.DataFrame(dados_semaforo)
        
        fig_sem = go.Figure()
        cores = {'Azul (Novos)': '#1f77b4', 'Cinza (Sem Dados)': '#7f7f7f', 
                 'Vermelho (Crítico)': '#d62728', 'Amarelo (Atenção)': '#ff7f0e', 
                 'Verde (Satisfatório)': '#2ca02c'}
                 
        for coluna in cores.keys():
            fig_sem.add_trace(go.Bar(
                x=df_sem['Ano'],
                y=df_sem[coluna],
                name=coluna,
                marker_color=cores[coluna]
            ))
            
        fig_sem.update_layout(
            barmode='stack',
            title='Evolução Histórica da Semaforização',
            xaxis_title='Ano de Avaliação',
            yaxis_title='Qtd. de Indicadores',
            template='plotly_white',
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )
        st.plotly_chart(fig_sem, width='stretch')

    st.divider()
    
    # Seção 4. Estrutura (em expansores para não ficar um bloco gigante de texto)
    st.markdown("<h3 style='color:#1f77b4;'>4. Estrutura Analítica do RAPI 2024-2025</h3>", unsafe_allow_html=True)
    st.markdown("O relatório é dividido em 3 Grandes Dimensões, subdivididas em 12 pilares e 25 temas.")
    
    c1, c2, c3 = st.columns(3)
    with c1:
        with st.expander("🌱 Dimensão Ambiental (32 indicadores)"):
            st.markdown("""
            <b>Manejo Ambiental e Consumo (23):</b><br> Água (6), Saneamento/Drenagem (3), Resíduos Sólidos (8), Energia (6).<br><br>
            <b>Mitigação de Gases e Contaminação (4):</b><br> Qualidade do Ar (2), Mudanças Climáticas (1), Ruído (1).<br><br>
            <b>Vulnerabilidade e Desastres Naturais (5)</b>
            """, unsafe_allow_html=True)
    with c2:
        with st.expander("🏙️ Dimensão Urbana (142 indicadores)"):
            st.markdown("""
            <b>Controle do Crescimento (18):</b><br> Uso do Solo (11), Desigualdade (7).<br><br>
            <b>Mobilidade e Transporte Sustentável (23)</b><br><br>
            <b>Desenvolvimento Econômico (12):</b><br> Ambiente de Negócios (1), Tecido Produtivo (8), Mercado Laboral (3).<br><br>
            <b>Serviços Sociais (72):</b><br> Educação (19), Segurança (10), Saúde (43).<br><br>
            <b>Competitividade (17):</b><br> Capital Humano (2), Tecido Empresarial (15).
            """, unsafe_allow_html=True)
    with c3:
        with st.expander("⚖️ Dimensão Fiscal (31 indicadores)"):
            st.markdown("""
            <b>Mecanismos de Governo (11):</b><br> Gestão Participativa (1), Gestão Moderna (9), Transparência (1).<br><br>
            <b>Gestão Adequada da Receita (11):</b><br> Impostos e Autonomia (11).<br><br>
            <b>Gestão Adequada da Despesa (5)</b><br><br>
            <b>Gestão Adequada da Dívida (4)</b>
            """, unsafe_allow_html=True)


# ==========================================
# ABA 1: DASHBOARD INTERATIVO
# ==========================================
with aba_dash:
    if not df.empty:
        dados_ind = df[df['indicador'] == indicador_selecionado].iloc[0]
        dados_anuais = dados_ind.get('dados_anuais', {})
        anos = ['2019', '2020', '2021', '2022', '2023', '2024']

        df_hist = pd.DataFrame({
            'Ano': anos,
            'Valor_Original': [dados_anuais.get(ano) for ano in anos]
        })
        df_hist['Valor_Numerico'] = df_hist['Valor_Original'].apply(extrair_numero)

        valor_2024_orig = df_hist.loc[df_hist['Ano'] == '2024', 'Valor_Original'].values[0]
        valor_2023_orig = df_hist.loc[df_hist['Ano'] == '2023', 'Valor_Original'].values[0]
        num_2024 = df_hist.loc[df_hist['Ano'] == '2024', 'Valor_Numerico'].values[0]
        num_2023 = df_hist.loc[df_hist['Ano'] == '2023', 'Valor_Numerico'].values[0]

        st.markdown(f"<h2 class='titulo-indicador'>{indicador_selecionado}</h2>", unsafe_allow_html=True)

        col_head1, col_head2 = st.columns(2)
        with col_head1:
            st.caption("**Órgão Responsável:**")
            st.write(f"🏛️ {dados_ind.get('orgao_responsavel', 'Não informado')}")
        with col_head2:
            st.caption("**Categorização:**")
            st.write(f"📂 {tema_selecionado} > {subtema_selecionado}")

        st.divider()

        # Métricas
        col1, col2, col3 = st.columns(3)
        with col1:
            st.markdown("<div class='metric-card'>", unsafe_allow_html=True)
            st.metric(label="Resultado (2023)", value=valor_2023_orig if pd.notna(valor_2023_orig) else "ND")
            st.markdown("</div>", unsafe_allow_html=True)
        with col2:
            st.markdown("<div class='metric-card'>", unsafe_allow_html=True)
            delta_str = None
            if pd.notna(num_2024) and pd.notna(num_2023) and num_2023 != 0:
                variacao = ((num_2024 - num_2023) / abs(num_2023)) * 100
                delta_str = f"{variacao:.1f}% vs 2023"
            st.metric(label="Resultado Atual (2024)", value=valor_2024_orig if pd.notna(valor_2024_orig) else "ND", delta=delta_str)
            st.markdown("</div>", unsafe_allow_html=True)
        with col3:
            st.markdown("<div class='metric-card'>", unsafe_allow_html=True)
            faixas = dados_ind.get('faixas_semaforizacao', {})
            if faixas and 'verde' in faixas:
                st.markdown("**Referência Ideal (Verde):**")
                st.success(faixas['verde'])
            else:
                st.markdown("**Referência:**")
                st.info("Sem valor de referência ou métrica qualitativa.")
            st.markdown("</div>", unsafe_allow_html=True)

        st.write("")

        # Abas internas do Dashboard
        aba_grafico, aba_regras, aba_tabela = st.tabs(["📈 Evolução Histórica", "🚦 Regras de Semaforização", "🗄️ Dados Brutos do Indicador"])

        with aba_grafico:
            df_plot = df_hist.copy()
            if not df_plot.dropna(subset=['Valor_Numerico']).empty:
                # Criar lista de cores para cada barra
                lista_cores = [avaliar_cor_semaforo(row['Valor_Numerico'], faixas) for _, row in df_plot.iterrows()]
                
                fig = go.Figure()
                
                # Barras com cores dinâmicas (mantido)
                fig.add_trace(go.Bar(
                    x=df_plot['Ano'], 
                    y=df_plot['Valor_Numerico'],
                    marker_color=lista_cores,
                    name='Valor'
                ))
                
                # ATUALIZAÇÃO DA LINHA DE TENDÊNCIA:
                # Dentro de fig.add_trace(go.Scatter(...))
                fig.add_trace(go.Scatter(
                    x=df_plot['Ano'], 
                    y=df_plot['Valor_Numerico'],
                    mode='lines+markers+text',
                    text=df_plot['Valor_Numerico'].apply(
                        lambda x: f"{x:,.2f}".replace(',', 'v').replace('.', ',').replace('v', '.') if pd.notna(x) else ""
                    ),
                    textposition='top center',
                    # REMOVA a cor fixa aqui ou defina como None
                    textfont=dict(size=11), 
                    line=dict(color='#888', width=2, dash='dot'), # Use um cinza médio para a linha
                    name='Tendência'
                ))
                
                fig.update_layout(
                    title="Evolução Histórica com Rótulos Adaptáveis",
                    # template="plotly_white",  <-- REMOVA ESTA LINHA
                    height=450,
                    showlegend=False,
                    margin=dict(t=50),
                    # Isso garante que os títulos dos eixos usem a cor padrão do tema
                    xaxis=dict(showgrid=False),
                    yaxis=dict(showgrid=True, gridcolor='rgba(128,128,128,0.2)') 
                )
                st.plotly_chart(fig, width='stretch', theme="streamlit")
            else:
                st.warning("⚠️ Não foi possível gerar o gráfico de tendência. Valores em formato de texto ou ND.")

        with aba_regras:
            if faixas:
                cs1, cs2, cs3 = st.columns(3)
                with cs1: st.success(f"🟢 **Verde:** \n\n{faixas.get('verde', 'N/A')}")
                with cs2: st.warning(f"🟡 **Amarelo:** \n\n{faixas.get('amarelo', 'N/A')}")
                with cs3: st.error(f"🔴 **Vermelho:** \n\n{faixas.get('vermelho', 'N/A')}")
            else:
                st.write("Nenhuma regra de semaforização cadastrada para este indicador.")

        with aba_tabela:
            st.dataframe(df_hist, width='stretch', hide_index=True)

        st.divider()
st.markdown("## 📚 Explorador Geral do Relatório RAPI")
st.markdown("Abaixo pode explorar, filtrar e descarregar a base de dados completa (incluindo valores originais e numéricos extraídos).")

with st.expander("Clique aqui para abrir a tabela de dados completa"):
    # Criamos uma cópia para não afetar o DataFrame principal do dashboard
    df_tabela = df.copy()
    
    # Expandir as colunas anuais: Original e Numérica
    for ano in anos:
        # 1. Extrai o texto original do dicionário 'dados_anuais'
        df_tabela[f"{ano} (Original)"] = df_tabela['dados_anuais'].apply(lambda x: x.get(ano) if isinstance(x, dict) else None)
        
        # 2. Aplica a função de extração para criar a versão numérica
        df_tabela[f"{ano} (Numérico)"] = df_tabela[f"{ano} (Original)"].apply(extrair_numero)
    
    # Expandir as faixas de semaforização para colunas legíveis
    df_tabela['Faixa_Verde'] = df_tabela['faixas_semaforizacao'].apply(lambda x: x.get('verde') if isinstance(x, dict) else None)
    df_tabela['Faixa_Amarela'] = df_tabela['faixas_semaforizacao'].apply(lambda x: x.get('amarelo') if isinstance(x, dict) else None)
    df_tabela['Faixa_Vermelha'] = df_tabela['faixas_semaforizacao'].apply(lambda x: x.get('vermelho') if isinstance(x, dict) else None)
    
    # Removemos as colunas de dicionários originais (complexas) para limpar a visualização
    df_tabela = df_tabela.drop(columns=['dados_anuais', 'faixas_semaforizacao'], errors='ignore')
    
    # Organização das colunas para uma leitura lógica:
    # Identificação -> Dados 2024 -> Dados 2023 ... -> Regras
    cols_base = ['tema', 'subtema', 'orgao_responsavel', 'indicador']
    cols_anos = []
    # Criar lista intercalada: 2024 (Original), 2024 (Numérico), 2023 (Original)...
    for ano in reversed(anos): # Começa pelo mais recente (2024)
        cols_anos.extend([f"{ano} (Original)", f"{ano} (Numérico)"])
        
    cols_regras = ['Faixa_Verde', 'Faixa_Amarela', 'Faixa_Vermelha']
    
    # Reordenar o DataFrame final
    df_final = df_tabela[cols_base + cols_anos + cols_regras]
    
    # Exibição com ferramenta de busca e download nativa do Streamlit
    st.dataframe(
        df_final, 
        width='stretch', 
        height=600,
        column_config={
            # Opcional: formata colunas numéricas para não mostrar vírgulas em IDs
            "id_floripa": st.column_config.NumberColumn(format="%d")
        }
    )
    
    st.caption("💡 Dica: Pode clicar nos cabeçalhos das colunas para ordenar e usar o botão de download (canto superior direito da tabela) para exportar para CSV.")

# ==========================================
# ABA 2: RELATÓRIO E ANÁLISES
# ==========================================
with aba_relatorio:
    st.markdown("<h2 style='color:#1f77b4;'>7. Considerações e Recomendações</h2>", unsafe_allow_html=True)
    st.markdown("""<div class='texto-relatorio'>
    Tomando por base os valores levantados em 2025 e sua série histórica para cada indicador, seguem abaixo as considerações e recomendações referentes aos itens que mais necessitam de atenção e providências. Deixamos de registrar comentários sobre a maioria dos aspectos em “verde” por já terem alcançado níveis satisfatórios.
    </div>""", unsafe_allow_html=True)
    st.write("")

    with st.expander("🌍 7.1 Dimensão Ambiental", expanded=False):
        st.markdown("""<div class='texto-relatorio'>
        <b>7.1.1. Tema: Água - 06 indicadores</b><br>
        a) O indicador Consumo de Água Per Capita por Dia é essencial para avaliar o uso sustentável dos recursos hídricos. Nos últimos cinco anos, Florianópolis apresentou uma média de 173,1 litros/pessoa/dia. Pela semaforização atualmente aplicada, o município se encontra em condição verde. No entanto, quando comparado ao referencial internacional estabelecido pela ONU, de 110 litros/dia/pessoa, observa-se que o consumo em Florianópolis permanece consistentemente acima do recomendado.<br><br>
        b) O indicador de Qualidade da Água apresentou em 2024 o valor de 96,8%, uma ligeira redução em relação a 2023. Esse resultado enquadra-se na faixa amarela. Além disso, persiste uma lacuna significativa: a ausência de regulamentação para contaminantes por metais pesados e agrotóxicos.<br><br>
        c) A porcentagem de água não contabilizada continua sendo um desafio estrutural importante. Em 2024 voltou a subir para 38,09%, reforçando a oscilação e a dificuldade de manter avanços consistentes. Esse cenário reflete perdas significativas por vazamentos e ligações irregulares.<br><br>
        d) É extremamente preocupante constatar que, desde 2019, não recebemos informações sobre o indicador “Número remanescente de anos de saldo hídrico positivo”. A ausência sistemática desses dados há cinco anos compromete a possibilidade de avaliar riscos futuros e adotar medidas preventivas eficazes.<br><br>
        
        <b>7.1.2. Tema: Saneamento e Drenagem – 03 indicadores</b><br>
        a) O índice de cobertura de ligações de moradias ao sistema de esgotamento sanitário permanece em um patamar crítico. Em 2024, o percentual caiu para 64,81%, representando mais um retrocesso.<br><br>
        b) O indicador de tratamento de águas residuais registrou 63,15% em 2024, uma melhora em relação ao resultado de 2023 e suficiente para mantê-lo na faixa verde.<br><br>
        c) O indicador de moradias afetadas por inundações intensas vem apresentando uma trajetória de crescimento extremamente preocupante. Desde 2018, os resultados evoluíram de 0,5% para 15% em 2024, ultrapassando em muito o limite vermelho.<br><br>
        
        <b>7.1.3 Tema: Gestão de Resíduos Sólidos – 08 indicadores</b><br>
        a) Em Florianópolis, o consumo foi de 1,14 kg/hab/dia em 2024, o que corresponde a aproximadamente 416 kg de resíduos por pessoa ao ano – mais de 50% superior à média mundial de referência (0,74 kg).<br><br>
        b) A porcentagem de resíduos compostados pela Prefeitura de Florianópolis deu um salto notável, atingindo 12,93% em 2024.<br><br>
        c) Em 2024, a cidade alcançou um novo patamar, com 10,73% dos resíduos sólidos separados e classificados para reciclagem, embora ainda se encontre na faixa vermelha.<br><br>
        
        <b>7.1.4 Tema: Energia – 06 indicadores</b><br>
        a) A quantidade anual de horas de interrupções elétricas manteve-se em um patamar satisfatório (5,61 h/domicílio/ano).<br><br>
        b) Florianópolis deu um salto impressionante na modernização de sua iluminação pública. A porcentagem de luminárias LED instaladas subiu para expressivos 77% em 2024.<br><br>
        c) A porcentagem de energia proveniente de fontes renováveis registrou 3,88% em 2024, mantendo a cidade na faixa vermelha e reforçando a necessidade urgente de políticas mais consistentes.<br><br>

        <b>7.1.5 Tema: Qualidade do Ar – 02 indicadores</b><br>
        A situação do monitoramento da qualidade do ar permanece inalterada em 2024, representando uma lacuna crítica. A única referência de dados disponíveis é o registro de 2014.<br><br>

        <b>7.1.8 Tema: Vulnerabilidade Frente aos Desastres Naturais – 05 indicadores</b><br>
        O orçamento destinado à mitigação de riscos de desastres naturais apresentou uma queda preocupante (apenas 0,07%). Além disso, o número de unidades em áreas de risco subiu para 2.100, uma expansão descontrolada que exige fiscalização urgente.
        </div>""", unsafe_allow_html=True)

    with st.expander("🏙️ 7.2 Dimensão Urbana", expanded=False):
        st.markdown("""<div class='texto-relatorio'>
        <b>7.2.1 Tema: Uso do Solo e Ordenamento Territorial</b><br>
        O crescimento da malha viária foi de 1,41% em 2024, mantendo o percentual na faixa verde. No entanto, a população alcançou aproximadamente 576 mil habitantes (aumento anual de 1,9%), o que coloca o crescimento demográfico na faixa vermelha. A densidade populacional também sofre aumento contínuo, demandando planejamento ordenado.<br><br>
        O déficit habitacional quantitativo pintou um quadro alarmante (21.705 famílias, ou 52% do CadÚnico, segundo últimos dados de 2022/2023). Outro dado crítico é a proteção das Unidades de Conservação: apenas 20% das UCs municipais tinham seu plano de manejo em 2024, um retrocesso drástico em relação aos 41,6% de 2022.<br><br>

        <b>7.2.2 Tema: Desigualdade Urbana</b><br>
        A cidade atingiu 0,4 no Coeficiente de Gini, alcançando condição satisfatória e reduzindo a desigualdade de renda. Porém, o desafio de diminuir a população abaixo da linha de pobreza (4,8%) deve permanecer na agenda.<br><br>

        <b>7.2.3 Tema: Mobilidade e Transporte</b><br>
        A capacidade do sistema de transporte público teve um aumento notável, superando o pico histórico (média de 16 milhões/mês). Contudo, a velocidade média da frota caiu para 22,91 km/h e o custo por passageiro subiu para R$ 5,84. A quantidade de veículos particulares per capita atingiu 0,723, agravando os congestionamentos.<br><br>

        <b>7.2.4 Tema: Ambiente de Negócios</b><br>
        O tempo médio para abrir uma empresa caiu de 15 dias (2019) para impressionantes 5 horas em 2024. A cidade consolida-se na faixa verde, fortalecendo o ecossistema de inovação.<br><br>

        <b>7.2.7 Tema: Educação</b><br>
        Há sinais de alerta no desempenho (IDEB): a nota dos anos iniciais caiu para 5,8 e dos anos finais para 4,6 (faixa vermelha). Em paralelo, a contratação temporária de professores (ACTs) subiu para 60,7%, evidenciando precarização. Por outro lado, a cidade avança em inclusão e acessibilidade escolar (96,21%).<br><br>

        <b>7.2.8 Tema: Segurança</b><br>
        A cidade manteve-se verde em segurança. A taxa de homicídios foi de 5,40 e latrocínios zeraram. Os roubos e roubos de veículos continuam em patamares baixos, consolidando Florianópolis como uma capital segura em relação a crimes violentos.<br><br>

        <b>7.2.9 Tema: Saúde</b><br>
        A Taxa de Mortalidade Geral caiu para 518,60 e a mortalidade infantil permaneceu verde (6,90). Contudo, coberturas vacinais como BCG (39,17%) e Hepatite B ao nascer (34,94%) continuam na faixa vermelha, exigindo alerta.<br><br>

        <b>7.2.11 Tema: Tecido Empresarial</b><br>
        O número de empresas ativas saltou para 24.779 em 2024. As exportações cresceram para US$ 65,23 milhões, e o faturamento do setor de tecnologia aumentou 28,39%.
        </div>""", unsafe_allow_html=True)

    with st.expander("⚖️ 7.3 Dimensão Fiscal e Governança", expanded=False):
        st.markdown("""<div class='texto-relatorio'>
        <b>7.3.2 Tema: Gestão Pública Moderna</b><br>
        Florianópolis alcançou 88% de processos digitais concluídos. O Índice de Transparência manteve-se em 98% (faixa verde). Nas compras públicas, o pregão eletrônico dominou (53,62%), mas o alerta vai para o crescimento expressivo das compras por contratação direta, que subiram de 2,27% em 2020 para 20,55% em 2024.<br><br>

        <b>7.3.4 Tema: Impostos e Autonomia Financeira</b><br>
        A variação do ICMS e ISS foi superior à inflação. No entanto, a arrecadação do IPTU cresceu apenas 2,09% (abaixo da inflação), indicando deficiência no processo de cobrança. A inadimplência do IPTU, embora tenha reduzido, permanece elevada em 16,7%.<br><br>

        <b>7.3.5 Tema: Gestão do Gasto Público e Dívida</b><br>
        Os gastos correntes representaram 86,21% dos gastos totais. Quase não existe sobra de recursos para investimentos em obras, o que fomenta o endividamento. O gasto com pessoal ficou em 48,46% da receita corrente líquida, um valor elevado, limitando a capacidade de investimento da prefeitura.
        </div>""", unsafe_allow_html=True)

    st.write("")
    st.markdown("<h2 style='color:#1f77b4;'>8. Considerações Finais</h2>", unsafe_allow_html=True)
    st.markdown("""<div class='texto-relatorio'>
    Nesta 9ª edição do Relatório dos Indicadores de Sustentabilidade de Florianópolis (RAPI), o panorama geral reflete uma cidade de contrastes, com avanços notáveis em alguns setores, mas com desafios persistentes em áreas-chave para a sua sustentabilidade. 
    <br><br>
    A cidade consolida-se como líder em governo digital e excelência em transparência. No Meio Ambiente, o cenário é misto: crescimento planejado da malha urbana contrasta com o consumo de água acima das recomendações, perdas críticas por vazamentos, e ausência de saneamento básico abrangente (que ainda está muito abaixo do necessário). 
    <br><br>
    Do ponto de vista econômico, a cidade demonstra resiliência, liderança em PIB per capita e pujança no tecido empresarial. No aspecto fiscal, o relatório aponta grandes preocupações. Há quase nenhuma sobra de recursos para investimentos em obras estruturantes, resultando em crescente endividamento.
    <br><br>
    O desafio para o futuro é grande, mas as informações do relatório fornecem o caminho para que Florianópolis se torne uma sociedade verdadeiramente inclusiva, sustentável e equitativa.
    </div>""", unsafe_allow_html=True)
    
    st.divider()

    st.markdown("<h2 style='color:#1f77b4;'>9. Agradecimentos e Créditos</h2>", unsafe_allow_html=True)
    st.markdown("""<div class='texto-relatorio'>
    Agradecemos ao Prefeito de Florianópolis, Topázio Neto, seus secretários municipais, gestores e servidores da administração pública, bem como secretarias estaduais, empresas públicas e autarquias por seus esforços e contribuições no fornecimento dos dados solicitados.
    <br><br>
    <b>Grupo de Trabalho de Indicadores (RAPI 2024-2025):</b><br>
    <ul>
        <li><b>Associação FloripAmanhã:</b> Andrea Pessi M Costa, Ivo Sostizzo, Márcia Regina Teschner, Pedro Carlos Rasia, Salomão Mattos Sobrinho</li>
        <li><b>Observatório Social do Brasil (Florianópolis):</b> João Manuel Dias da Silva, Rafael Novaes</li>
        <li><b>Universidade Federal de Santa Catarina (UFSC):</b> Clarissa Stefani Teixeira, Hans Michael Van Bellen</li>
    </ul>
    <i>É permitida a reprodução parcial ou total deste material desde que citada a fonte Rede Ver a Cidade Floripa, 2024-2025. Outubro de 2025.</i>
    </div>""", unsafe_allow_html=True)