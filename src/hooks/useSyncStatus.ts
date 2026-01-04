import { useQuery } from '@tanstack/react-query';
import { fetchSyncStatus } from '../services/api';

export function useSyncStatus() {
  return useQuery({
    queryKey: ['sync-status'],
    queryFn: fetchSyncStatus,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });
}
