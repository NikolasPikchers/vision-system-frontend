import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CameraThumb } from './CameraThumb';
import { TypeBadge, LevelBadge } from './EventBadge';
import type { LogEvent } from '@/types/api';
import { useCameras } from '@/hooks/useCameras';

interface Props {
  event: LogEvent | null;
  onClose: () => void;
}

export function JournalDetailModal({ event, onClose }: Props) {
  const { data } = useCameras();
  if (!event) return null;
  const camera = event.cameraId !== undefined
    ? data?.cameras.find((c) => c.id === event.cameraId)
    : undefined;
  const cameraLabel = camera?.name ?? (event.cameraId !== undefined ? `Камера ${event.cameraId}` : 'Системное событие');

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle>{cameraLabel}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
          <div className="overflow-hidden rounded-md bg-muted">
            {event.cameraId !== undefined ? (
              <CameraThumb cameraId={event.cameraId} intervalMs={1000} className="w-full" />
            ) : (
              <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
                Нет привязки к камере
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Тип:</span>
              <TypeBadge type={event.type} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Уровень:</span>
              <LevelBadge level={event.level} />
            </div>
            <div>
              <span className="text-muted-foreground">Время: </span>
              {format(event.ts, 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Сообщение:</div>
              <pre className="font-mono text-xs whitespace-pre-wrap rounded-md bg-muted p-2">{event.raw}</pre>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
