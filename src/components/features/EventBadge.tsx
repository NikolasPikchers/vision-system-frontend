import { Badge } from '@/components/ui/badge';
import type { LogEventType, LogLevel } from '@/types/api';

const typeLabel: Record<LogEventType, string> = {
  zone: 'Нарушение зоны',
  ppe: 'Нарушение СИЗ',
  system: 'Системное',
};

const typeClass: Record<LogEventType, string> = {
  zone: 'bg-destructive/10 text-destructive border-destructive/30',
  ppe: 'bg-warning/10 text-warning border-warning/30',
  system: 'bg-muted text-muted-foreground border-border',
};

export function TypeBadge({ type }: { type: LogEventType }) {
  return <Badge variant="outline" className={typeClass[type]}>{typeLabel[type]}</Badge>;
}

const levelClass: Record<LogLevel, string> = {
  INFO: 'bg-muted text-muted-foreground',
  WARN: 'bg-warning/15 text-warning',
  ERROR: 'bg-destructive/15 text-destructive',
};

export function LevelBadge({ level }: { level: LogLevel }) {
  return <Badge variant="outline" className={levelClass[level]}>{level}</Badge>;
}
