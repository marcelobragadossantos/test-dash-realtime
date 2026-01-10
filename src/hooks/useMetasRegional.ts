import { useQuery } from '@tanstack/react-query';
import { fetchMetasRegional } from '../services/metasService';
import { MetasRegionalParams } from '../types/metas';

/**
 * Hook para buscar metas regionais/gerais (todas as lojas)
 * @param params - ano, mes
 */
export function useMetasRegional(params: MetasRegionalParams) {
  return useQuery({
    queryKey: ['metas-regional', params],
    queryFn: () => fetchMetasRegional(params),
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    staleTime: 4 * 60 * 1000, // 4 minutos
  });
}
