import { useQuery } from '@tanstack/react-query';
import { fetchMetasDistribuida } from '../services/metasService';
import { MetasDistribuidaParams } from '../types/metas';

/**
 * Hook para buscar metas distribuídas (dia a dia) de uma loja específica
 * @param params - store_codigo, ano, mes
 * @param enabled - se false, a query não é executada (útil para drill-down)
 */
export function useMetasDistribuida(
  params: MetasDistribuidaParams | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['metas-distribuida', params],
    queryFn: () => fetchMetasDistribuida(params!),
    enabled: enabled && params !== null,
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    staleTime: 4 * 60 * 1000, // 4 minutos
  });
}
