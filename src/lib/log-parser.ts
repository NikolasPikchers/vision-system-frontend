import type { LogEvent, LogLevel, LogEventType } from '@/types/api';

const LINE_RE = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \[(INFO|WARN|ERROR)\] (?:Camera (\d+)[:]?\s*)?(.*)$/;

function classify(message: string): LogEventType {
  const m = message.toLowerCase();
  if (m.includes('zone violation') || m.includes(' zone ') || m.endsWith(' zone')) return 'zone';
  if (m.includes('ppe') || m.includes('helmet') || m.includes('without')) return 'ppe';
  return 'system';
}

export function parseLogLine(raw: string, idx: number): LogEvent | null {
  if (!raw) return null;
  const match = LINE_RE.exec(raw.trim());
  if (!match) return null;
  const [, tsStr, levelStr, camStr, message] = match;
  const ts = new Date(tsStr.replace(' ', 'T') + 'Z');
  if (Number.isNaN(ts.getTime())) return null;
  return {
    id: `${ts.toISOString()}-${idx}`,
    ts,
    level: levelStr as LogLevel,
    cameraId: camStr ? Number(camStr) : undefined,
    type: classify(message),
    message,
    raw,
  };
}

export function parseLogs(lines: string[]): LogEvent[] {
  const out: LogEvent[] = [];
  lines.forEach((ln, i) => {
    const ev = parseLogLine(ln, i);
    if (ev) out.push(ev);
  });
  return out.sort((a, b) => b.ts.getTime() - a.ts.getTime());
}
