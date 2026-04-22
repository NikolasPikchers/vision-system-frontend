import { describe, it, expect } from 'vitest';
import { parseLogLine, parseLogs } from './log-parser';

describe('parseLogLine', () => {
  it('parses a zone violation WARN line', () => {
    const e = parseLogLine('[2026-04-21 12:01:00] [WARN] Camera 1: Zone violation detected', 0);
    expect(e).not.toBeNull();
    expect(e!.level).toBe('WARN');
    expect(e!.cameraId).toBe(1);
    expect(e!.type).toBe('zone');
    expect(e!.ts.toISOString()).toBe('2026-04-21T12:01:00.000Z');
  });

  it('parses a PPE violation', () => {
    const e = parseLogLine('[2026-04-21 12:02:00] [WARN] Camera 2: PPE missing — no helmet', 1);
    expect(e).not.toBeNull();
    expect(e!.level).toBe('WARN');
    expect(e!.cameraId).toBe(2);
    expect(e!.type).toBe('ppe');
  });

  it('classifies INFO camera connected as system', () => {
    const e = parseLogLine('[2026-04-21 12:00:00] [INFO] Camera 1 connected', 0);
    expect(e).not.toBeNull();
    expect(e!.level).toBe('INFO');
    expect(e!.cameraId).toBe(1);
    expect(e!.type).toBe('system');
  });

  it('parses ERROR level', () => {
    const e = parseLogLine('[2026-04-21 12:03:00] [ERROR] Camera 3: disconnected', 2);
    expect(e!.level).toBe('ERROR');
    expect(e!.cameraId).toBe(3);
  });

  it('parses system-wide log without camera', () => {
    const e = parseLogLine('[2026-04-21 12:04:00] [INFO] System started', 3);
    expect(e).not.toBeNull();
    expect(e!.cameraId).toBeUndefined();
    expect(e!.type).toBe('system');
  });

  it('returns null for unparseable garbage', () => {
    expect(parseLogLine('not a log line', 0)).toBeNull();
    expect(parseLogLine('', 0)).toBeNull();
  });

  it('assigns a unique id using timestamp and index', () => {
    const a = parseLogLine('[2026-04-21 12:01:00] [WARN] Camera 1: Zone violation detected', 0);
    const b = parseLogLine('[2026-04-21 12:01:00] [WARN] Camera 1: Zone violation detected', 1);
    expect(a!.id).not.toBe(b!.id);
  });
});

describe('parseLogs', () => {
  it('parses an array of lines and sorts by ts descending', () => {
    const lines = [
      '[2026-04-21 12:00:00] [INFO] Camera 1 connected',
      '[2026-04-21 12:01:00] [WARN] Camera 1: Zone violation detected',
      'garbage',
      '[2026-04-21 12:02:00] [ERROR] Camera 1: disconnected',
    ];
    const events = parseLogs(lines);
    expect(events).toHaveLength(3);
    expect(events[0].level).toBe('ERROR');
    expect(events[2].level).toBe('INFO');
  });
});
