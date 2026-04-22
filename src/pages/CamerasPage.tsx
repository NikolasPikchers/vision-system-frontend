import { useState } from 'react';
import { useCameras } from '@/hooks/useCameras';
import { CameraCard } from '@/components/features/CameraCard';
import { CameraLiveModal } from '@/components/features/CameraLiveModal';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export function CamerasPage() {
  const { data, isLoading } = useCameras();
  const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const cameras = (data?.cameras ?? [])
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => !onlyActive || c.enabled);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Камеры</h1>
        <div className="ml-auto flex items-center gap-4">
          <Input
            placeholder="Поиск по имени"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <div className="flex items-center gap-2">
            <Switch id="only-active" checked={onlyActive} onCheckedChange={setOnlyActive} />
            <Label htmlFor="only-active">Только активные</Label>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video" />
          ))}
        </div>
      ) : cameras.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Камеры не найдены
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {cameras.map((c) => (
            <CameraCard key={c.id} camera={c} onClick={() => setSelectedId(c.id)} />
          ))}
        </div>
      )}
      {selectedId !== null && (
        <CameraLiveModal cameraId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
