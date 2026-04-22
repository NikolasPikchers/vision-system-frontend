import type { Camera, StatusResponse, TrassirChannel } from '@/types/api';

export const mockCameras: Camera[] = [
  {
    id: 1,
    name: 'Цех №1 — главный вход',
    enabled: true,
    url: 'rtsp://demo/stream1',
    fps_limit: 5,
    zone_check_enabled: true,
    ppe_check_enabled: true,
    timeout_threshold_sec: 60,
    zone_polygon: [
      { x: 280, y: 240 },
      { x: 1580, y: 260 },
      { x: 1680, y: 880 },
      { x: 940, y: 960 },
      { x: 240, y: 820 },
    ],
    ppe_zone_polygon: [
      { x: 420, y: 340 },
      { x: 1420, y: 340 },
      { x: 1420, y: 820 },
      { x: 420, y: 820 },
    ],
  },
  {
    id: 2,
    name: 'Цех №2 — склад',
    enabled: true,
    url: 'rtsp://demo/stream2',
    fps_limit: 5,
    zone_check_enabled: true,
    ppe_check_enabled: false,
    timeout_threshold_sec: 60,
    zone_polygon: [
      { x: 320, y: 200 },
      { x: 1600, y: 220 },
      { x: 1580, y: 900 },
      { x: 340, y: 880 },
    ],
    ppe_zone_polygon: [],
  },
  {
    id: 3,
    name: 'Периметр — ворота',
    enabled: false,
    url: 'rtsp://demo/stream3',
    fps_limit: 3,
    zone_check_enabled: false,
    ppe_check_enabled: false,
    timeout_threshold_sec: 120,
    zone_polygon: [],
    ppe_zone_polygon: [],
  },
];

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function fmtTs(d: Date): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function buildLogs(): string[] {
  const lines: string[] = [];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // Anchor timeline at server start ~7 days ago
  const start = new Date(now - 7 * day + 60 * 1000);
  lines.push(`[${fmtTs(start)}] [INFO] VisionSystem server started, version 1.0-mock`);
  lines.push(`[${fmtTs(new Date(start.getTime() + 5 * 1000))}] [INFO] Camera 1 (Цех №1 — главный вход) connected`);
  lines.push(`[${fmtTs(new Date(start.getTime() + 8 * 1000))}] [INFO] Camera 2 (Цех №2 — склад) connected`);
  lines.push(`[${fmtTs(new Date(start.getTime() + 11 * 1000))}] [INFO] Camera 3 (Периметр — ворота) is disabled, skipping`);
  lines.push(`[${fmtTs(new Date(start.getTime() + 15 * 1000))}] [INFO] Zone check loaded for camera 1, polygon points=5`);
  lines.push(`[${fmtTs(new Date(start.getTime() + 17 * 1000))}] [INFO] PPE check loaded for camera 1, polygon points=4`);
  lines.push(`[${fmtTs(new Date(start.getTime() + 19 * 1000))}] [INFO] Zone check loaded for camera 2, polygon points=4`);

  // Zone violations, PPE misses, disconnects spread across 7 days
  const patterns: Array<(ts: Date) => string> = [
    (ts) => `[${fmtTs(ts)}] [WARN] Camera 1: Zone violation detected, person inside restricted area`,
    (ts) => `[${fmtTs(ts)}] [WARN] Camera 1: Zone violation detected, 2 persons inside restricted area`,
    (ts) => `[${fmtTs(ts)}] [WARN] Camera 1: PPE check — helmet missing on detected person`,
    (ts) => `[${fmtTs(ts)}] [WARN] Camera 1: PPE check — vest missing on detected person`,
    (ts) => `[${fmtTs(ts)}] [WARN] Camera 2: Zone violation detected, person inside restricted area`,
    (ts) => `[${fmtTs(ts)}] [WARN] Camera 2: Zone violation cleared after 42s`,
    (ts) => `[${fmtTs(ts)}] [ERROR] Camera 1 stream disconnected, attempting reconnect`,
    (ts) => `[${fmtTs(ts)}] [INFO] Camera 1 stream reconnected`,
    (ts) => `[${fmtTs(ts)}] [ERROR] Camera 2 stream disconnected, timeout exceeded`,
    (ts) => `[${fmtTs(ts)}] [INFO] Camera 2 stream reconnected`,
    (ts) => `[${fmtTs(ts)}] [INFO] Snapshot saved for camera 1`,
    (ts) => `[${fmtTs(ts)}] [INFO] Snapshot saved for camera 2`,
  ];

  // Deterministic pseudo-random so the fixture is stable
  let seed = 1337;
  function rand(): number {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const target = 80;
  for (let i = 0; i < target - lines.length; i++) {
    const offsetMs = Math.floor(rand() * (7 * day - 2 * 60 * 60 * 1000)) + 60 * 60 * 1000;
    const ts = new Date(now - 7 * day + offsetMs);
    const pick = patterns[Math.floor(rand() * patterns.length)];
    lines.push(pick(ts));
  }

  // Recent events in last hour so period=today shows something
  const recentBase = now - 45 * 60 * 1000;
  lines.push(`[${fmtTs(new Date(recentBase))}] [WARN] Camera 1: Zone violation detected, person inside restricted area`);
  lines.push(`[${fmtTs(new Date(recentBase + 3 * 60 * 1000))}] [INFO] Camera 1: Zone clear`);
  lines.push(`[${fmtTs(new Date(recentBase + 12 * 60 * 1000))}] [WARN] Camera 1: PPE check — helmet missing on detected person`);

  // Chronological sort for natural reading
  lines.sort();
  return lines;
}

export const mockLogLines: string[] = buildLogs();

export const mockStatus: StatusResponse = {
  status: 'running',
  version: '1.0-mock',
  uptime_seconds: 3600,
  cameras_connected: true,
};

export const mockTrassirChannels: TrassirChannel[] = [
  {
    id: 1,
    name: 'NVR-CH1 Главный вход',
    enabled: true,
    online: true,
    stream_url_main: 'rtsp://192.168.1.50/channel1/main',
    stream_url_sub: 'rtsp://192.168.1.50/channel1/sub',
    thumbnail_url: 'https://placehold.co/160x90/222/eee?text=NVR+CH1',
  },
  {
    id: 2,
    name: 'NVR-CH2 Склад',
    enabled: true,
    online: true,
    stream_url_main: 'rtsp://192.168.1.50/channel2/main',
    stream_url_sub: 'rtsp://192.168.1.50/channel2/sub',
    thumbnail_url: 'https://placehold.co/160x90/222/eee?text=NVR+CH2',
  },
  {
    id: 3,
    name: 'NVR-CH3 Ворота',
    enabled: true,
    online: false,
    stream_url_main: 'rtsp://192.168.1.50/channel3/main',
    stream_url_sub: 'rtsp://192.168.1.50/channel3/sub',
    thumbnail_url: 'https://placehold.co/160x90/222/eee?text=NVR+CH3',
  },
  {
    id: 4,
    name: 'NVR-CH4 Парковка',
    enabled: false,
    online: false,
    stream_url_main: 'rtsp://192.168.1.50/channel4/main',
    stream_url_sub: 'rtsp://192.168.1.50/channel4/sub',
    thumbnail_url: 'https://placehold.co/160x90/222/eee?text=NVR+CH4',
  },
];
