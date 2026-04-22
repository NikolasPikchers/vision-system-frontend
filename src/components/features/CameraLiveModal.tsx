import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CameraThumb } from './CameraThumb';
import { toast } from 'sonner';
import { takeSnapshot } from '@/api/cameras';
import { useCameras } from '@/hooks/useCameras';

interface Props {
  cameraId: number;
  onClose: () => void;
}

export function CameraLiveModal({ cameraId, onClose }: Props) {
  const { data } = useCameras();
  const camera = data?.cameras.find((c) => c.id === cameraId);

  async function onSnapshot() {
    try {
      const res = await takeSnapshot(cameraId);
      toast.success(`Снимок сохранён: ${res.filename}`);
    } catch {
      toast.error('Не удалось сделать снимок');
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{camera?.name ?? `Камера ${cameraId}`}</DialogTitle>
        </DialogHeader>
        <div className="overflow-hidden rounded-md bg-muted">
          <CameraThumb cameraId={cameraId} intervalMs={1000} className="w-full" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
          <Button onClick={onSnapshot}>Сделать снимок</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
