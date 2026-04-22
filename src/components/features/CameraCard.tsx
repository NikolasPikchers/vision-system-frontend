import { Camera as CameraIcon, ShieldAlert, HardHat } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CameraThumb } from './CameraThumb';
import type { Camera } from '@/types/api';

interface Props {
  camera: Camera;
  onClick?: () => void;
}

export function CameraCard({ camera, onClick }: Props) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer overflow-hidden transition-shadow hover:ring-1 hover:ring-primary/30 hover:shadow-sm"
    >
      <div className="relative aspect-video bg-muted">
        <CameraThumb cameraId={camera.id} className="h-full w-full object-cover" />
        {!camera.enabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white">
            Отключена
          </div>
        )}
      </div>
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CameraIcon size={14} className="text-muted-foreground" />
          {camera.name}
        </div>
        <div className="flex items-center gap-1">
          {camera.zone_check_enabled && (
            <Badge variant="outline" className="gap-1">
              <ShieldAlert size={12} className="text-destructive" />
              Зона
            </Badge>
          )}
          {camera.ppe_check_enabled && (
            <Badge variant="outline" className="gap-1">
              <HardHat size={12} className="text-success" />
              СИЗ
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
