import {
  MetasDistribuidaResponse,
  MetasDistribuidaParams,
  MetasRegionalResponse,
  MetasRegionalParams
} from '../types/metas';

// Se VITE_BACKEND_URL estiver definido, usa ele (para acesso via proxy do portal)
// Caso contrário, usa caminho relativo /api (para acesso direto)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '');
const API_PROXY_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

/**
 * Busca a meta distribuída (dia a dia) de uma loja específica
 * Endpoint: GET /metas/distribuida?store_codigo=XXX&ano=2026&mes=1
 */
export async function fetchMetasDistribuida(
  params: MetasDistribuidaParams
): Promise<MetasDistribuidaResponse> {
  const url = new URL(`${API_PROXY_BASE}/metas/distribuida`, BACKEND_URL || window.location.origin);

  url.searchParams.append('store_codigo', params.store_codigo);
  url.searchParams.append('ano', params.ano.toString());
  url.searchParams.append('mes', params.mes.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar metas distribuídas: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Busca as metas regionais/gerais (todas as lojas)
 * Endpoint: GET /metas?ano=2026&mes=1
 */
export async function fetchMetasRegional(
  params: MetasRegionalParams
): Promise<MetasRegionalResponse> {
  const url = new URL(`${API_PROXY_BASE}/metas`, BACKEND_URL || window.location.origin);

  url.searchParams.append('ano', params.ano.toString());
  url.searchParams.append('mes', params.mes.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar metas regionais: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
