import { VendasResponse, VendasParams, SyncStatusResponse } from '../types/api';

// Usa proxy local - a chave da API fica apenas no servidor
const API_PROXY_BASE = '/api';

export async function fetchVendas(params?: VendasParams): Promise<VendasResponse> {
  const url = new URL(`${API_PROXY_BASE}/vendas-realtime`, window.location.origin);

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
  const url = new URL(`${API_PROXY_BASE}/sync-status`, window.location.origin);

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
