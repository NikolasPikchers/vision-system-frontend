import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { getLogs } from '@/api/logs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function SystemLog() {
  const [filter, setFilter] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['logs-raw'],
    queryFn: getLogs,
    refetchInterval: 5_000,
  });

  const lines = useMemo(() => {
    const all = data ?? [];
    if (!filter) return all;
    const lower = filter.toLowerCase();
    return all.filter((l) => l.toLowerCase().includes(lower));
  }, [data, filter]);

  async function onCopy() {
    await navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Скопировано в буфер');
  }

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold flex-1">Лог системы</h2>
        <Input
          placeholder="Фильтр по подстроке"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-64"
        />
        <Button variant="outline" size="sm" onClick={onCopy}>
          <Copy size={14} /> Копировать всё
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <pre className="max-h-[60vh] overflow-auto rounded-md border border-border bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
          {lines.length === 0 ? 'Журнал пуст' : lines.join('\n')}
        </pre>
      )}
    </Card>
  );
}
