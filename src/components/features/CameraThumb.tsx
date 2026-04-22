import { useEffect, useState } from 'react';
import { apiBlob } from '@/api/client';
import { cn } from '@/lib/utils';

interface Props {
  cameraId: number;
  intervalMs?: number;
  className?: string;
}

export function CameraThumb({ cameraId, intervalMs = 2000, className }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let prev: string | null = null;

    async function load() {
      try {
        const { blob } = await apiBlob(`/api/camera/${cameraId}/thumbnail?t=${Date.now()}`);
        if (disposed) return;
        const next = URL.createObjectURL(blob);
        setUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return next;
        });
        prev = next;
        setFailed(false);
      } catch {
        setFailed(true);
      }
    }

    load();
    const id = setInterval(load, intervalMs);
    return () => {
      disposed = true;
      clearInterval(id);
      if (prev) URL.revokeObjectURL(prev);
    };
  }, [cameraId, intervalMs]);

  if (failed && !url) {
    return (
      <div className={cn('flex items-center justify-center bg-muted text-xs text-muted-foreground', className)}>
        Нет сигнала
      </div>
    );
  }
  if (!url) return <div className={cn('bg-muted', className)} />;
  return <img src={url} alt={`Камера ${cameraId}`} className={className} />;
}
