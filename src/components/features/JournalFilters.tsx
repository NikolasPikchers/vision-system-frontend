import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TypeFilter = 'all' | 'zone' | 'ppe' | 'system';
type LevelFilter = 'all' | 'INFO' | 'WARN' | 'ERROR';
type PeriodFilter = 'all' | 'today' | '24h' | '7d';

interface JournalFiltersProps {
  cameras: Array<{ id: number; name: string }>;
  cameraId: number | 'all';
  onCameraIdChange: (id: number | 'all') => void;
  type: TypeFilter;
  onTypeChange: (t: TypeFilter) => void;
  level: LevelFilter;
  onLevelChange: (l: LevelFilter) => void;
  period: PeriodFilter;
  onPeriodChange: (p: PeriodFilter) => void;
}

export function JournalFilters({
  cameras,
  cameraId,
  onCameraIdChange,
  type,
  onTypeChange,
  level,
  onLevelChange,
  period,
  onPeriodChange,
}: JournalFiltersProps) {
  function reset() {
    onCameraIdChange('all');
    onTypeChange('all');
    onLevelChange('all');
    onPeriodChange('all');
  }

  return (
    <Card className="w-64 p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Камера</Label>
        <Select
          value={String(cameraId)}
          onValueChange={(v) => onCameraIdChange(v === 'all' ? 'all' : Number(v))}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Любая камера</SelectItem>
            {cameras.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Тип события</Label>
        <Select value={type} onValueChange={(v) => onTypeChange(v as TypeFilter)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            <SelectItem value="zone">Нарушение зоны</SelectItem>
            <SelectItem value="ppe">Нарушение СИЗ</SelectItem>
            <SelectItem value="system">Системное</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Уровень</Label>
        <Select value={level} onValueChange={(v) => onLevelChange(v as LevelFilter)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Любой уровень</SelectItem>
            <SelectItem value="INFO">INFO</SelectItem>
            <SelectItem value="WARN">WARN</SelectItem>
            <SelectItem value="ERROR">ERROR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Период детекции</Label>
        <Select value={period} onValueChange={(v) => onPeriodChange(v as PeriodFilter)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всё время</SelectItem>
            <SelectItem value="today">Сегодня</SelectItem>
            <SelectItem value="24h">Последние 24 часа</SelectItem>
            <SelectItem value="7d">Последние 7 дней</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={reset}>Сбросить фильтры</Button>
    </Card>
  );
}
