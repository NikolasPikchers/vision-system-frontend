import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCameras } from '@/hooks/useCameras';
import { getZoneFrame, saveZone } from '@/api/zones';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PolygonCanvas } from '@/components/features/PolygonCanvas';
import type { Point } from '@/types/api';
import { cn } from '@/lib/utils';

const MAX_DISPLAY_WIDTH = 1000;

export function ZonesAdmin() {
  const qc = useQueryClient();
  const { data: camsData } = useCameras();
  const cameras = camsData?.cameras ?? [];

  const [cameraId, setCameraId] = useState<number | null>(null);
  const [redPolygon, setRedPolygon] = useState<Point[]>([]);
  const [greenPolygon, setGreenPolygon] = useState<Point[]>([]);
  const [active, setActive] = useState<'red' | 'green'>('red');
  const [zoneEnabled, setZoneEnabled] = useState(false);
  const [ppeEnabled, setPpeEnabled] = useState(false);
  const [timeout_, setTimeout_] = useState(60);

  useEffect(() => {
    if (cameraId === null && cameras.length > 0) setCameraId(cameras[0].id);
  }, [cameraId, cameras]);

  const selectedCamera = useMemo(() => cameras.find((c) => c.id === cameraId), [cameras, cameraId]);

  useEffect(() => {
    setRedPolygon(selectedCamera?.zone_polygon ?? []);
    setGreenPolygon(selectedCamera?.ppe_zone_polygon ?? []);
    setZoneEnabled(selectedCamera?.zone_check_enabled ?? false);
    setPpeEnabled(selectedCamera?.ppe_check_enabled ?? false);
    setTimeout_(selectedCamera?.timeout_threshold_sec ?? 60);
  }, [selectedCamera]);

  const frameQuery = useQuery({
    queryKey: ['zone-frame', cameraId],
    queryFn: async () => {
      if (cameraId === null) throw new Error('no camera');
      const { blob, headers } = await getZoneFrame(cameraId);
      const width = Number(headers.get('X-Frame-Width') ?? 1920);
      const height = Number(headers.get('X-Frame-Height') ?? 1080);
      const url = URL.createObjectURL(blob);
      return { url, natural: { w: width, h: height } };
    },
    enabled: cameraId !== null,
    staleTime: 60_000,
    gcTime: 60_000,
  });

  useEffect(() => () => {
    if (frameQuery.data?.url) URL.revokeObjectURL(frameQuery.data.url);
  }, [frameQuery.data?.url]);

  const display = useMemo(() => {
    const n = frameQuery.data?.natural;
    if (!n) return { w: MAX_DISPLAY_WIDTH, h: Math.round((MAX_DISPLAY_WIDTH * 9) / 16) };
    if (n.w <= MAX_DISPLAY_WIDTH) return n;
    const w = MAX_DISPLAY_WIDTH;
    const h = Math.round((n.h * w) / n.w);
    return { w, h };
  }, [frameQuery.data?.natural]);

  const save = useMutation({
    mutationFn: async () => {
      if (cameraId === null) throw new Error('no camera');
      return saveZone({
        camera_id: cameraId,
        zone_polygon: redPolygon,
        ppe_zone_polygon: greenPolygon,
        zone_check_enabled: zoneEnabled,
        ppe_check_enabled: ppeEnabled,
        timeout_threshold_sec: timeout_,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cameras'] });
      toast.success('Сохранено');
    },
    onError: () => toast.error('Ошибка сохранения'),
  });

  function clearActive() {
    if (active === 'red') setRedPolygon([]);
    else setGreenPolygon([]);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Label htmlFor="zone-cam" className="whitespace-nowrap">Камера:</Label>
          <Select
            value={cameraId === null ? '' : String(cameraId)}
            onValueChange={(v) => setCameraId(Number(v))}
          >
            <SelectTrigger id="zone-cam" className="w-72">
              <SelectValue placeholder="Выберите камеру" />
            </SelectTrigger>
            <SelectContent>
              {cameras.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-2">
            <Button
              variant={active === 'red' ? 'default' : 'outline'}
              onClick={() => setActive('red')}
            >
              Зона нарушения
            </Button>
            <Button
              variant={active === 'green' ? 'default' : 'outline'}
              onClick={() => setActive('green')}
            >
              Зона спецодежды
            </Button>
            <Button variant="outline" onClick={clearActive}>Очистить активную</Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Клик по кадру — добавить точку. Перетащить точку — переместить. Правый клик по точке — удалить.
        </div>

        {frameQuery.isLoading ? (
          <Skeleton className="aspect-video w-full max-w-[1000px]" />
        ) : frameQuery.isError ? (
          <div className="text-sm text-destructive">Не удалось загрузить кадр камеры</div>
        ) : frameQuery.data ? (
          <PolygonCanvas
            naturalSize={frameQuery.data.natural}
            displaySize={display}
            redPolygon={redPolygon}
            greenPolygon={greenPolygon}
            activePolygon={active}
            onChange={(poly, pts) => (poly === 'red' ? setRedPolygon(pts) : setGreenPolygon(pts))}
            imageSrc={frameQuery.data.url}
          />
        ) : null}
      </Card>

      <Card className={cn('p-4 flex flex-col gap-4', cameraId === null && 'opacity-50 pointer-events-none')}>
        <div className="flex items-center justify-between">
          <Label htmlFor="zone-enabled">Контроль зоны нарушения</Label>
          <Switch id="zone-enabled" checked={zoneEnabled} onCheckedChange={setZoneEnabled} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="ppe-enabled">Контроль спецодежды</Label>
          <Switch id="ppe-enabled" checked={ppeEnabled} onCheckedChange={setPpeEnabled} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="timeout">Таймаут, сек</Label>
          <Input id="timeout" type="number" value={timeout_} min={1} className="w-32" onChange={(e) => setTimeout_(Number(e.target.value))} />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending || cameraId === null}>
            {save.isPending ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
