import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { addCamera, saveCamera } from '@/api/cameras';
import type { Camera } from '@/types/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  camera?: Camera;
}

export function CameraFormDialog({ open, onOpenChange, camera }: Props) {
  const qc = useQueryClient();
  const isEdit = Boolean(camera);

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [fps, setFps] = useState(5);
  const [timeout_, setTimeout_] = useState(60);
  const [zone, setZone] = useState(false);
  const [ppe, setPpe] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (open) {
      setName(camera?.name ?? '');
      setUrl(camera?.url ?? '');
      setFps(camera?.fps_limit ?? 5);
      setTimeout_(camera?.timeout_threshold_sec ?? 60);
      setZone(camera?.zone_check_enabled ?? false);
      setPpe(camera?.ppe_check_enabled ?? false);
      setEnabled(camera?.enabled ?? true);
    }
  }, [open, camera]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit && camera) {
        return saveCamera({
          id: camera.id,
          name,
          fps_limit: fps,
          timeout_threshold_sec: timeout_,
          zone_check_enabled: zone,
          ppe_check_enabled: ppe,
          enabled,
        });
      }
      return addCamera({
        name,
        url,
        fps_limit: fps,
        timeout_threshold_sec: timeout_,
        zone_check_enabled: zone,
        ppe_check_enabled: ppe,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cameras'] });
      toast.success(isEdit ? 'Камера сохранена' : 'Камера добавлена');
      onOpenChange(false);
    },
    onError: () => toast.error('Ошибка сохранения'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактирование камеры' : 'Добавление камеры'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="cam-name">Название</Label>
            <Input id="cam-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          {!isEdit && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="cam-url">RTSP URL</Label>
              <Input id="cam-url" value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="rtsp://user:pass@ip:port/stream" />
            </div>
          )}
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <Label htmlFor="cam-fps">FPS</Label>
              <Input id="cam-fps" type="number" min={1} max={60} value={fps} onChange={(e) => setFps(Number(e.target.value))} />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <Label htmlFor="cam-timeout">Таймаут, сек</Label>
              <Input id="cam-timeout" type="number" min={1} value={timeout_} onChange={(e) => setTimeout_(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cam-zone">Контроль зоны</Label>
            <Switch id="cam-zone" checked={zone} onCheckedChange={setZone} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cam-ppe">Контроль спецодежды</Label>
            <Switch id="cam-ppe" checked={ppe} onCheckedChange={setPpe} />
          </div>
          {isEdit && (
            <div className="flex items-center justify-between">
              <Label htmlFor="cam-enabled">Включена</Label>
              <Switch id="cam-enabled" checked={enabled} onCheckedChange={setEnabled} />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
