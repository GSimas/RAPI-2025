/**
 * ==========================================================
 * Sessão do assistente: a credencial do usuário
 * ==========================================================
 *
 * A credencial (chave da OpenRouter obtida via PKCE ou chave BYOK) fica
 * apenas no navegador:
 *
 * - por padrão em `sessionStorage` — some ao fechar a aba;
 * - em `localStorage` só se o usuário marcar "Lembrar neste navegador".
 *
 * Ela nunca entra em URLs e só é enviada, no cabeçalho `Authorization`,
 * à função `/api/*` deste próprio site, que a repassa ao provedor.
 */

import { ehProvedor, type IdProvedor } from './provedores';

/** Como a conexão foi estabelecida. */
export type OrigemConexao = 'pkce' | 'byok';

export interface Conexao {
  readonly provedor: IdProvedor;
  readonly chave: string;
  readonly modelo: string;
  readonly origem: OrigemConexao;
  readonly lembrar: boolean;
}

const CHAVE_STORAGE = 'rapi-ia-conexao';

/** Acesso tolerante a falhas (modo privado, storage bloqueado). */
function armazenamento(tipo: 'session' | 'local'): Storage | null {
  try {
    return tipo === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

/** Valida o formato de uma conexão lida do storage. */
function validar(bruto: unknown): Conexao | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const c = bruto as Record<string, unknown>;
  if (!ehProvedor(c['provedor'])) return null;
  if (typeof c['chave'] !== 'string' || c['chave'].length < 16) return null;
  if (typeof c['modelo'] !== 'string' || c['modelo'] === '') return null;
  if (c['origem'] !== 'pkce' && c['origem'] !== 'byok') return null;
  return {
    provedor: c['provedor'],
    chave: c['chave'],
    modelo: c['modelo'],
    origem: c['origem'],
    lembrar: c['lembrar'] === true,
  };
}

/** Lê a conexão salva, se houver. */
export function lerConexao(): Conexao | null {
  for (const tipo of ['session', 'local'] as const) {
    try {
      const texto = armazenamento(tipo)?.getItem(CHAVE_STORAGE);
      if (texto) {
        const conexao = validar(JSON.parse(texto));
        if (conexao) return conexao;
      }
    } catch {
      // Conteúdo corrompido: ignora.
    }
  }
  return null;
}

/** Salva a conexão no storage adequado à escolha "lembrar". */
export function salvarConexao(conexao: Conexao): void {
  const destino = armazenamento(conexao.lembrar ? 'local' : 'session');
  const outro = armazenamento(conexao.lembrar ? 'session' : 'local');
  try {
    outro?.removeItem(CHAVE_STORAGE);
    destino?.setItem(CHAVE_STORAGE, JSON.stringify(conexao));
  } catch {
    // Sem storage: a conexão vale só enquanto a página estiver aberta.
  }
}

/** Remove a credencial de todos os storages. */
export function encerrarConexao(): void {
  for (const tipo of ['session', 'local'] as const) {
    try {
      armazenamento(tipo)?.removeItem(CHAVE_STORAGE);
    } catch {
      // nada a fazer
    }
  }
}
