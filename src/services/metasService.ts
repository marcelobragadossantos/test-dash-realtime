import {
  MetasDistribuidaResponse,
  MetasDistribuidaParams,
  MetasRegionalResponse,
  MetasRegionalParams,
  VendasDiariasResponse,
  VendasDiariasParams
} from '../types/metas';

// Configuração de URL Base
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '');
const API_PROXY_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

/**
 * Helper para extrair o dia (number) de uma string de data "YYYY-MM-DD"
 */
function extrairDiaDeData(dataStr: string): number {
  if (!dataStr) return 0;
  // Espera formato "2026-01-05" -> retorna 5
  const parts = dataStr.split('-');
  return parts.length === 3 ? parseInt(parts[2], 10) : 0;
}

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

  const rawData = await response.json();

  // --- ADAPTER LAYER ---
  // Normaliza os dados da API (snake_case ou nomes diferentes) para a Interface do Frontend
  return {
    // Mantém campos compatíveis
    dias: Array.isArray(rawData.dias) ? rawData.dias.map((d: any) => ({
      // Prioriza 'dia' se existir, senão extrai de 'data'
      dia: d.dia || extrairDiaDeData(d.data),

      meta_valor: Number(d.meta_valor || 0),
      super_meta_valor: Number(d.super_meta_valor || 0),

      // Mapeia 'peso' (API) para 'peso_aplicado' (Front)
      peso_aplicado: Number(d.peso_aplicado || d.peso || 0)
    })) : [],

    // Mapeia 'meta_mes_total' (API) para 'total_meta_mes' (Front)
    total_meta_mes: Number(rawData.total_meta_mes || rawData.meta_mes_total || 0),

    sazonalidade_usada: rawData.sazonalidade_usada || 'PADRAO'
  };
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

/**
 * Busca o histórico de vendas diárias de uma loja (via cache Redis)
 * Endpoint: GET /metas/vendas-diarias?store_codigo=XXX&ano=2026&mes=1
 * Retorna vendas fechadas (dia 1 até ontem)
 */
export async function fetchVendasDiarias(
  params: VendasDiariasParams
): Promise<VendasDiariasResponse> {
  const url = new URL(`${API_PROXY_BASE}/metas/vendas-diarias`, BACKEND_URL || window.location.origin);

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
    throw new Error(`Erro ao buscar vendas diárias: ${response.status} ${response.statusText}`);
  }

  const rawData = await response.json();

  // --- ADAPTER LAYER ---
  // Normaliza os dados garantindo tipos numéricos
  return {
    store_codigo: rawData.store_codigo || params.store_codigo,
    ano: Number(rawData.ano) || params.ano,
    mes: Number(rawData.mes) || params.mes,
    dias: Array.isArray(rawData.dias) ? rawData.dias.map((d: any) => ({
      data: d.data || '',
      dia: Number(d.dia) || 0,
      venda_total: Number(d.venda_total || 0)
    })) : [],
    total_periodo: Number(rawData.total_periodo || 0),
    processado_em: rawData.processado_em || new Date().toISOString()
  };
}
