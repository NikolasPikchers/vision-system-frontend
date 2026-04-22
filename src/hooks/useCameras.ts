import { useQuery } from '@tanstack/react-query';
import { listCameras } from '@/api/cameras';

export function useCameras() {
  return useQuery({
    queryKey: ['cameras'],
    queryFn: listCameras,
    staleTime: 30_000,
  });
}
