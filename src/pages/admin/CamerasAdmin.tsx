import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { useCameras } from '@/hooks/useCameras';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CameraFormDialog } from '@/components/features/CameraFormDialog';
import type { Camera } from '@/types/api';

export function CamerasAdmin() {
  const { data, isLoading } = useCameras();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Camera | undefined>();

  function onAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }
  function onEdit(c: Camera) {
    setEditing(c);
    setDialogOpen(true);
  }

  return (
    <Card className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Список камер</h2>
        <Button onClick={onAdd} size="sm">
          <Plus size={16} /> Добавить камеру
        </Button>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>FPS</TableHead>
              <TableHead>Проверки</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.cameras ?? []).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{c.url}</TableCell>
                <TableCell>{c.fps_limit}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {c.zone_check_enabled && <Badge variant="outline">Зона</Badge>}
                    {c.ppe_check_enabled && <Badge variant="outline">СИЗ</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={c.enabled ? 'default' : 'secondary'}>
                    {c.enabled ? 'Включена' : 'Отключена'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(c)}>
                    <Pencil size={14} /> Изменить
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <CameraFormDialog open={dialogOpen} onOpenChange={setDialogOpen} camera={editing} />
    </Card>
  );
}
