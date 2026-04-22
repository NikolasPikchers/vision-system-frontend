import { useQuery } from '@tanstack/react-query';
import { getStatus } from '@/api/status';
import { cn } from '@/lib/utils';

export function StatusIndicator() {
  const { data, isError } = useQuery({
    queryKey: ['status'],
    queryFn: getStatus,
    refetchInterval: 30_000,
    retry: 0,
  });
  const online = !isError && data?.status === 'running';
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={cn('inline-block h-2 w-2 rounded-full', online ? 'bg-success' : 'bg-destructive')}
        aria-label={online ? 'Сервер онлайн' : 'Нет связи'}
      />
      {online ? 'Сервер онлайн' : 'Нет связи'}
    </div>
  );
}
