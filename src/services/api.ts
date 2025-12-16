import { VendasResponse, VendasParams } from '../types/api';

// Remove barra final da URL se existir
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
const API_SECRET_KEY = import.meta.env.VITE_API_SECRET_KEY;

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL não está configurada');
}

if (!API_SECRET_KEY) {
  throw new Error('VITE_API_SECRET_KEY não está configurada');
}

export async function fetchVendas(params?: VendasParams): Promise<VendasResponse> {
  const url = new URL('/vendas-realtime', API_BASE_URL);

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
      'X-Secret-Key': API_SECRET_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar vendas: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
