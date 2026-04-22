import { useState } from 'react';
import { toast } from 'sonner';
import { exportEvents } from '@/api/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export function ExportPage() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function onExport() {
    if (!start || !end) {
      toast.error('Укажите даты');
      return;
    }
    setLoading(true);
    try {
      const res = await exportEvents({ start_date: start, end_date: end, type: 'events' });
      setResult(res.file);
      toast.success('Экспорт готов');
    } catch {
      toast.error('Ошибка экспорта');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Экспорт событий</h1>
      <Card className="max-w-xl p-6 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <Label htmlFor="start">От</Label>
            <Input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <Label htmlFor="end">До</Label>
            <Input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <Button onClick={onExport} disabled={loading}>
          {loading ? 'Выгрузка…' : 'Выгрузить'}
        </Button>
        {result && (
          <div className="rounded-md border border-border bg-muted p-3 text-sm">
            <div className="mb-1 font-medium">Файл создан на сервере:</div>
            <code className="font-mono text-xs">{result}</code>
            <div className="mt-2 text-xs text-muted-foreground">
              Текущее API кладёт файл на диск сервера и не отдаёт его напрямую. Попросите администратора забрать файл с машины CV-сервиса.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
