import { useQuery } from '@tanstack/react-query';
import { fetchVendasDiarias } from '../services/metasService';
import { VendasDiariasParams } from '../types/metas';

/**
 * Hook para buscar histórico de vendas diárias de uma loja (via cache Redis)
 * Retorna vendas fechadas (dia 1 até ontem)
 *
 * @param params - store_codigo, ano, mes
 * @param enabled - se false, a query não é executada (útil para drill-down)
 */
export function useVendasDiarias(
  params: VendasDiariasParams | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['vendas-diarias', params?.store_codigo, params?.ano, params?.mes],
    queryFn: () => fetchVendasDiarias(params!),
    enabled: enabled && params !== null,
    // Cache de 1 hora - dados históricos não mudam frequentemente
    staleTime: 60 * 60 * 1000, // 1 hora
    refetchInterval: 60 * 60 * 1000, // 1 hora
  });
}
