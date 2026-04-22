import { useQuery } from '@tanstack/react-query';
import { getLogs } from '@/api/logs';
import { parseLogs } from '@/lib/log-parser';

export function useLogs() {
  return useQuery({
    queryKey: ['logs'],
    queryFn: async () => parseLogs(await getLogs()),
    refetchInterval: 10_000,
  });
}
