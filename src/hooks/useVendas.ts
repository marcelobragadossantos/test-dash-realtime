import { useQuery } from '@tanstack/react-query';
import { fetchVendas } from '../services/api';
import { VendasParams } from '../types/api';

export function useVendas(params?: VendasParams) {
  return useQuery({
    queryKey: ['vendas', params],
    queryFn: () => fetchVendas(params),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });
}
