import json
import os

# Lista principal que vai armazenar todos os indicadores
dados_completos = []

print("Iniciando a união dos arquivos JSON...\n")

# Loop para ler de aba1.json até aba13.json
for i in range(1, 14):
    nome_arquivo = f'aba{i}.json'
    
    # Verifica se o arquivo existe na pasta
    if os.path.exists(nome_arquivo):
        try:
            with open(nome_arquivo, 'r', encoding='utf-8') as f:
                dados_aba = json.load(f)
                # O método extend adiciona os elementos da lista ao invés de colocar uma lista dentro da outra
                dados_completos.extend(dados_aba)
            print(f"✔️ {nome_arquivo} processado com sucesso ({len(dados_aba)} indicadores adicionados).")
        except json.JSONDecodeError:
            print(f"❌ Erro: O arquivo {nome_arquivo} não possui um formato JSON válido.")
        except Exception as e:
            print(f"❌ Erro inesperado ao ler {nome_arquivo}: {e}")
    else:
        print(f"⚠️ Atenção: O arquivo {nome_arquivo} não foi encontrado na pasta.")

# Salva a lista mestre em um novo arquivo JSON consolidado
arquivo_saida = 'dados_rapi_completo.json'

with open(arquivo_saida, 'w', encoding='utf-8') as f:
    # ensure_ascii=False garante que os acentos fiquem corretos e indent=4 deixa o arquivo formatado/legível
    json.dump(dados_completos, f, ensure_ascii=False, indent=4)

print(f"\n🎉 Processo concluído! O arquivo final '{arquivo_saida}' foi gerado com um total de {len(dados_completos)} indicadores.")