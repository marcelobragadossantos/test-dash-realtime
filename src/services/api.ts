import { VendasResponse, VendasParams, SyncStatusResponse } from '../types/api';

// Se VITE_BACKEND_URL estiver definido, usa ele (para acesso via proxy do portal)
// Caso contrário, usa caminho relativo /api (para acesso direto)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '');
const API_PROXY_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

export async function fetchVendas(params?: VendasParams): Promise<VendasResponse> {
  const url = new URL(`${API_PROXY_BASE}/vendas-realtime`, BACKEND_URL || window.location.origin);

  if (params?.data) {
    url.searchParams.append('data', params.data);
  }

  if (params?.data_inicio) {
    url.searchParams.append('data_inicio', params.data_inicio);
  }

  if (params?.data_fim) {
    url.searchParams.append('data_fim', params.data_fim);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar vendas: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchSyncStatus(): Promise<SyncStatusResponse> {
  const url = new URL(`${API_PROXY_BASE}/sync-status`, BACKEND_URL || window.location.origin);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar status de sincronização: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
