import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import json
import re

import os
from google import genai
from google.genai import types

# ==========================================
# 1. CONFIGURAÇÃO DA PÁGINA
# ==========================================
st.set_page_config(
    page_title="Dashboard RAPI 2024-2025 - Florianópolis",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

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
# PREPARAÇÃO DA IA (GEMINI)
# ==========================================
# Junta todos os textos das seções 1 a 9 que fizemos na aba de relatório
# No topo do arquivo ou antes da função do chatbot:
TEXTO_RAPI_COMPLETO = """
1. APRESENTAÇÃO: O 9º º Relatório Anual de Progresso dos Indicadores de Florianópolis (RAPI) é o
resultado da coleta e análise de indicadores de sustentabilidade ambiental,
urbana e fiscal, bem como um conjunto de recomendações aos entes públicos.
O documento dá visibilidade a um conjunto de 205 indicadores, e se baseia
na metodologia do Programa Cidades Emergentes e Sustentáveis (CES), do
Banco Interamericano de Desenvolvimento (BID).
Esse trabalho coletivo envolve, desde 2017, diferentes organizações tem como
objetivo acompanhar, de forma técnica e imparcial, o desenvolvimento da
cidade em questões que impactam a sua sustentabilidade e a qualidade de
vida de seus cidadãos
O Grupo de Trabalho que coordena a coleta, semaforização e elaboração do
relatório final do RAPI é composto pela Associação FloripAmanhã, a
Universidade Federal de Santa Catarina (UFSC) e o Observatório Social do Brasil
– Florianópolis.
2. CONTEXTO: O RAPI apresenta-se como importante ferramenta para que o poder público, as
entidades da sociedade civil e os cidadãos em geral avaliem as questões
urbanas a partir do real conhecimento de dados confiáveis e atualizados.
Além disso, à medida em que o cidadão se apropria de informações confiáveis
sobre seu território, o debate político se torna mais rico, mais participativo e
com melhores resultados para toda a população.
3. OBJETIVO: O objetivo geral do Relatório Anual de Análise de Progresso dos Indicadores
(RAPI) de Florianópolis é auxiliar o governo e a sociedade a estabelecerem e
seguirem prioridades com metas claras e mensuráveis, para o desenvolvimento
sustentável da cidade, e contribuir para a avaliação das políticas públicas
urbanas, a partir de uma visão técnica, objetiva e metodologicamente
embasada.
Para alcançar esses objetivos, este documento traz não somente os indicadores
em si, mas também recomendações aos entes públicos para que estes possam
aprimorar suas políticas públicas, de forma a viabilizar o atingimento de
melhores níveis de desenvolvimento sustentável.
Em nosso 9º exercício de monitoramento, trazemos a público um “raio-x” de
temas como mobilidade, saneamento básico, saúde, educação, segurança, uso
adequado do solo, entre outros que influenciam diretamente na qualidade de
vida de quem escolheu viver em Florianópolis.
4. ESTRUTURA: O RAPI está estruturado em 3 dimensões, 12 pilares e 25
temas. Cada tema é composto por um conjunto de indicadores que, em sua
maioria, são acompanhados desde 2017. A estrutura é a seguinte:
Dimensão Ambiental
1. Água
2. Resíduos Sólidos
3. Energia
4. Iluminação Pública
5. Uso do Solo
Dimensão Urbana
6. Mobilidade
7. Habitação
8. Saúde
9. Educação
10. Segurança
Dimensão Fiscal
11. Gestão Fiscal
12. Governança e Transparência
5. SEMAFORIZAÇÃO: A semaforização é uma ferramenta visual que permite
identificar, de forma rápida, quais indicadores estão em situação de alerta
(vermelho), quais estão em situação de atenção (amarelo) e quais estão em
situação de atenção (verde). Além disso, o relatório traz os indicadores que
foram classificados como novos ou que ainda não possuem dados suficientes
para semaforização (cinza).
No RAPI 2024-2025, temos a seguinte distribuição:
Verde: 40 indicadores
Amarelo: 34 indicadores
Vermelho: 26 indicadores
Cinza: 36 indicadores
Azul/Novos: 69 indicadores
6. INDICADORES RAPI
7. CONSIDERAÇÕES E RECOMENDAÇÕES: Tomando por base os valores levantados em 2025 e sua série histórica
para cada indicador, seguem abaixo as considerações e recomendações
referentes aos itens que mais necessitam de atenção e providências.
Deixamos de registrar comentários sobre a maioria dos aspectos em
“verde” por já terem alcançado níveis satisfatórios.
7.1 Dimensão Ambiental
7.1.1. Tema: Água - 06 indicadores
a) O indicador Consumo de Água Per Capita por Dia é essencial para
avaliar o uso sustentável dos recursos hídricos. Nos últimos cinco anos,
Florianópolis apresentou uma média de 173,1 litros/pessoa/dia, com
os seguintes resultados anuais: 172,9 litros em 2020, 163,1 litros
em 2021, 172,6 litros em 2022, 179,9 litros em 2023 e 178,9
litros em 2024 (CASAN). Pela semaforização atualmente
aplicada, que considera satisfatório o intervalo entre 120 e 200
litros/dia/pessoa, o município se encontra em condição verde,
indicando que o consumo está dentro do esperado para uma situação
considerada aceitável. No entanto, quando comparado ao referencial
internacional estabelecido pela ONU, de 110 litros/dia/pessoa
para atender adequadamente às necessidades básicas, observa-se que o
consumo em Florianópolis permanece consistentemente acima do
recomendado. Isso pode refletir tanto hábitos de uso excessivo
quanto ineficiências no sistema de distribuição e perdas ao longo da
rede. Embora o indicador local aponte uma situação positiva, é
importante reconhecer que níveis mais altos de consumo exercem
pressão sobre os mananciais, aumentam os custos de tratamento e
distribuição e podem comprometer a sustentabilidade hídrica a longo
prazo. Nesse sentido, torna-se fundamental consolidar políticas de
uso racional da água, incentivar tecnologias de reuso e eficiência,
além de reforçar campanhas de conscientização para a população.
b) O indicador de Qualidade da Água apresentou em 2024 o valor de
96,8%, uma ligeira redução em relação a 2023 (97%). Esse resultado
enquadra-se na faixa amarela (90% a 97%), que indica condição de
atenção. A média histórica dos últimos 10 anos, de 95,44%,
também permanece dentro dessa mesma faixa, o que demonstra que,
embora haja conformidade relativamente alta, o patamar não pode ser
considerado plenamente satisfatório, já que sistematicamente a
qualidade da água não alcança o nível mais elevado. Além disso,
persiste uma lacuna significativa: a ausência de regulamentação para
contaminantes por metais pesados e agrotóxicos, que não estão
contemplados nos parâmetros nacionais de avaliação. Essa omissão
representa um risco específico à saúde pública e ao meio ambiente,
dado o efeito cumulativo e potencialmente prejudicial desses
contaminantes. Assim, mesmo com índices relativamente estáveis, é
fundamental avançar tanto na elevação da conformidade quanto na
atualização dos critérios de monitoramento, de forma a garantir
maior segurança hídrica à população.
32
c) A porcentagem de água não contabilizada em Florianópolis continua
sendo um desafio estrutural importante. Nos últimos 10 anos
(2014–2024), o índice apresentou uma média de 37,45%, muito
acima do patamar aceitável para uma gestão hídrica eficiente. Em
2023, o indicador havia registrado uma melhora para 35,87%, mas em
2024 voltou a subir para 38,09%, reforçando a oscilação e a
dificuldade de manter avanços consistentes. Esse cenário reflete perdas
significativas por vazamentos, ligações irregulares e problemas nos
sistemas de medição, que comprometem não apenas a eficiência do
abastecimento, mas também a sustentabilidade hídrica da cidade. Se
essa taxa de desperdício se mantiver, a pressão sobre os recursos
hídricos aumentará, especialmente diante do crescimento populacional.
É fundamental que a concessionária apresente estratégias claras e
consistentes para reduzir as perdas, seja por investimentos em
tecnologia, manutenção preventiva ou modernização da rede,
assegurando que a água tratada chegue de forma plena e sustentável à
população.
d) É extremamente preocupante constatar que, desde 2019, não
recebemos informações sobre o indicador “Número remanescente
de anos de saldo hídrico positivo”, conforme os parâmetros
solicitados. Trata-se de uma métrica estratégica, que reflete a
capacidade de uma região em manter o equilíbrio sustentável no ciclo
da água e, portanto, é essencial para o planejamento e para a tomada
de decisões que afetam diretamente a vida das comunidades e o
desenvolvimento do território. A ausência sistemática desses dados há
cinco anos compromete a possibilidade de avaliar riscos futuros e
adotar medidas preventivas eficazes. O saldo hídrico positivo não é
apenas um dado técnico: ele representa a garantia de acesso à água
potável, a preservação dos ecossistemas aquáticos, a segurança
alimentar e até a estabilidade econômica em regiões que dependem da
agricultura. A água é um recurso finito e essencial para a vida, e é
responsabilidade de todos nós, em especial dos gestores públicos,
garantir que ela seja gerenciada de forma responsável e eficaz para as
gerações presentes e futuras.
A análise dos indicadores relacionados à água em Florianópolis evidencia que os
desafios persistem e que as recomendações dos relatórios anteriores ainda não
se traduziram em melhorias significativas. O consumo per capita segue acima
dos parâmetros de referência internacionais, as perdas por água não
contabilizada permanecem em níveis críticos, e o indicador de qualidade da
água tem se mantido majoritariamente na faixa de atenção, sem alcançar de
forma consistente o patamar considerado ideal. Além disso, desde 2019 não há
divulgação do indicador “Número remanescente de anos de saldo hídrico
positivo”, o que representa uma lacuna grave no planejamento.
Diante desse cenário, é fundamental que tanto a Prefeitura de Florianópolis
quanto a CASAN adotem ações mais efetivas de gestão hídrica, com foco na
redução de perdas, uso eficiente, monitoramento mais rigoroso da qualidade e
transparência na divulgação de dados. Sem avanços concretos nessas frentes, a
cidade corre o risco de comprometer a segurança hídrica da população e a
sustentabilidade de seus recursos no médio e longo prazo.
33
7.1.2. Tema: Saneamento e Drenagem – 03 indicadores
a) O índice de cobertura de ligações de moradias ao sistema de
esgotamento sanitário em Florianópolis permanece em um patamar
crítico. Em 2024, o percentual caiu para 64,81%, representando
mais um retrocesso em relação a 2023 (66,67%) e consolidando uma
tendência preocupante de queda nos últimos anos. Ao observar a série
histórica de 2014 a 2024, verifica-se uma evolução inicial — de 45%
em 2014 para 68,89% em 2021 —, seguida por um período de
estagnação e, mais recentemente, de regressão, com a taxa recuando
para níveis abaixo de 2018. Essa trajetória indica não apenas a
dificuldade da cidade em ampliar a cobertura de esgoto, mas também a
perda de avanços conquistados em anos anteriores. Esse cenário revela
um desafio estrutural grave: Florianópolis não tem conseguido
acompanhar o crescimento populacional com investimentos
proporcionais em infraestrutura de saneamento. A insuficiência de
cobertura compromete tanto a saúde pública quanto a preservação
ambiental, especialmente em uma cidade que depende da qualidade de
seus recursos naturais para sustentar o turismo e a qualidade de vida
da população. Para reverter esse quadro, é imprescindível que as
autoridades municipais e estaduais assumam o saneamento básico
como prioridade, garantindo investimentos contínuos, planejamento
integrado e transparência na execução. Sem medidas efetivas, a cidade
corre o risco de aprofundar desigualdades urbanas e comprometer sua
sustentabilidade no longo prazo.
b) O indicador de tratamento de águas residuais em Florianópolis
apresentou oscilações importantes na última década, variando de 51%
a 65,07% entre 2014 e 2024. Em 2024, registrou 63,15%, uma
melhora em relação ao resultado de 2023 (60,14%) e suficiente para
mantê-lo na faixa verde da semaforização (> 60%). Esse avanço em
relação ao ano anterior é encorajador e pode sinalizar uma retomada
positiva após o período de quedas consecutivas observado desde 2021.
Entretanto, o histórico revela fragilidade e falta de consistência, uma
vez que o indicador já esteve próximo do limite inferior da faixa verde.
Para consolidar uma trajetória de crescimento estável, é fundamental
que sejam aprofundadas as ações de investimento em infraestrutura,
modernização tecnológica e gestão operacional. Garantir a melhoria
contínua nesse indicador é essencial tanto para a preservação
ambiental quanto para a saúde pública, além de estar diretamente
ligado ao cumprimento das metas de saneamento e sustentabilidade
urbana.
c) O indicador de moradias afetadas por inundações intensas em
Florianópolis vem apresentando uma trajetória de crescimento
extremamente preocupante. Desde 2018, os resultados evoluíram de
0,5% para 15% em 2024, ultrapassando em muito o limite vermelho
da semaforização (> 3%). Essa tendência de alta contínua evidencia o
agravamento dos impactos tanto do transbordamento de sistemas de
drenagem e esgoto quanto de enchentes provocadas por rios e marés.
As causas possíveis incluem deficiências na manutenção e na
capacidade dos sistemas de drenagem, agravadas por fatores como a
34
urbanização desordenada, a impermeabilização do solo e a elevação do
nível do mar. Esse cenário exige investimentos urgentes em
infraestrutura resiliente, aliando medidas de prevenção,
planejamento urbano e adaptação climática. Essa situação exige
investimentos em infraestrutura resiliente e medidas preventivas
robustas para mitigar os efeitos dessas inundações. Adicionalmente, é
essencial promover a conscientização pública sobre práticas de
segurança e planejamento urbano que possam ajudar a reduzir os
impactos desses eventos extremos. Uma gestão hídrica sustentável e o
fortalecimento da infraestrutura de drenagem são fundamentais para
conter o avanço desse problema e proteger as comunidades
vulneráveis. A análise constante dos dados e a implementação de
medidas corretivas imediatas são essenciais para reverter essa
tendência negativa e garantir a segurança das áreas mais afetadas.
d) Entendemos que o investimento em Saneamento e Drenagem
transcende a simples infraestrutura; é uma estratégia essencial para o
desenvolvimento sustentável de Florianópolis, assegurando que a
cidade continue a atrair visitantes e que seus habitantes usufruam de
uma melhor qualidade de vida.
e) Como o novo Plano Diretor permite a venda de potencial construtivo, é
importante a gestão adequada das compensações, a exemplo de
melhorias na mobilidade e drenagem.
f) Observamos, também, que o tema saneamento se consolidou como um
movimento social significativo, com expressiva mobilização por parte
de cidadãos, profissionais e entidades. Esses grupos têm demonstrado
crescente insatisfação com a concessão à Casan, questionando a gestão
de um recurso tão fundamental para a saúde pública e para a qualidade
de vida urbana.
g) O saneamento é reconhecido como um tema prioritário e urgente, um
problema a ser resolvido com máxima rapidez. Acreditamos que as
discussões e reivindicações em torno dessa questão continuarão a
impulsionar melhorias, seja em termos de novas políticas, mudanças de
gestão ou avanços concretos na eficiência desse serviço.
h) Para assegurar um progresso contínuo e consistente, sugerimos que
sejam implementados mecanismos de transparência e engajamento
permanente entre a concessionária, o governo e a sociedade civil.
Relatórios públicos regulares e dados acessíveis sobre os avanços e
desafios podem manter a população informada e participativa,
fortalecendo o acompanhamento das soluções e garantindo que
Florianópolis consiga concretizar as transformações que tanto
necessita.
7.1.3 Tema: Gestão de Resíduos Sólidos – 08 indicadores
a) De acordo com o Banco Mundial, a média global de produção de resíduos
sólidos urbanos é de aproximadamente 0,74 kg por pessoa por dia.
Isso significa uma média anual de cerca de 270 kg por pessoa. Esses
números podem variar dependendo do país e do contexto específico. Em
Florianópolis, o indicador mostra uma oscilação preocupante ao longo dos
últimos anos. Desde 2018, os resultados foram: 2,32 kg/hab/dia; 1,16;
35
1,10; 1,05; 1,09; 1,28 e 1,14 em 2024. Embora os valores tenham se
mantido na faixa amarela de semaforização (1,01 a 1,5 kg/hab/dia)
desde 2019, o patamar atual ainda está significativamente acima da média
global de referência. Em 2024, o consumo foi de 1,14 kg/hab/dia, o que
corresponde a aproximadamente 416 kg de resíduos por pessoa ao
ano – mais de 50% superior à média mundial. Essa situação reforça a
necessidade de estratégias consistentes para reduzir a geração de
resíduos na fonte, estimulando práticas de consumo consciente,
reutilização, reciclagem e compostagem. Além disso, políticas
públicas mais efetivas de gestão integrada de resíduos sólidos, aliadas à
conscientização da população, são essenciais para que Florianópolis
avance em direção a padrões mais sustentáveis e compatíveis com a
preservação ambiental.
b) A análise dos dados mais recentes mostra uma tendência positiva na
redução da porcentagem de resíduos sólidos municipais destinados
a aterros sanitários. O percentual, que estava em 93,27% em 2021,
caiu para 88,82% em 2022, 86,38% em 2023 e se manteve em um
patamar similar em 86,81% em 2024. Apesar da leve melhora, a situação
ainda é preocupante. O índice permanece muito acima do patamar de
menos de 35%, que seria considerado ideal para a sustentabilidade. A alta
dependência de aterros sanitários é agravada pelo fato de Florianópolis
não ter uma estrutura própria, destinando a maioria de seus resíduos para
o aterro de Biguaçu. Essa logística de transporte de longa distância não só
aumenta significativamente os custos de gestão, mas também eleva a
pegada de carbono da operação. A boa notícia é que o percentual de
resíduos compostados pela Prefeitura de Florianópolis deu um salto
notável. Depois de subir de 0,91% em 2021 para 4,56% em 2023, a
porcentagem atingiu 12,93% em 2024. Esse aumento demonstra que as
políticas e programas de compostagem estão começando a gerar
resultados expressivos, aproximando a cidade da meta ideal de 20%. É
crucial fortalecer as políticas públicas e os programas de conscientização
para incentivar a participação da população. A melhoria contínua desse
indicador não apenas contribuirá para a preservação ambiental e a saúde
pública, mas também resultará em economia de recursos e na redução dos
impactos negativos das atividades humanas no planeta. A destinação dos
resíduos para fora da cidade ressalta ainda mais a urgência de reduzir a
quantidade de lixo gerado na fonte.
c) A trajetória de reciclagem em Florianópolis tem mostrado um
crescimento constante nos últimos anos. Em 2024, a cidade alcançou
um novo patamar, com 10,73% dos resíduos sólidos separados e
classificados para reciclagem. Esse resultado demonstra uma evolução
positiva, especialmente se comparado aos 3,76% de 2021. No entanto,
é crucial reconhecer que, apesar do avanço, a porcentagem ainda se
encontra na faixa vermelha do sistema de semaforização (abaixo de
15%). Isso indica que a cidade ainda está a uma distância considerável
do parâmetro considerado ideal, que é de 25% ou mais. A melhoria
contínua desse indicador parece ser impulsionada em grande parte por
um amadurecimento e uma crescente conscientização da própria
36
população. Para que esse movimento se acelere e a cidade atinja
patamares mais sustentáveis, é fundamental que as políticas públicas
acompanhem esse ritmo. O fortalecimento das parcerias com entidades
de reciclagem e aprimoramento da infraestrutura de coleta seletiva são
essenciais. Além disso, a prefeitura pode ampliar a divulgação dos
resultados e investir em campanhas mais visíveis e eficazes,
transformando o engajamento natural da população em uma ação
coletiva e coordenada. Ao alinhar a conscientização da comunidade com
ações estratégicas de gestão de resíduos, Florianópolis poderá se
aproximar de padrões mais eficientes e se consolidar como uma cidade
verdadeiramente sustentável. .
d) Em 2024, a situação referente ao aproveitamento de resíduos
sólidos para geração de energia em Florianópolis permanece
inalterada, com o indicador em 0%. Essa ausência de avanço reflete
não apenas a falta de iniciativas, mas também a complexidade de se
implementar soluções que possam entrar em conflito com o perfil da
cidade. A forte vocação de Florianópolis para o turismo, serviços e a
chamada "economia limpa" cria barreiras e resistência social e política
a projetos que possam ser associados a grandes estruturas industriais.
Em um cenário de custos crescentes de energia e de urgência em
reduzir o volume de resíduos em aterros, essa inércia representa uma
oportunidade perdida para a cidade, especialmente considerando que a
logística de destinação do lixo já é um grande desafio. O
aproveitamento energético poderia não apenas reduzir os custos
operacionais, mas também mitigar a poluição. Para que Florianópolis
avance em direção a uma gestão de resíduos mais eficiente e
sustentável, é fundamental que as autoridades considerem soluções
que se alinhem ao perfil da cidade. Isso pode envolver a busca por
tecnologias mais modernas, de menor impacto visual e ambiental, ou
modelos descentralizados. Encontrar um caminho que transforme o
resíduo em um recurso energético de forma limpa e compatível com
sua identidade é o passo crucial para a sustentabilidade a longo prazo.
e) É imperativo que Florianópolis adote uma abordagem proativa e
inovadora em relação à gestão de resíduos sólidos. A implementação de
estratégias eficazes para aumentar a coleta seletiva, a reciclagem e o
tratamento de resíduos orgânicos não é apenas uma responsabilidade
ambiental, mas também uma oportunidade de transformar a cidade em
um modelo de sustentabilidade. A sensibilização da população e o
fortalecimento das parcerias com entidades locais são fundamentais
para criar uma cultura de responsabilidade coletiva em relação aos
resíduos. Além disso, a exploração de tecnologias de valorização de
resíduos, como a conversão em energia, deve ser uma prioridade. Ao
agir de forma decisiva agora, Florianópolis pode não apenas avançar em
direção à sua meta de Lixo Zero, mas também garantir um futuro mais
saudável e sustentável para seus cidadãos e o meio ambiente.
37
7.1.4 Tema: Energia – 06 indicadores
a) A quantidade anual de horas de interrupções elétricas por cliente em
Florianópolis manteve-se em um patamar satisfatório em 2024, com
uma média de 5,61 h/domicílio/ano. Esse resultado continua na faixa
verde do sistema de semaforização, que considera aceitáveis médias
inferiores a 7 horas. Apesar da leve alta em relação a 2023 (5,45
h/domicílio/ano), o valor de 2024 demonstra a estabilidade da rede
após a significativa elevação para 7,24 horas em 2021. Desde então, a
cidade tem mantido o indicador abaixo do limite de alerta, o que reflete
a resiliência do sistema e os esforços para garantir a qualidade do
fornecimento de energia. A média dos últimos seis anos (5,66
h/domicílio/ano) confirma que, apesar de flutuações pontuais, o serviço
de distribuição de energia na capital tem se mantido dentro de padrões
satisfatórios. No entanto, é fundamental que a concessionária e as
autoridades continuem a investir em manutenção e modernização da
infraestrutura. A atenção contínua é essencial para prevenir novas
instabilidades e assegurar que o fornecimento de energia continue
confiável para a população, apoiando o desenvolvimento econômico e a
qualidade de vida da cidade.
b) Florianópolis deu um salto impressionante na modernização de sua
iluminação pública, alcançando um marco notável em 2024. A
porcentagem de luminárias LED instaladas subiu de 45% em 2023 para
expressivos 77% em 2024, representando um total de 44.660
luminárias. Esse resultado extraordinário coloca a cidade na faixa
verde do sistema de semaforização, superando a meta de 50%. O
avanço é particularmente significativo se comparado ao ritmo lento de
crescimento observado nos anos anteriores, quando a cidade lutava
para sair da faixa vermelha. A transição para a iluminação LED é uma
conquista em múltiplas frentes. Além de reduzir o consumo de energia
e os custos de manutenção para o município, a tecnologia melhora a
segurança e a qualidade de vida da população. É um passo fundamental
em direção a uma cidade mais inteligente e sustentável. Agora, o foco
deve ser na conclusão da substituição das luminárias restantes para
atingir 100% de cobertura, garantindo a manutenção e a eficiência de
todo o sistema.
c) A porcentagem de energia proveniente de fontes renováveis em
Florianópolis continua a apresentar um cenário de grande volatilidade.
Em 2024, o indicador registrou 3,88%, representando uma leve
melhora em relação aos 1,95% dos dois anos anteriores, mas ainda
muito distante do patamar ideal. O resultado de 2024 mantém a cidade
na faixa vermelha, reforçando a necessidade urgente de políticas e
investimentos mais consistentes. O pico de 26,70% em 2021, que
colocou a cidade na faixa amarela, provou ser uma exceção, seguido por
uma queda brusca. A lenta recuperação observada em 2024 evidencia a
falta de uma estratégia de longo prazo para acelerar a transição
38
energética. Para alcançar um futuro mais sustentável e cumprir a meta
ambiciosa de mais de 50% de energia de fontes renováveis, é
fundamental que a cidade vá além de iniciativas pontuais. É preciso um
compromisso sério e contínuo com a implementação de tecnologias
limpas e o fomento à geração distribuída. A estabilidade do indicador
em patamares baixos sublinha o tamanho do desafio e a importância de
que a busca por uma matriz energética mais limpa se torne uma
prioridade inegociável.
7.1.5 Tema: Qualidade do Ar – 02 indicadores
A situação do monitoramento da qualidade do ar em Florianópolis
permanece inalterada em 2024, representando uma lacuna crítica na gestão
ambiental em relação aos dados fundamentais sobre a qualidade do ar que se
respira.
A única referência de dados disponíveis para a cidade é o registro de 2014,
quando a concentração de Material Particulado (MP) 10 foi de 23 μg/m³, um
índice satisfatório na época. Contudo, essa informação já obsoleta o que não
necessariamente reflete a realidade atual, que pode ser impactada pelo
crescimento da frota de veículos, atividades da construção civil e outros
fatores.
A ausência de um monitoramento contínuo impede que o poder público
identifique proativamente os riscos ambientais. E, igualmente importante, a
falta de acesso à informação de qualidade impede que a população compreenda
os riscos à sua própria saúde pública e exija políticas mais eficazes. Para
preencher essa lacuna, é fundamental que a cidade estabeleça parcerias
estratégicas com universidades e institutos de pesquisa. A implementação de
um sistema de monitoramento consistente é o primeiro e mais importante
passo para garantir que os dados não apenas sejam coletados, mas também
disponibilizados de forma transparente e acessível para todos os cidadãos.
7.1.6 Tema: Mitigação das mudanças climáticas – 01 indicador
A falta de dados para 2024 referente às emissões de GEE de
Florianópolis confirma a preocupação levantada nos relatórios anteriores: a
coleta de informações sobre este indicador é intermitente e carece de
consistência. Sem a atualização para o ano mais recente, não é possível avaliar
se a significativa redução para 1,74 toneladas per capita, registrada em
2023, reflete uma tendência sustentável ou foi apenas uma variação pontual.
39
Essa lacuna no monitoramento impede uma análise precisa do impacto das
políticas públicas de mitigação das mudanças climáticas. Desde 2014, os
registros têm sido irregulares e, em alguns casos, questionáveis pela sua
uniformidade. A ausência de dados para 2024 é um indicativo claro de que o
problema persiste e que o sistema de monitoramento não está alinhado com a
urgência do tema.
Para que Florianópolis possa, de fato, planejar e implementar estratégias
eficazes contra o aquecimento global, é fundamental que as autoridades, como a
Floram, estabeleçam um sistema de monitoramento contínuo e preciso.
Apenas com dados confiáveis e atualizados será possível avaliar o real progresso
da cidade, justificar investimentos e tomar decisões baseadas em evidências
para um futuro mais verde e resiliente.
7.1.7 Tema: Ruído – 01 indicador
O indicador de ruído nos principais pontos críticos de Florianópolis revela
uma lacuna de monitoramento ainda mais profunda do que a simples ausência
de dados anuais. Conforme informações da fonte, desde 2019, quando o
indicador foi incluído no acompanhamento, a estrutura de medição e
análise nunca foi implementada. Isso significa que, há cinco anos, a cidade
opera sem a capacidade de avaliar, de forma consistente, os níveis de poluição
sonora.
Essa falha sistêmica impede que a Prefeitura e a sociedade em geral tenham
acesso a informações essenciais para a saúde pública e o planejamento urbano.
Sem dados, é impossível identificar áreas críticas, entender os impactos do
ruído no bem-estar da população e desenvolver políticas públicas eficazes,
como ações de controle de tráfego e zoneamento.
A ausência de um sistema de monitoramento não é apenas um problema de
dados, mas um obstáculo fundamental para uma gestão urbana de qualidade. É
crucial que as autoridades reconheçam essa falha e tomem medidas imediatas
para criar a infraestrutura necessária para o acompanhamento do ruído. A
implementação desse sistema não é uma opção, mas uma etapa fundamental
para a garantia de um ambiente mais saudável e habitável para todos os
cidadãos de Florianópolis.
7.1.8 Tema: Vulnerabilidade Frente aos Desastres Naturais no
Contexto das Mudanças Climáticas – 05 indicadores
a) Em 2024, a cidade de Florianópolis manteve-se na faixa verde do
indicador, com 90% das áreas de risco mapeadas. Este é um
resultado positivo que demonstra o compromisso contínuo com a
segurança e o planejamento urbano. No entanto, a pequena queda em
40
relação aos anos anteriores, quando o mapeamento atingiu 100% de
cobertura de 2019 a 2023, acende um sinal de alerta. Embora o
resultado de 90% ainda seja considerado satisfatório, a redução de
dez pontos percentuais levanta questionamentos. É fundamental que as
autoridades identifiquem a causa dessa diminuição, seja por mudanças
na metodologia, o surgimento de novas áreas de risco não mapeadas ou
a descontinuidade de monitoramento em regiões já conhecidas. Para
garantir que a cidade mantenha um alto nível de preparação e
resiliência, é crucial investigar essa variação e trabalhar para retornar a
uma cobertura de 100%. A segurança da população depende de um
monitoramento abrangente e preciso, sem margem para lacunas.
b) O orçamento de Florianópolis destinado à mitigação de riscos
de desastres naturais apresentou uma queda preocupante em 2024.
A porcentagem alocada foi de apenas 0,07%, o que representa uma
redução significativa em relação aos anos anteriores e coloca o
indicador em um de seus patamares mais baixos desde 2020.
Analisando a série histórica, observa-se que o orçamento tem se
mantido na faixa vermelha (abaixo de 0,3%) desde 2020. Enquanto
houve um pequeno aumento progressivo entre 2020 e 2022, o valor de
2024 representa um retrocesso, distanciando a cidade ainda mais do
percentual ideal de mais de 0,5% necessário para a condição verde.
Essa falta de priorização orçamentária para a prevenção e resposta a
desastres naturais é alarmante, especialmente no contexto de um clima
cada vez mais instável. O baixo nível de investimento compromete a
capacidade da cidade de se tornar mais resiliente e segura. É crucial
que a administração pública reveja a alocação de recursos, pois o
aumento de verbas nessa área é fundamental para proteger vidas e a
infraestrutura urbana a longo prazo.
c) O indicador que acompanha o número de edificações em áreas de
risco em Florianópolis continua a apresentar um crescimento
alarmante. Em 2024, o número de unidades registradas subiu para
2.100, uma elevação significativa em relação às 1.593 de 2023 e às
1.080 de 2022. Essa tendência de aumento constante e acentuado,
mesmo sem uma série histórica mais ampla, já é um sinal de alerta
grave. O crescimento de edificações em locais suscetíveis a
deslizamentos e inundações indica um desafio cada vez maior para a
segurança e a resiliência da cidade. A ausência de um parâmetro de
semaforização não diminui a urgência da situação. A progressão de
1.080 para 2.100 unidades em apenas dois anos aponta para uma
expansão descontrolada de ocupações em áreas de risco. É fundamental
que as autoridades de Florianópolis intensifiquem as estratégias de
fiscalização, prevenção e, quando necessário, de realocação de famílias,
para mitigar os perigos e proteger a vida dos cidadãos.
41
7.2. Dimensão Urbana
Florianópolis (Plano de Ação Florianópolis Sustentável 2014 -
https://issuu.com/ciudadesemergentesysostenibles/docs/florianopolissustentav
el; acessado em 14/11/2024) definiu como estratégia de ação a busca da
garantia da sustentabilidade urbana, isto é, pensar permanentemente a relação
entre o ambiente natural e o ambiente construído. Para tanto é necessário um
planejamento estruturado de forma a atacar as vulnerabilidades, bem como
preparar o Município para as mudanças, gerenciando a expansão da
urbanização e evitando a expansão predatória sobre seus recursos ativos
ambientais. Isso implica organizar o seu território, implementar mecanismos de
integração de políticas públicas de criação de oportunidades de
desenvolvimento qualitativo de vida de sua população residente, imigrantes e
visitantes temporários. Ora o estado de cada indicador revela o avanço das
ações planejadas ou não. Cada vez mais fica evidenciado a importância do
fortalecimento da solidariedade e cooperação entre todos os Agentes da
Sociedade para a complementação das ações e resultados positivos esperados
ou preconizados. A solidariedade e cooperação não pode ser só um traço entre
indivíduos, grupos ou lugares, mas especialmente com a natureza, aspecto
especial marcante no caso de Florianópolis que protege praticamente 60% do
seu território como Áreas de Preservação Permanente, verdadeiro capital
natural de intensas trocas com o espaço social construído.
A sustentabilidade ambiental, econômica e social vem ganhando contornos
positivos crescentes, consequentemente gerando padrões mais elevados de vida
para seus habitantes, destacando-se como uma cidade muito atrativa no cenário
nacional. Há muitas questões preocupantes, mas algumas fizeram parte das
discussões da revisão do Plano Diretor como a expansão urbana, densidade,
verticalização, centralidades, mobilidade, orla marítima, habitação, … A falta de
informações sistemáticas como a expansão da malha urbana, densidade urbana,
déficit habitacional, etc em 2023 e 2024 prejudica o processo de análise e
visualização do desenvolvimento de Florianópolis. Resta-nos o pedido insistente
de fornecimento desses dados para a garantia das informações necessárias para
a sociedade florianopolitana.
7.2.1 Tema: Uso do Solo e Ordenamento Territorial – 11 indicadores
A) O indicador de crescimento da malha urbana de Florianópolis
continua a apresentar um desempenho positivo e consistente. Em 2024,
a expansão da malha viária foi de 1,41%, mantendo o percentual na
faixa verde do sistema de semaforização, que estabelece o limite de
3% ao ano para um crescimento saudável e planejado. Analisando a
série histórica disponível, é evidente que a cidade tem conseguido
manter o seu desenvolvimento dentro de um ritmo sustentável desde
2019. Os dados mostram uma flutuação controlada, mas sempre abaixo
do limite de alerta. A ausência de um registro para 2023 não impede a
análise de uma tendência de crescimento que, apesar da expansão, se
mantém alinhada com os princípios de um planejamento urbano
consciente e voltado à sustentabilidade.Esse resultado é um sinal
42
positivo de que Florianópolis está conseguindo conciliar seu
desenvolvimento com a necessidade de preservar sua qualidade de vida
e o meio ambiente natural. A manutenção desse padrão é fundamental
para garantir que o crescimento da cidade ocorra de forma ordenada e
benéfica para todos os cidadãos.
B) A análise do crescimento demográfico de Florianópolis em 2024
apresenta um desafio devido à falta de dados fornecidos pela fonte
oficial da Prefeitura Municipal de Florianópolis (PMF). No entanto, com
base em projeções e estimativas de fontes confiáveis como o IBGE, foi
possível obter uma visão atualizada e crucial sobre a dinâmica
populacional da cidade.Os dados mais recentes indicam que a
população de Florianópolis alcançou aproximadamente 576 mil
habitantes em 2024, com projeções apontando para cerca de 587,5
mil em 2025. Esse crescimento representa um aumento anual de
aproximadamente 1,9%. Embora inferior ao pico atípico de 4,01%
registrado em 2022, esse percentual ainda coloca o crescimento
demográfico na faixa vermelha (acima de 1,5% ao ano), confirmando
que a cidade mantém um ritmo de expansão acelerado. Essa rápida
elevação na densidade populacional intensifica a pressão sobre a
infraestrutura urbana, os serviços públicos e o meio ambiente. O
aumento da população exige uma gestão mais estratégica do espaço
urbano e um planejamento que garanta o equilíbrio entre a expansão da
cidade e a preservação de sua qualidade de vida. O monitoramento
contínuo e preciso desses indicadores é fundamental para que as
políticas públicas possam responder de forma eficaz aos desafios e
oportunidades que o crescimento acelerado impõe.
C) O indicador de densidade populacional por área urbanizada
continua a apresentar um aumento significativo. Embora a fonte oficial
não tenha fornecido dados para 2023 e 2024, a projeção baseada na
população do Censo de 2022 e nas estimativas mais recentes do IBGE
revela um crescimento contínuo. A densidade, que em 2022 era de
5.113,88 hab/km², é estimada em 5.300,22 hab/km² em 2023 e
atinge 5.486,56 hab/km² em 2024. Esse aumento progressivo da
densidade, que se mantém em um ritmo acelerado, reforça as
conclusões sobre a necessidade de um planejamento urbano eficaz.
Uma maior concentração de pessoas em uma área limitada gera
desafios relacionados ao congestionamento, à pressão sobre a
infraestrutura e à demanda por serviços públicos de qualidade. É crucial
que as autoridades municipais utilizem esses dados e projeções para
adotar medidas que garantam um desenvolvimento urbano ordenado. O
monitoramento preciso da densidade populacional é essencial para
assegurar que o crescimento da cidade não comprometa a qualidade de
vida dos cidadãos e a sustentabilidade ambiental.
D) A análise da porcentagem de moradias de Florianópolis que não
respeitam os padrões de habitabilidade enfrenta uma lacuna de
dados alarmante. Conforme informações da fonte, o último registro
43
oficial para este indicador é de 2019, quando o percentual era de
2,52%. A ausência de monitoramento sistemático desde então impede
qualquer avaliação sobre a situação atual e representa um obstáculo
para a gestão pública. No entanto, um relatório oficial mais recente
lança luz sobre a gravidade do problema habitacional. O "Estudo
Sobre o Déficit Habitacional de Florianópolis" (agosto de 2023),
de autoria do município, indicou que 6.163 famílias inscritas no
CadÚnico não possuem moradia adequada. Esse número representa
15% das famílias analisadas, um dado muito superior ao último
registro oficial disponível e que evidencia que a cidade enfrenta um
desafio habitacional muito maior do que o historicamente monitorado.
E) A análise do déficit habitacional quantitativo em Florianópolis está
comprometida pela falta de informações. A fonte não disponibilizou
dados para 2024, o que impede qualquer avaliação sobre a evolução de
um dos indicadores sociais mais críticos da cidade.
F) Os últimos dados disponíveis, de 2022 e 2023, já pintam um quadro
alarmante, com um déficit de 21.705 famílias, o que representa 52%
do total de famílias cadastradas no CadÚnico. Esse percentual está
muito acima do limite de 20% que estabelece a condição vermelha,
sinalizando um grave problema de acesso à moradia. A ausência de
dados para 2024, em particular, impossibilita saber se o cenário se
agravou, se estabilizou ou se as políticas do novo Plano Diretor, que têm
a moradia como ponto central, começaram a gerar resultados.Essa
lacuna na coleta de informações demonstra a falta de um sistema de
monitoramento eficaz e compromete a capacidade da Prefeitura de
gerir e mensurar a eficácia de suas políticas. Para que o compromisso
com a redução do déficit habitacional se traduza em ações efetivas, é
crucial que a cidade priorize a coleta de dados de forma contínua e
confiável. A transparência e a disponibilidade desses dados são
fundamentais para que o poder público e a sociedade possam
acompanhar o progresso e garantir que a população em vulnerabilidade
social tenha acesso a moradias dignas.
G) A falta de informações sobre o percentual de edificações em áreas de
conflito ambiental se tornou um problema crônico em Florianópolis.
Pelo segundo ano consecutivo, a fonte não disponibilizou dados para
2023 e 2024, criando uma lacuna de monitoramento que impede a
análise e a definição de ações eficazes. Os últimos dados disponíveis, de
2019 a 2022, já indicavam um cenário preocupante. Com percentuais
que variaram entre 9,24% e 10,65%, o indicador se manteve em
uma situação de alerta máximo, bem acima do limite de 2% que o
enquadra na faixa vermelha. Essa tendência histórica de ocupação
irregular em áreas de risco ambiental, combinada com a ausência de
monitoramento atual, é um fator de grande preocupação. Essa falta de
informações não apenas demonstra a incapacidade do poder público em
mensurar a dimensão do problema, mas também impede a avaliação do
impacto de iniciativas como o projeto REURB. É fundamental que a
44
cidade rompa com essa inércia e estabeleça um sistema de
monitoramento contínuo e transparente. A falta de dados pode levar a
uma percepção de que o problema foi negligenciado, comprometendo a
credibilidade e a eficácia das políticas de gestão territorial e ambiental.
H) A análise da gestão ambiental em Florianópolis revela um paradoxo
preocupante. A cidade se destaca por seu capital natural, com vastas
áreas protegidas sob legislações federais, estaduais e municipais,
formando um verdadeiro mosaico de conservação. Exemplos notáveis
incluem o Parque Nacional da Serra do Tabuleiro, o Parque Estadual do
Rio Vermelho e a Área de Proteção Ambiental (APA) de Santo Antônio
de Lisboa, além das 10 Unidades de Conservação (UCs) de gestão
municipal. No entanto, a eficácia da proteção dessas áreas está em
sério risco. O indicador de UCs com plano de manejo, que é
fundamental para a gestão e fiscalização, registrou uma queda
alarmante. Em 2024, apenas 20% das UCs municipais tinham seu
plano de manejo, uma redução drástica em relação aos 41,6% de
2022. Essa queda representa um retrocesso significativo, distanciando
a cidade da meta desejável de mais de 95%. A falta de planos de
manejo adequados compromete a integridade dessas áreas protegidas e
agrava problemas já existentes, como a ocupação irregular do solo.
Embora o percentual de áreas parceladas com irregularidades tenha se
mantido estável em torno de 37,89% em 2024, a ausência de um
plano de gestão robusto para as UCs dificulta o combate a novas
irregularidades. O novo Plano Diretor aprovado na Câmara é um
instrumento fundamental para o ordenamento territorial. No entanto,
sua eficácia depende da sua capacidade de ser colocado em prática, o
que, no caso das áreas protegidas, requer a conclusão urgente dos
planos de manejo para garantir a segurança e a preservação do
inestimável patrimônio natural de Florianópolis.
7. 2.2 Tema: Desigualdade Urbana – 07 indicadores
Esse tema tem uma importância significativa porque mede a qualidade de vida
no processo de urbanização nos diferentes segmentos sociais da cidade.
A) A análise dos indicadores de pobreza e desigualdade em Florianópolis
para 2024 traz um cenário com avanços notáveis, embora desafios
persistam. A cidade continua a se destacar no contexto nacional,
reforçando sua posição como um local com melhores condições sociais.
Os dados mais recentes da PNAD Contínua (2023) indicam que a
porcentagem da população de Florianópolis vivendo abaixo da
linha internacional de pobreza é de 4,8%. Esse número representa
uma melhoria em relação aos 5,27% registrados em anos anteriores. A
informação sobre a linha nacional de pobreza se mantém em
4,81% (repetindo o dado de 2023). Embora a situação da capital seja
45
muito superior à média nacional (29,6%) e estadual (10,16%), é
importante notar que o patamar atual ainda é significativamente mais
alto que o registrado no Censo de 2010, quando a taxa era de apenas
1,35%. Isso evidencia que, apesar dos avanços, o combate à pobreza
ainda exige atenção contínua. O indicador que mede a concentração de
renda em Florianópolis alcançou uma marca histórica. Com o registro
de 0,4 no Coeficiente de Gini (dados IBGE 2023), a cidade atingiu a
condição de situação satisfatória, conforme estabelecido para este
relatório. Essa marca representa um avanço significativo em relação ao
0,41% de 2022 e 0,54% de 2010. A redução da desigualdade de renda
é uma das maiores conquistas da cidade neste período, demonstrando
que políticas e dinâmicas econômicas estão contribuindo para uma
distribuição de renda mais equitativa. Em resumo, a cidade celebra a
conquista de ter alcançado um patamar satisfatório na redução da
desigualdade. No entanto, o desafio de diminuir o percentual da
população abaixo da linha de pobreza, que ainda está acima dos níveis
históricos, deve permanecer como uma prioridade na agenda de
políticas públicas.
B) A análise da remuneração média dos trabalhadores formais em
Florianópolis continua comprometida pela falta de dados atualizados. A
fonte responsável pelo seu relatório não disponibilizou informações
para 2023 e 2024, criando uma lacuna que impede o monitoramento
em tempo real da saúde econômica da cidade. No entanto, com base em
fontes de dados públicas e oficiais, podemos atualizar a análise até o
ano mais recente com informações consolidadas.
● Dados da RAIS (Ministério do Trabalho e Emprego): O
conjunto de dados completo mais recente da RAIS, divulgado
em 2023, aponta para o ano de 2022. Conforme essa fonte, a
remuneração média dos trabalhadores formais em Florianópolis
subiu para R$ 5.867,14, o que representa um aumento em
relação ao salário de R$ 5.459,98 (RAIS 2021) do ano anterior.
A ausência de informações para os anos de 2023 e 2024, no entanto,
reforça a necessidade de um sistema de coleta de dados mais ágil e
consistente. Sem ele, a capacidade da cidade de entender as
desigualdades urbanas, planejar políticas econômicas e avaliar a
qualidade de vida da população em tempo real fica significativamente
limitada.
7. 2.3 Tema: Mobilidade e Transporte – 23 indicadores.
A mobilidade e o transporte em Florianópolis continuam a ser um dos desafios
mais urgentes da cidade, afetando a rotina de moradores e o fluxo de turistas. A
complexidade do problema abrange desde a infraestrutura viária limitada,
que cria pontos de congestionamento crônico, até a falta de um sistema
46
integrado de modais, que poderia desafogar as vias e oferecer alternativas ao
uso massivo do carro particular.
A geografia única da cidade, com suas pontes e a divisão entre ilha e continente,
amplifica as dificuldades, evidenciando a necessidade de um planejamento
regional que vá além dos limites municipais. Há um consenso de que a solução
para os gargalos urbanos passa por uma gestão mais eficiente do sistema de
transporte público coletivo, a implementação de novas tecnologias e a
integração de modais como o transporte marítimo.
Nesse cenário, iniciativas como o projeto da Marina da Beira-Mar Norte, que
sinaliza o destravamento de um sistema de transporte marítimo, representam
um passo positivo. O caminho para uma mobilidade urbana mais eficiente
exige a colaboração de todos e a implementação de ações concretas para uma
cidade mais fluida e conectada.
Convém destacar;
Mobilidade e Transporte Urbano: Panorama 2024
a) A mobilidade urbana em Florianópolis, um dos desafios mais complexos
da cidade, apresentou um cenário de contrastes em 2024. Enquanto a
capacidade do sistema de transporte público teve um aumento notável,
a eficiência e o custo do serviço continuaram a preocupar. A alta
motorização da população segue sendo um obstáculo, mas avanços na
segurança viária indicam um caminho positivo.
Transporte Público: Custo, Velocidade e Capacidade
b) O custo do transporte público por passageiro subiu para R$ 5,84 em
2024, continuando a tendência de aumento dos últimos anos. A
velocidade média da frota, por sua vez, registrou uma leve queda,
chegando a 22,91 km/h, um índice que a mantém na faixa amarela
(15-30 km/h) e longe do ideal de fluidez.
c) Em contrapartida, a capacidade de transporte ofertada teve um
aumento expressivo, atingindo a média mensal de 16.099.959,
superando o pico histórico de 2022. Esse crescimento na oferta é
fundamental para atender à crescente demanda. No entanto, o sistema
ainda carece de modernização: a frota continua sem veículos movidos a
energia elétrica, com 0% de adoção, e a idade média dos ônibus subiu
para 8,94 anos, indicando que, embora ainda na faixa amarela, a frota
está envelhecendo e se distanciando da meta de uma frota mais nova e
eficiente.
Desafios da Motorização e Infraestrutura
d) A quantidade de veículos particulares per capita registrou um novo
pico, chegando a 0,723, retornando ao patamar de 2022 e se mantendo
muito acima do ideal de 0,3. Esse número elevado de carros é um dos
47
principais fatores para a baixa velocidade do transporte público e os
congestionamentos, que se refletem na velocidade média de viagem
durante os horários de pico, que subiu para 21,81 km/h em 2024. A
falta de dados sobre a pavimentação de vias e calçadas também impede
uma avaliação completa da infraestrutura de mobilidade a pé e por
outros modais.
Segurança e Tendências Positivas
e) No quesito segurança, a cidade manteve o bom desempenho. O número
de vítimas mortais em acidentes de trânsito por 100 mil habitantes,
embora tenha subido para 8,5 em 2024, permanece na faixa verde
(<10).
Em resumo, Florianópolis precisa urgentemente equilibrar a oferta crescente de
capacidade do transporte público com investimentos na modernização da frota
e em infraestrutura. A redução da motorização e o aumento da fluidez do
trânsito são desafios que exigem um planejamento abrangente e a
implementação de novas tecnologias para transformar o cenário da mobilidade
urbana da cidade.
7. 2.4 Tema: Ambiente de Negócios – 01 indicador
a) A análise do tempo necessário para abrir uma empresa em
Florianópolis mostra um avanço notável e consistente ao longo dos
anos. O indicador, que já foi de 15 dias em 2019 e chegou a
preocupantes 21 dias em 2020, demonstra agora uma eficiência
impressionante. Com o tempo médio caindo para 5 horas em 2024, a
cidade estabelece um novo padrão de agilidade e se consolida na faixa
verde do sistema de semaforização. Essa redução drástica no tempo de
abertura de negócios é um fator crucial para a competitividade de
Florianópolis. A agilidade nos processos burocráticos cria um ambiente
favorável ao empreendedorismo, atrai novos investimentos e fortalece o
ecossistema de inovação, o que é essencial para uma cidade com forte
vocação para a economia criativa e tecnológica. Esse desempenho é um
sinal claro do compromisso da gestão em remover barreiras e promover
o desenvolvimento econômico de forma mais eficiente.
7. 2.5 Tema: Tecido Produtivo – 08 indicadores
a) A análise da movimentação no Aeroporto de Florianópolis para o
período de 2022 a 2024 revela uma tendência de crescimento
expressiva tanto no transporte de passageiros quanto de cargas. Esse
aumento demonstra a crescente relevância do aeroporto como um hub
logístico e de turismo para a cidade e a região. Transporte de Carga:
O volume de cargas transportadas registrou um crescimento notável. A
48
carga internacional mais que dobrou em dois anos, passando de 2.500
toneladas em 2022 para 6.568 toneladas em 2024. De forma
semelhante, a carga doméstica teve um aumento significativo, indo de
3.550 toneladas em 2022 para 6.578 toneladas em 2024. Esse
desempenho indica um fortalecimento da economia e do comércio da
cidade, que está se consolidando como um ponto estratégico para a
logística de bens e mercadorias. Transporte de Passageiros: O fluxo
de passageiros também teve uma ascensão contínua e acentuada. O
número de pessoas transportadas aumentou de 3.393.219 em 2022
para quase 5 milhões em 2024, alcançando a marca de 4.895.252
passageiros. Esse crescimento reflete a recuperação do setor de
turismo e a atratividade da cidade, impulsionando a economia local e os
serviços relacionados. A disponibilidade de dados nos últimos anos,
proporcionada pela concessão do aeroporto, permite um
monitoramento contínuo e a criação de uma série histórica confiável.
Essa base de informações é fundamental para que o planejamento
municipal possa se alinhar à demanda crescente, garantindo a
infraestrutura e os serviços necessários para apoiar o desenvolvimento
sustentável da cidade.
b) A análise da movimentação na Rodoviária de Florianópolis em 2024
revela uma clara tendência de crescimento e a inclusão de um novo
indicador que amplia a capacidade de gestão da cidade. O ano de 2024
marca a primeira coleta de dados sobre o fluxo de ônibus na
rodoviária(indicador novo). A fonte informou um total de 149.058
viagens registradas ao longo do ano, sendo 72.618 de chegadas e
76.440 de partidas. A criação deste indicador é um passo importante
para um monitoramento mais detalhado da logística de transporte
intermunicipal e interestadual, permitindo futuras análises sobre a
sazonalidade e a eficiência do serviço. O número de pessoas
transportadas pela rodoviária demonstra um crescimento contínuo
e robusto. O total de passageiros aumentou de 1.642.065 em 2022
para 2.023.555 em 2023, e em 2024, alcançou a marca de
2.500.536. Esse crescimento de cerca de 23,6% em relação a 2023
reflete o aumento do turismo e o dinamismo da região. A tendência de
crescimento, agora com uma série histórica de três anos, indica que a
rodoviária está se consolidando como um ponto cada vez mais vital para
a mobilidade de pessoas, exigindo um planejamento que garanta a sua
eficiência e capacidade de atendimento.
c) A falta de acesso a dados atualizados pela fonte é o ponto mais crítico
na análise do PIB per capita. A repetição do valor de R$ 45.603 para
os anos de 2023 e 2024 demonstra que, desde 2021, a cidade não tem
um sistema de monitoramento para um dos indicadores econômicos
mais importantes. Essa ausência de dados impede a avaliação do
impacto de políticas e do desempenho da economia da capital nos
últimos anos. Apesar da falha no monitoramento, uma consulta aos
dados oficiais do IBGE, que costumam ter defasagem de dois a três
49
anos, confirma o potencial econômico de Florianópolis. Segundo o
IBGE, a cidade manteve uma posição de destaque no ranking nacional
de PIB per capita. A última informação consolidada e oficialmente
divulgada pelo IBGE é de 2021. Nela, a capital catarinense registrou um
PIB per capita de R$ 45.603, o que a colocou em uma posição de
liderança entre as capitais brasileiras. O PIB per capita de Florianópolis
superou a média nacional e a de diversas outras capitais, evidenciando
sua robustez econômica, impulsionada pelos setores de tecnologia,
serviços e turismo.
d) A análise da taxa de crescimento do PIB per capita de
Florianópolis em 2024 revela uma trajetória instável e preocupante
nos últimos anos. Após um período de crescimento robusto entre 2019
e 2021, o indicador sofreu uma queda brusca e ainda não se recuperou.
Nos anos anteriores, a cidade se destacou por seu desempenho
econômico. De 2019 a 2021, a taxa de crescimento se manteve na faixa
verde (> 2,5%), com picos expressivos, o que a colocou em uma
posição de destaque nacional. No entanto, em 2022, a fonte aponta
para um crescimento negativo de -4,46%, uma retração econômica
significativa que interrompeu a tendência de alta. O cenário não
melhorou nos anos seguintes, com a taxa de crescimento estagnada em
1,08% em 2023 e 2024. Esse resultado coloca o indicador na faixa
vermelha (< 2%), sinalizando que a economia da cidade não está mais
superando o crescimento do PIB nacional como em anos anteriores.
7.2.6 Tema: Mercado Laboral – 03 indicadores
A análise dos indicadores de emprego em Florianópolis para 2024 revela um
cenário de contrastes que exige atenção. Se, por um lado, a cidade mantém um
desempenho robusto no combate ao desemprego, por outro, a composição do
mercado de trabalho aponta para desafios na qualidade das ocupações. A taxa
de desemprego de Florianópolis permanece em um patamar de excelência,
situando-se em 4,40% em 2024. Esse resultado, que a mantém na faixa verde
(<7%), reflete a força da economia local e sua capacidade de gerar empregos. A
estabilidade do indicador, com uma leve variação em relação aos 4,30% de
2023, demonstra uma resiliência notável no mercado de trabalho. Apesar da
baixa taxa de desemprego, a análise da formalidade dos empregos levanta
preocupações. A porcentagem de população ocupada formalmente teve
uma queda significativa em 2023, para 63,63%, e se manteve na faixa
vermelha (<65%) em 2024, com 64,40%. Esse desempenho é um retrocesso
em relação aos 72% de 2022, que colocavam a cidade na faixa amarela. A falta
de dados para o indicador de emprego informal em 2024 impede uma análise
completa, mas a tendência de queda do emprego formal sugere que o baixo
desemprego pode estar sendo compensado pelo crescimento do setor informal,
onde a proteção e a segurança dos trabalhadores são menores. Para que
Florianópolis garanta um desenvolvimento social justo, é fundamental que as
50
políticas públicas foquem não apenas na criação de empregos, mas na sua
formalização e na melhoria de sua qualidade.
7. 2.7 Tema: Educação – 19 indicadores
Educação e Capital Humano
a) A análise dos indicadores de educação em Florianópolis para 2024
revela um cenário complexo, com sinais positivos de inclusão e
qualificação docente, mas com preocupantes retrocessos na qualidade
da aprendizagem e na estrutura de contratação dos professores.
Qualidade da Aprendizagem e Desempenho (IDEB)
b) Os indicadores de desempenho educacional mostram uma tendência
negativa alarmante. A nota do IDEB para os anos iniciais caiu de 5,95
(2021-2022) para 5,8 em 2024, mantendo-se na faixa amarela. A
situação é ainda mais crítica nos anos finais, onde a nota caiu de 5,2
para 4,6, saindo da faixa amarela e entrando na vermelha. Essa queda
nas notas é acompanhada por uma redução drástica no percentual de
alunos com desempenho satisfatório. Em Matemática, o índice caiu de
18% para 14%, e em Leitura, de 43% para 31% em 2024. Esses
dados sinalizam um desafio urgente na qualidade da educação básica do
município.
Estrutura e Qualificação do Corpo Docente
c) A estrutura de contratação de professores revela uma tendência
preocupante. A porcentagem de professores efetivos na rede
municipal caiu significativamente, de 51,1% em 2022 para 39,30%
em 2024, entrando na faixa vermelha. Em contrapartida, a
porcentagem de contratações temporárias (ACTs) subiu para
60,7%, entrando na faixa vermelha. Essa precarização do emprego
docente pode ser um fator que contribui para a queda na qualidade da
aprendizagem.
d) Apesar da instabilidade no modelo de contratação, o corpo docente
demonstra alta qualificação. O município alcançou a faixa verde em
especialização, com 61,07% dos professores, e em mestrado
(13,12%) e doutorado (4,17%), o que os coloca nas faixas amarela e
verde, respectivamente. Isso evidencia um capital humano qualificado
que, no entanto, opera em uma estrutura de trabalho cada vez mais
instável.
Inclusão e Acessibilidade
e) Nos indicadores de inclusão, Florianópolis mostra um desempenho
positivo e consistente. O número de estudantes com necessidades
especiais matriculados na educação básica continuou a crescer,
chegando a 1.952 alunos em 2024. Além disso, a acessibilidade nas
escolas foi mantida em um patamar de excelência, com 96,21% das
51
unidades de ensino cumprindo a Lei de Acessibilidade, o que mantém a
cidade na faixa verde e demonstra um forte compromisso com a
inclusão.
Alfabetização e Nível Superior
f) A taxa de analfabetismo, que havia caído para 1,10% em 2023, voltou a
subir para 1,4% em 2024, mantendo o indicador na faixa amarela. A
falta de dados atualizados sobre o número de pessoas com ensino
superior completo (>25 anos) impede uma análise precisa do capital
humano da cidade, uma vez que o dado de 383.891 pessoas está
estagnado desde 2022.
Em suma, Florianópolis tem feito avanços importantes em
inclusão e qualificação docente, mas os dados de 2024 sobre o
desempenho educacional e a precarização do corpo docente são
sinais de alerta que precisam de atenção imediata para que a
cidade não comprometa o seu futuro capital humano.
7. 2.8 Tema: Segurança – 10 indicadores
A análise dos indicadores de segurança pública em Florianópolis para 2024
revela uma tendência geral positiva, com a cidade mantendo um desempenho
sólido na redução de crimes violentos e contra o patrimônio. Apesar de
oscilações, a capital consolida-se em um patamar de segurança elevado quando
comparada a outras cidades brasileiras.
Crimes Violentos: Tendência de Baixa Continua
a) A taxa de homicídios por 100 mil habitantes permaneceu na faixa
verde (<10), registrando 5,40 em 2024. Embora represente uma leve
alta em relação aos 4,50 de 2023, o valor demonstra que a tendência
de queda gradual observada desde 2019 se mantém, afastando a cidade
da faixa amarela e vermelha. Da mesma forma, os latrocínios
registraram um resultado excelente em 2024, com 0,00 por 100 mil
habitantes, mantendo-se na faixa verde.
b) O número de feminicídios por 100 mil mulheres teve uma leve alta
em 2024, chegando a 0,50, o que mantém a cidade na faixa verde e
abaixo dos picos de anos anteriores.
Crimes contra o Patrimônio: Estabilidade e Oscilações
c) Os crimes contra o patrimônio, em sua maioria, também se mantiveram
em patamares controlados. Os roubos por 100 mil habitantes
registraram 153 em 2024, mantendo a cidade na faixa verde (<300).
De forma similar, os roubos de veículos por 100 mil habitantes
caíram para 13,9, um dos menores índices da série histórica.
52
d) Os furtos e os crimes contra a propriedade apresentaram uma
situação mais volátil. Embora os furtos tenham registrado um leve
recuo em 2024 (2661,4), o número permanece em patamares elevados.
Já os crimes contra a propriedade recuaram de 10,9 em 2023 para 8,8
em 2024, mantendo-se na faixa verde.
Em resumo, os dados de 2024 reforçam a percepção de que Florianópolis é uma
cidade segura, especialmente em relação a crimes violentos. A manutenção da
taxa de homicídios e a queda nos roubos e roubos de veículos são destaques
positivos. No entanto, é necessário manter o monitoramento e o investimento
em prevenção para evitar a escalada de furtos e garantir que a segurança
continue a ser uma prioridade.
7. 2.9 Tema: Saúde – 43 indicadores
Mortalidade e Saúde da População
a) A cidade demonstra uma tendência positiva na redução das taxas de
mortalidade. A Taxa de Mortalidade Geral continuou a cair em 2024,
chegando a 518,60 por 100 mil habitantes. Essa redução é
observada tanto em homens (548,67) quanto em mulheres (490,40),
indicando uma melhora geral na expectativa de vida.
b) A taxa de mortalidade infantil se manteve consistentemente na faixa
verde (<20), variando de 5,22 em 2019 a 6,90 em 2024. Essa
estabilidade em um patamar baixo é um sinal claro da qualidade dos
cuidados com a saúde de crianças na cidade. A mortalidade por causas
externas teve um pico em 2022 (50,82), mas apresentou queda para
44,59 em 2024, mostrando progresso. A Taxa de Mortalidade por
Doenças Cardiovasculares também recuou em 2024 para 141,40,
após um pico em 2023. No entanto, a Taxa de Mortalidade por
Neoplasias (câncer) teve uma leve redução, mas permanece em um
patamar elevado, de 140,19, indicando a necessidade de maior atenção
a essa área.
Infraestrutura e Serviços de Saúde
c) A infraestrutura de saúde da cidade continua robusta. A Quantidade
de Leitos de Hospital por 100 mil habitantes registrou 347,02 em
2024, mantendo-se na faixa verde (>100) e bem acima da meta ideal.
De forma similar, a Quantidade de Médicos por 100 mil habitantes
chegou a 3.060,03 em 2024, um número impressionante que mantém
a cidade na faixa verde (>200) e demonstra a alta disponibilidade de
profissionais de saúde. A cobertura da saúde da família também é um
ponto forte. Após um salto em 2021 (108,88%), o índice se
estabilizou em um patamar acima de 100%, chegando a 108,39% em
2024.
53
Doenças Crônicas e Cobertura Vacinal
d) O monitoramento da prevalência de doenças crônicas apresenta uma
lacuna crítica. Os dados de 2024 para a Prevalência de Hipertensão
e Diabetes não foram fornecidos, impossibilitando uma avaliação da
evolução dessas condições que, nos anos anteriores, já se encontravam
em uma situação preocupante. A Prevalência de Obesidade teve um
pequeno aumento para 21,91% em 2023.
e) A maioria das vacinas teve um aumento significativo na cobertura entre
2023 e 2024, o que é uma tendência muito positiva. As coberturas para
Pentavalente, Pneumo 10, Poliomielite e Tríplice Viral mostram
avanços de mais de 5% em um único ano. A DTPA ADULTO alcançou
75,39%, aproximando-se da meta. Apesar do progresso, muitas
vacinas permanecem com baixa cobertura e longe das metas. A BCG
(39,17%) e a Hepatite B ao nascer (34,94%) continuam na faixa
vermelha, indicando uma falha na imunização nos primeiros meses de
vida. A cobertura da Varicela (56,70%) e da Febre Amarela
(66,39%) também está muito abaixo da meta de 95%.
A análise da saúde em Florianópolis em 2024 reforça a percepção de que a
cidade possui um sistema de saúde com infraestrutura e profissionais de alto
nível, o que se reflete na baixa mortalidade. No entanto, a ausência de dados
cruciais sobre doenças crônicas e a baixa cobertura de algumas vacinas indicam
a necessidade de um sistema de monitoramento mais abrangente. Para uma
visão completa, é fundamental que a cidade vá além do registro de doenças e
invista na coleta de indicadores de saúde da população, promovendo uma
abordagem mais preventiva e proativa.
7. 2.10 Tema: Capital Humano – 02 indicadores:
Os investimentos em cultura em Florianópolis demonstram uma clara e
consistente elevação de prioridade nos últimos anos, refletindo um
compromisso em fortalecer o capital humano da cidade. A análise dos dados de
2024 confirma que a cidade se consolidou em um patamar de destaque nesse
quesito.
Investimento per capita em Cultura
a) Após uma queda em 2020 e 2021, o investimento em cultura por
habitante teve uma recuperação notável. Em 2022, o valor de R$
26,24 já posicionava a cidade na faixa amarela. O ano de 2023 marcou
uma mudança de patamar, com o investimento saltando para R$ 58,22,
o que coloca a cidade na faixa verde de excelência. Em 2024, o valor
se manteve em um nível elevado, registrando R$ 52,26. Essa
consistência mostra que a priorização da cultura não foi um evento
isolado, mas uma decisão estratégica para a cidade.
Investimento em Cultura sobre Receita Corrente Líquida
54
b) O indicador que mede o investimento em relação à receita da prefeitura
também ilustra essa nova prioridade. Depois de anos com percentuais
abaixo de 1% , o investimento atingiu 1,04% em 2023, representando
um novo patamar de comprometimento. Embora o percentual tenha
recuado para 0,89% em 2024, a análise da série histórica mostra que
a cidade elevou o peso da cultura em seu orçamento, saindo de uma
posição de desvantagem para uma de maior prioridade.
Em suma, os dados de 2024 confirmam uma tendência muito positiva.
Florianópolis não apenas se recuperou dos baixos investimentos de anos
anteriores, mas estabeleceu um novo padrão de alocação de recursos para a
cultura, alinhando-se à sua identidade de cidade criativa e tecnológica e
reforçando um dos pilares de seu capital humano.
7. 2.11 Tema: Tecido Empresarial – 15 indicadores
Com base nos 15 novos indicadores, que, embora ainda sem semaforização, já
oferecem uma base histórica para análise, é possível traçar um panorama
promissor e dinâmico do tecido empresarial de Florianópolis. Os dados desde
2019 revelam uma economia em crescimento, com resiliência pós-pandemia e
setores estratégicos em ascensão.
Crescimento Geral e Dinamismo
a) O cenário empresarial de Florianópolis demonstra um dinamismo
notável. O número de empresas ativas na cidade teve um aumento
expressivo, passando de 7.660 em 2021 para 24.779 em 2024. Esse
crescimento exponencial, combinado com uma taxa anual de abertura
de novas empresas consistentemente acima de 20%, indica um
ambiente favorável ao empreendedorismo e uma economia vibrante.
b) O percentual de exportações de bens e serviços também reforça
essa tendência, com um aumento contínuo. O valor das exportações
cresceu de US$ 40,84 milhões em 2021 para US$ 65,23 milhões
em 2024, sinalizando uma crescente inserção da cidade no comércio
internacional.
Desempenho dos Setores Chave
c) Tecnologia: O setor de tecnologia consolida sua posição como motor
da economia local. O crescimento de pessoas empregadas manteve-se
forte, e o faturamento das empresas teve um aumento de 28,39% em
2024, após uma alta de 25,07% no ano anterior. A participação do
setor na arrecadação de impostos totais cresceu de 15,78% em 2023
para 18,87% em 2024, demonstrando sua relevância fiscal e
econômica.
d) Turismo e Gastronomia: O setor de hotelaria, bares e restaurantes
mostrou uma recuperação robusta após os impactos da pandemia. A
ocupação de leitos em hotéis e pousadas alcançou 63,80% em
2024, superando os 57,16% de 2023. O faturamento de bares e
55
restaurantes teve um crescimento sólido de 13,04% em 2024, e sua
participação na arrecadação de impostos totais dobrou em um ano,
chegando a 2,14%, um sinal de recuperação e formalização.
e) Saúde Privada: O setor de saúde privada também se destaca, com um
crescimento constante em sua participação nos impostos, que chegou a
6,32% em 2024. Isso reflete o papel crescente do setor na economia
e na prestação de serviços à população.
A análise dos indicadores mostra que o tecido empresarial de Florianópolis é
resiliente e dinâmico. Os dados de 2024 reforçam a importância dos setores de
tecnologia, turismo e saúde para o desenvolvimento da cidade. A tendência
geral de crescimento no número de empresas, nas exportações e no
faturamento dos setores-chave é um sinal muito positivo. No entanto, a falta de
dados sobre o crescimento de empregos em setores como hotelaria e bares e
restaurantes é uma lacuna a ser superada, sendo essencial para uma análise
completa do mercado de trabalho.
7. 3 - Dimensão Fiscal e Governança
7.3.1 Tema : Gestão Pública Participativa – 01 indicador
A análise do único indicador para o tema de Gestão Pública Participativa revela
uma inconsistência fundamental, que impede o monitoramento efetivo do
envolvimento da sociedade civil na definição do orçamento. A ausência de uma
métrica clara e consistente ao longo dos anos torna impossível avaliar a
evolução da participação popular.
O indicador de porcentagem do orçamento com participação da
Sociedade Civil passou por uma série de mudanças em sua medição. O ano de
2019 apresentou um valor de 12,47%, mas a partir de 2020, a métrica mudou
para 5% da arrecadação do IPTU, um valor que, embora fixo, representa uma
porção muito limitada do orçamento municipal.
A falta de uma métrica quantitativa se acentuou ainda mais em 2024, quando o
indicador passou a ser descrito como um processo legal de pelo menos duas
audiências públicas para cada peça orçamentária (PPA, LDO e LOA). Embora a
realização de audiências seja um avanço em termos de processo e formalidade,
a mudança impede que se meça a porcentagem real do orçamento influenciada
pela população.
56
7. 3.2 Tema: Gestão Pública Moderna – 09 indicadores
a) A gestão municipal avança de forma notável na modernização de seus
processos. Em 2024, a porcentagem de processos digitais
concluídos alcançou 88%, colocando a cidade na faixa amarela e a
um passo de alcançar o patamar de excelência. Esse resultado reflete o
sucesso na digitalização e na agilidade dos serviços.
b) O compromisso com a transparência também é evidente. O Índice de
Transparência da Gestão Municipal se manteve em 98% em 2024,
na faixa verde, enquanto o número de serviços online para o
cidadão cresceu de forma constante, chegando a 210 e colocando a
cidade na faixa verde por oferecer mais de 200 serviços.
Compras Públicas: Modernização e Desafios
c) A Prefeitura de Florianópolis fez um progresso significativo na
modernização de suas compras. As modalidades de pregão presencial
e tomada de preços foram praticamente eliminadas, ambas com 0%
de participação em 2024. Em contrapartida, o pregão eletrônico
representou 53,62% do total das compras.
d) No entanto, um ponto de preocupação é o crescimento expressivo das
compras por contratação direta, que subiram de 2,27% em 2020
para 20,55% em 2024. Esse aumento no uso de compras sem
licitação representa um retrocesso em relação à transparência e à
competitividade, exigindo um rigoroso monitoramento por parte da
gestão municipal.
Eficiência da Gestão de Pessoal
e) A análise dos gastos com pessoal e da eficiência demonstra desafios a
serem superados. Em 2024, a porcentagem de gasto com pessoal em
relação ao gasto total foi de 46,07%, uma redução de 15,5% em
comparação com o ano anterior. Apesar dessa melhora, a eficiência
pode ser comprometida pelo alto índice de horas de falta, que somou
10,76% em 2024. Esse percentual corresponde a mais de um mês de
trabalho perdido por ano.
Em resumo, a cidade de Florianópolis se destaca como líder em modernização
digital, com indicadores de serviços online e transparência em patamares de
excelência. No entanto, a gestão enfrenta uma contradição: o avanço
tecnológico em serviços não foi acompanhado pela melhoria em processos
fundamentais de gestão fiscal, transparência em compras e eficiência de
pessoal, o que exige atenção urgente para garantir um desenvolvimento
completo e sustentável.
57
7.3.3. Tema: Transparência -01 indicador
a) Pelo portal https://radardatransparencia.atricon.org.br/, observamos que
Florianópolis, desde o ano de 2022, apresenta uma classificação ouro,
numa média de 89,44%, considerada excelente.
7. 3.4 Tema: Impostos e Autonomia Financeira - 11 indicadores
a) Os indicadores deste grupo estão razoavelmente adequados com as
seguintes exceções:
i) Indicador “Porcentagem da variação anual da cota parte
do ICMS” e “Porcentagem de variação anual da
arrecadação do ISS”- Indicam que a atividade econômica
tem crescimentos pois: “% de variação do ICMS e do ISS” foi
superior ao IPCA de 2024 (4,83). O ICMS cresceu 7,8 acima do
IPCA e do ISS 5,1% acima do IPC``
ii) O Indicador “Porcentagem de variação anual da arrecadação
do IPTU” foi de 2,09% (abaixo da inflação), o que indica deficiência
da administração no processo de cobrança ativa e/ou valores da
planta de imóveis não atualizadas.
iii) Indicador “Porcentagem de variação da dívida ativa” - nos
mostra um crescimento contínuo, desde 2020, o que indica uma
grande dificuldade da administração de cobrar os seus devedores.
iv) Indicador “Porcentagem de inadimplência do IPTU”- Este
indicador teve uma redução em relação aos 2 anos anteriores, mas
ainda assim é elevado 16,7%.
7. 3.5. Tema : Gestão do Gasto Público – 05 indicadores
a) Indicador “Porcentagem dos gastos correntes em relação aos gastos
totais” - Em 2024 foi levemente inferior ao IPCA, apresentando o resultado
de 86,21%, o que é bastante positivo, mas quase não existe sobra de recursos
para investimentos na obras necessárias para o desenvolvimento da cidade, o
que está na origem do crescente endividamento da cidade, que tem brecado o
acesso a mais créditos no sistema financeiro.
b) Para o indicador “Taxa de crescimento anual do gasto corrente”: Com
base na adequação de dados apresentada pela fonte, verificamos que o
Indicador cresceu em torno de 106% no intervalo 2017 a 2024, enquanto o
IPCA no período subiu 48,6%, ou seja um crescimento real acima de 40%. No
ano de 2024 esta despesa cresceu 4,46% ficando levemente abaixo do IPCA
do ano. Isto é bastante positivo, mas deveria ser acelerada esta redução da
despesa para melhorar a capacidade de investimento e possibilitar a redução
do endividamento que é extremamente elevado.
58
7. 3.6 Tema : Gestão da Dívida – 04 indicadores
a) Indicador “Despesas de Pessoal em relação a receita líquida” - Este
indicador em 2024 apresentou o resultado de 48,46% e está levemente
abaixo do ano anterior, mas já esteve em 45% nos anos 2021/2022.
b) Indicador “Despesas com terceirização de pessoal (PJ + PF + Locação
de Mão de obra)” - Indicador foi 4,2% em 2024 e mantem-se na faixa dos
anos anteriores. Devemos observar que este indicador somado ao indicador
“Despesa de pessoal/Receita corrente líquida: percentual da
despesas totais (salário + encargos + vales transporte e alimentação
+ plano de saúde) e de pessoal em relação a receita corrente líquida”
resulta num custo de pessoal total de praticamente 53% da receita líquida.
c) Independemente dos Indicadores de Custo de Pessoal (200 e 201) estarem ou
não dentro dos limites legais, consideramos elevado um gasto de 53% da
Receita Líquida com Pessoal. Devemos lembrar que existem os demais gastos
gerais para fazer a máquina funcionar. A prioridade deveria ser reduzir esta
despesa para que fosse possível bancar os investimentos que a cidade precisa
para melhorar a qualidade de vida e reduzir o endividamento que hoje dificulta
o acesso a crédito.
d) Indicador “Crescimento da dívida: Porcentagem de crescimento da
dívida (Empréstimos de curto e longo prazo)” - Em 2024 foi apresentado
um crescimento da dúvida, passando de -4,91 (2023) para 16,94% o chama
atenção.
e) Indicador “Dívida consolidada líquida/Receita corrente líquida:
Porcentagem da dívida consolidada líquida em relação a
receita corrente líquida” - Apresentou o índice de 34,75% em 2024
considerado satisfatório

8. CONSIDERAÇÕES FINAIS: Nesta 9ª edição do Relatório dos Indicadores de Sustentabilidade de
Florianópolis (RAPI), o panorama geral reflete uma cidade de contrastes, com
avanços notáveis em alguns setores, mas com desafios persistentes em
áreas-chave para a sua sustentabilidade. Embora o relatório aponte melhorias
em certos indicadores, a análise de 2024 revela que as preocupações dos
relatórios anteriores ainda não se traduziram em avanços significativos em
diversos temas.
Uma das maiores contradições se manifesta na Gestão Pública e
Transparência. A cidade se consolida como líder em governo digital, com um
alto percentual de processos concluídos de forma eletrônica e um índice de
transparência em patamares de excelência. No entanto, a transparência ainda
deixa a desejar em aspectos fundamentais. É difícil para a sociedade fiscalizar
os processos licitatórios de obras públicas, pois os portais não disponibilizam os
documentos de forma tempestiva. Essa falha no acompanhamento se reflete na
plataforma "Floripa em Números", que carece de atualizações, com dados
desatualizados em relação aos fornecidos pelas diversas fontes municipais.
No Meio Ambiente, o cenário é misto. O crescimento da malha urbana tem
sido mantido em um ritmo saudável e planejado, mas a cidade continua a
enfrentar problemas estruturais graves. O consumo de água per capita
60
permanece acima das recomendações internacionais, as perdas por água não
contabilizada se mantêm em níveis críticos, e a porcentagem de moradias
afetadas por inundações cresce de forma preocupante. A gestão de resíduos,
por sua vez, mostra uma tendência positiva na compostagem, mas o avanço é
lento em comparação com o alto nível de resíduos destinados a aterros
sanitários e a ausência total de iniciativas para geração de energia a partir de
lixo. A falta de monitoramento em indicadores estratégicos, como o saldo
hídrico e a ocupação em áreas de risco, agrava o quadro. A questão do
saneamento básico continua a ser um dos maiores desafios, com o índice de
cobertura de esgotamento sanitário ainda muito abaixo do necessário. O
sistema de drenagem insuficiente reflete investimentos estruturais que não têm
acompanhado o crescimento da cidade.
Do ponto de vista econômico, a cidade demonstra resiliência. O PIB per capita
a coloca em uma posição de liderança nacional, e a economia se mostra
dinâmica, com forte crescimento em setores-chave como tecnologia e turismo.
O mercado de trabalho mantém uma baixa taxa de desemprego. No entanto, o
crescimento do PIB per capita tem sido volátil nos últimos anos e a qualidade
dos empregos gera preocupação, com a porcentagem de empregos formais em
queda.
Por fim, no aspecto fiscal, o relatório aponta grandes preocupações. Há quase
nenhuma sobra de recursos para investimentos em obras estruturantes, o que
está na origem do crescente endividamento da cidade. O aumento da dívida já
dificulta o acesso a financiamentos para projetos essenciais, especialmente
aqueles ligados à mobilidade. O alto gasto com pessoal, que consome uma fatia
significativa da receita, também representa um desafio para a gestão.
É importante registrar que solicitamos às fontes, a revisão dos indicadores
desde o ano de 2020 para confirmação das informações, eventuais ajustes ou
complementos. Portanto, os indicadores e as semaforizações de 2020 a 2023
registrados nesse relatório, podem ter sofrido alterações em comparação aos
relatórios anteriores.
O Relatório dos Indicadores de Sustentabilidade de Florianópolis (RAPI), em sua
9ª edição, pretende ser um instrumento para avaliar as políticas públicas
urbanas e as diretrizes da AGENDA FLORIPA 2030/40/50.
A análise deste ano reforça a necessidade da cidade resolver suas lacunas de
dados e de traduzir o sucesso em digitalização e economia em uma gestão fiscal
e ambiental mais sólida. O desafio para o futuro é grande, mas as informações
do relatório fornecem o caminho para que Florianópolis se torne uma sociedade
verdadeiramente inclusiva, sustentável e equitativa.
9. AGRADECIMENTOS: Agradecemos ao Prefeito de Florianópolis, Topázio Neto, seus secretários
municipais, gestores e servidores da administração pública, bem como
secretarias estaduais, empresas públicas e autarquias por seus esforços e
contribuições no fornecimento dos dados solicitados.
Fontes diretamente envolvidas no fornecimento dos indicadores as quais
agradecemos:
Acate - Associação Catarinense de Tecnologia
ACM - Associação Catarinense de Medicina
Casan - Companhia Catarinense de Águas e Saneamento
Celesc - Centrais Elétricas de Santa Catarina S.A
Comcap - Companhia Melhoramentos da Capital
Cosip - Contribuição de Serviço de Iluminação Pública
Defesa Civil de Florianópolis
Floram - Fundação Municipal do Meio Ambiente de Florianópolis
Floripa Airport
Ipuf - Instituto de Pesquisa e Planejamento Urbano de Florianópolis
REPLAN - Portal Rede de Planejamento -
https://redeplanejamento.pmf.sc.gov.br/pt-BR/indicadores/lista
SC Gás - Companhia de Gás de Santa Catarina
Secretaria de Estado de Segurança Pública
Secretaria Municipal de Administração
Secretaria Municipal de Assistência Social
Secretaria Municipal de Cultura, Esporte e Lazer
Secretaria Municipal de Educação
Secretaria Municipal de Fazenda
Secretaria Municipal de Infraestrutura e Manutenção da Cidade
Secretaria Municipal de Licitações, Contratos e Parcerias
Secretaria Municipal de Meio Ambiente e Desenvolvimento Sustentável
Secretaria Municipal de Planejamento, Habitação e Desenvolvimento Urbano
Secretaria Municipal de Saúde
Secretaria Municipal de Segurança e Ordem Pública
Secretaria Municipal de Turismo, Desenvolvimento Econômico e Inovação
SHRBS - Sindicato de Hotéis, Restaurantes, Bares e Similares de Florianópolis
Também, agradecemos imensamente ao incansável Grupo de Trabalho do RAPI,
composto por membros da Associação FloripAmanhã, do Grupo Estratégico de
Inteligência da Universidade Federal de Santa Catarina (UFSC) e os membros do
Observatório Social do Brasil – Florianópolis, que atuaram na revisão dos
indicadores, no acompanhamento, na coleta, análise dos dados recebidos, e na
elaboração do presente relatório.
Vamos, juntos, fazer uma cidade mais sustentável! RAPI 2024-2025 RELATÓRIO ANUAL DE PROGRESSO DOS INDICADORES
Grupo de Trabalho de Indicadores
Associação FloripAmanhã
Andrea Pessi M Costa
Ivo Sostizzo
Márcia Regina Teschner
Pedro Carlos Rasia
Salomão Mattos Sobrinho
Observatório Social do Brasil - Florianópolis
João Manuel Dias da Silva
Rafael Novaes
Universidade Federal de Santa Catarina
Clarissa Stefani Teixeira
Hans Michael Van Bellen
É permitida a reprodução parcial ou total deste material desde que citada a
fonte Rede Ver a Cidade Floripa, 2024-2025.
Outubro de 2025
"""

def buscar_contexto_relevante(pergunta, texto_completo, top_n=3):
    """
    Motor de busca leve (RAG). Compara palavras da pergunta com os parágrafos do texto.
    """
    import re
    # Divide o relatório gigante em parágrafos
    paragrafos = [p.strip() for p in texto_completo.split('\n\n') if len(p.strip()) > 50]
    
    # Extrai palavras-chave da pergunta (ignora palavras curtas como 'de', 'o', 'na')
    palavras_pergunta = set(re.findall(r'\b\w{4,}\b', pergunta.lower()))
    
    if not palavras_pergunta:
        return "" # Se não houver palavras-chave, não envia contexto extra
        
    # Pontua cada parágrafo com base na intersecção de palavras
    scores = []
    for p in paragrafos:
        palavras_p = set(re.findall(r'\b\w{4,}\b', p.lower()))
        score = len(palavras_pergunta.intersection(palavras_p))
        scores.append((score, p))
        
    # Ordena os parágrafos pelos que tiveram mais "matches"
    melhores = sorted(scores, key=lambda x: x[0], reverse=True)
    
    # Pega apenas os textos dos top_n parágrafos que tiveram pelo menos 1 match
    trechos_relevantes = [p for score, p in melhores[:top_n] if score > 0]
    
    return "\n...\n".join(trechos_relevantes)

# Função para iniciar a sessão do chat com o contexto do RAPI
def inicializar_chatbot(df_completo):
    if "chat_session" not in st.session_state:
        # 1. Otimização Free Tier: Converter DF para CSV (Usa muito menos tokens que JSON)
        # Selecionamos apenas as colunas essenciais para a IA entender o contexto
        colunas_ia = ['tema', 'indicador', '2023', '2024']
        df_ia = df_completo.copy()
        
        for ano in ['2023', '2024']:
            df_ia[ano] = df_ia['dados_anuais'].apply(lambda x: x.get(ano) if isinstance(x, dict) else "")
            
        csv_contexto = df_ia[colunas_ia].to_csv(index=False, sep=';')
        
        # 2. Configurar as Instruções do Sistema
        instrucoes = f"""Você é o Especialista Analítico do RAPI 2024-2025 de Florianópolis.
REGRAS:
1. Responda às perguntas baseando-se no CSV de indicadores abaixo e no Contexto Adicional que o usuário enviará a cada pergunta.
2. Seja técnico, fiel ao texto e analítico.
3. Se a informação não estiver no CSV nem no contexto fornecido, diga que não possui essa informação.

DADOS DOS INDICADORES (CSV):
{csv_contexto}
"""
        # 3. Inicializar Cliente do novo SDK google-genai
        try:
            # SALVAMOS O CLIENTE NO SESSION_STATE PARA ELE NÃO SER FECHADO
            st.session_state.gemini_client = genai.Client(api_key=st.secrets["GEMINI_API_KEY"])
            
            config = types.GenerateContentConfig(
                system_instruction=instrucoes,
                temperature=0.2, 
            )
            
            # USAMOS O CLIENTE QUE ESTÁ SALVO NA SESSÃO
            st.session_state.chat_session = st.session_state.gemini_client.chats.create(
                model="gemini-2.5-flash-lite", 
                config=config
            )
            st.session_state.chat_history = []
        except Exception as e:
            st.error(f"Erro ao conectar com o Gemini: {e}. Verifique sua chave API.")

# Chama a função passando o seu DataFrame principal
if not df.empty:
    inicializar_chatbot(df)

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

# Ícones em SVG para evitar dependência de CDNs externos que o Streamlit pode bloquear
icon_github = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>'
icon_linkedin = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0077b5"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.238 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>'
icon_instagram = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>'

creditos_html = f"""
    <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 20px; padding: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
        <span style="font-size: 14px; opacity: 0.8;">Desenvolvido por <b>Gustavo Simas</b></span>
        <a href="https://github.com/GSimas" target="_blank" style="text-decoration: none; color: inherit;">{icon_github}</a>
        <a href="https://www.linkedin.com/in/simasgs/" target="_blank" style="text-decoration: none;">{icon_linkedin}</a>
        <a href="https://instagram.com/tudoemsimas" target="_blank" style="text-decoration: none;">{icon_instagram}</a>
    </div>
    """

# Usar st.sidebar.markdown com unsafe_allow_html=True garante que o div seja interpretado corretamente
st.sidebar.markdown(creditos_html, unsafe_allow_html=True)

# ==========================================
# 4. ESTRUTURA DE ABAS PRINCIPAIS
# ==========================================
aba_apresentacao, aba_dash, aba_relatorio, aba_ia = st.tabs([
    "📖 Apresentação", "📊 Dashboard Interativo", "📝 Relatório e Análises", "🤖 Assistente IA"
])

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

# ==========================================
# ABA 4: ASSISTENTE DE INTELIGÊNCIA ARTIFICIAL
# ==========================================
with aba_ia:
    st.markdown("<h2 style='color:#1f77b4;'>🤖 Consultor RAPI com IA Gemini</h2>", unsafe_allow_html=True)
    st.markdown("Pergunte qualquer coisa sobre os dados, cruzamentos de indicadores ou resumos do relatório. (Modelo utilizado Gemini 2.5 Flash Lite, sempre confira as respostas com o relatório, a IA pode prover informações imprecisas)")
    
    if "chat_session" in st.session_state:
        # 1. Exibir o histórico de mensagens na tela
        for msg in st.session_state.chat_history:
            with st.chat_message(msg["role"]):
                st.markdown(msg["content"])
        
        # 2. Capturar entrada do usuário
        prompt = st.chat_input("Ex: Qual o valor do consumo de água em 2024 e o que o relatório recomenda?")
        
        if prompt:
            # Mostra na tela SÓ a pergunta limpa para o usuário
            with st.chat_message("user"):
                st.markdown(prompt)
            st.session_state.chat_history.append({"role": "user", "content": prompt})
            
            # --- (RAG) ---
            # Busca no texto gigante apenas os parágrafos que cruzam com a pergunta
            trecho_encontrado = buscar_contexto_relevante(prompt, TEXTO_RAPI_COMPLETO)
            
            # Monta o "Prompt Enriquecido" que vai escondido para a IA
            if trecho_encontrado:
                prompt_ia = f"Pergunta: {prompt}\n\n[TRECHOS DO RELATÓRIO PARA TE AJUDAR NA RESPOSTA]:\n{trecho_encontrado}"
            else:
                prompt_ia = prompt
            # ----------------------------

            with st.chat_message("assistant"):
                with st.spinner("Analisando os indicadores e textos do RAPI..."):
                    try:
                        # Envia o prompt turbinado para a IA
                        resposta = st.session_state.chat_session.send_message(prompt_ia)
                        st.markdown(resposta.text)
                        
                        # Salva no histórico a resposta
                        st.session_state.chat_history.append({"role": "assistant", "content": resposta.text})
                    except Exception as e:
                        st.error(f"Ops! Tivemos um problema. Detalhe técnico: {e}")
    else:
        st.warning("⚠️ Assistente indisponível. Verifique a configuração da chave API do Google Gemini.")