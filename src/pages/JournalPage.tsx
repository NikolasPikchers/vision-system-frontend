import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useCameras } from '@/hooks/useCameras';
import { useLogs } from '@/hooks/useLogs';
import { JournalFilters } from '@/components/features/JournalFilters';
import { TypeBadge, LevelBadge } from '@/components/features/EventBadge';
import { JournalDetailModal } from '@/components/features/JournalDetailModal';
import { CameraThumb } from '@/components/features/CameraThumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { LogEvent } from '@/types/api';

type TypeFilter = 'all' | 'zone' | 'ppe' | 'system';
type LevelFilter = 'all' | 'INFO' | 'WARN' | 'ERROR';
type PeriodFilter = 'all' | 'today' | '24h' | '7d';

function periodStart(period: PeriodFilter): number | null {
  const now = Date.now();
  if (period === 'today') {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (period === '24h') return now - 24 * 60 * 60 * 1000;
  if (period === '7d') return now - 7 * 24 * 60 * 60 * 1000;
  return null;
}

export function JournalPage() {
  const { data: camsData } = useCameras();
  const { data: events, isLoading } = useLogs();
  const [cameraId, setCameraId] = useState<number | 'all'>('all');
  const [type, setType] = useState<TypeFilter>('all');
  const [level, setLevel] = useState<LevelFilter>('all');
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [selected, setSelected] = useState<LogEvent | null>(null);

  const cameraNameById = useMemo(() => {
    const m = new Map<number, string>();
    (camsData?.cameras ?? []).forEach((c) => m.set(c.id, c.name));
    return m;
  }, [camsData]);

  const filtered = useMemo(() => {
    const start = periodStart(period);
    return (events ?? []).filter((e) => {
      if (cameraId !== 'all' && e.cameraId !== cameraId) return false;
      if (type !== 'all' && e.type !== type) return false;
      if (level !== 'all' && e.level !== level) return false;
      if (start !== null && e.ts.getTime() < start) return false;
      return true;
    });
  }, [events, cameraId, type, level, period]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Журнал событий</h1>
      <div className="flex gap-4">
        <JournalFilters
          cameras={(camsData?.cameras ?? []).map((c) => ({ id: c.id, name: c.name }))}
          cameraId={cameraId} onCameraIdChange={setCameraId}
          type={type} onTypeChange={setType}
          level={level} onLevelChange={setLevel}
          period={period} onPeriodChange={setPeriod}
        />
        <Card className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              События не найдены
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Камера</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Уровень</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {e.cameraId !== undefined && (
                        <div className="h-10 w-20 overflow-hidden rounded bg-muted">
                          <CameraThumb cameraId={e.cameraId} className="h-full w-full object-cover" intervalMs={10_000} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {e.cameraId !== undefined ? (cameraNameById.get(e.cameraId) ?? `Камера ${e.cameraId}`) : '—'}
                    </TableCell>
                    <TableCell><TypeBadge type={e.type} /></TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(e.ts, 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                    </TableCell>
                    <TableCell><LevelBadge level={e.level} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(e)}>
                        Подробнее
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
      <JournalDetailModal event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
