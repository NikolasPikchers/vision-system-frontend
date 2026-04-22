import { http, HttpResponse, delay } from 'msw';
import {
  mockCameras,
  mockLogLines,
  mockStatus,
  mockTrassirChannels,
} from './fixtures';
import { placeholderFrame, placeholderZoneFrame } from './assets/placeholder-frame';
import type { Camera, Point } from '@/types/api';

interface AddCameraBody {
  name: string;
  url: string;
  fps_limit?: number;
  zone_check_enabled?: boolean;
  ppe_check_enabled?: boolean;
  timeout_threshold_sec?: number;
}

interface SaveCameraBody extends Partial<Camera> {
  id: number;
}

interface SaveZoneBody {
  camera_id: number;
  zone_polygon: Point[];
  ppe_zone_polygon: Point[];
  zone_check_enabled: boolean;
  ppe_check_enabled: boolean;
  timeout_threshold_sec: number;
}

interface LoginBody {
  username: string;
  password: string;
}

interface TrassirChannelsBody {
  ip: string;
}

interface TrassirAddBody {
  selected_channels: unknown[];
}

interface ExportBody {
  start_date: string;
  end_date: string;
}

const cameras: Camera[] = structuredClone(mockCameras);
let nextCameraId = 100;

export const handlers = [
  // Auth
  http.post('/api/login', async ({ request }) => {
    const body = (await request.json()) as LoginBody;
    if (body.username === 'admin' && body.password === 'admin') {
      return HttpResponse.json({
        success: true,
        session_id: `session_mock_${Date.now()}`,
        username: 'admin',
        expires_in: 1800,
        token_type: 'Bearer',
      });
    }
    return HttpResponse.json(
      { success: false, error: 'Invalid credentials', message: 'Неверные учётные данные' },
      { status: 401 },
    );
  }),
  http.post('/api/logout', () => HttpResponse.json({ success: true, message: 'Logged out' })),

  // Status
  http.get('/api/status', () => HttpResponse.json(mockStatus)),

  // Cameras
  http.get('/api/cameras', () =>
    HttpResponse.json({ success: true, count: cameras.length, cameras }),
  ),
  http.get('/api/camera/:id', ({ params }) => {
    const id = Number(params.id);
    const cam = cameras.find((c) => c.id === id);
    if (!cam) return HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return HttpResponse.json({ success: true, ...cam });
  }),
  http.post('/api/camera/add', async ({ request }) => {
    const body = (await request.json()) as AddCameraBody;
    const id = nextCameraId++;
    cameras.push({
      id,
      name: body.name,
      url: body.url,
      enabled: true,
      fps_limit: body.fps_limit ?? 5,
      zone_check_enabled: body.zone_check_enabled ?? false,
      ppe_check_enabled: body.ppe_check_enabled ?? false,
      timeout_threshold_sec: body.timeout_threshold_sec ?? 60,
    });
    return HttpResponse.json({ success: true, message: 'Camera added successfully', camera_id: id });
  }),
  http.post('/api/camera/save', async ({ request }) => {
    const body = (await request.json()) as SaveCameraBody;
    const idx = cameras.findIndex((c) => c.id === body.id);
    if (idx === -1)
      return HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    cameras[idx] = { ...cameras[idx], ...body };
    return HttpResponse.json({ success: true, message: 'Configuration saved', camera_id: body.id });
  }),
  http.post('/api/camera/:id/snapshot', ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: 'Snapshot saved successfully',
      filename: `snapshot_cam${params.id}_${Date.now()}.jpg`,
      path: `/mock/media/snapshot_cam${params.id}_${Date.now()}.jpg`,
    });
  }),

  // Frames
  http.get('/api/camera/:id/frame', async () => {
    await delay(30);
    const blob = await placeholderFrame();
    return new HttpResponse(blob, {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store, no-cache' },
    });
  }),
  http.get('/api/camera/:id/thumbnail', async () => {
    await delay(30);
    const blob = await placeholderFrame();
    return new HttpResponse(blob, {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store, no-cache' },
    });
  }),
  http.get('/api/camera/:id/stream', async () => {
    await delay(30);
    const blob = await placeholderFrame();
    return new HttpResponse(blob, { headers: { 'Content-Type': 'image/jpeg' } });
  }),
  http.get('/api/camera/:id/zone-frame', async () => {
    const blob = await placeholderZoneFrame();
    return new HttpResponse(blob, {
      headers: {
        'Content-Type': 'image/jpeg',
        'X-Frame-Width': '1920',
        'X-Frame-Height': '1080',
      },
    });
  }),

  // Zones
  http.post('/api/camera/zone/save', async ({ request }) => {
    const body = (await request.json()) as SaveZoneBody;
    const idx = cameras.findIndex((c) => c.id === body.camera_id);
    if (idx !== -1) {
      cameras[idx] = {
        ...cameras[idx],
        zone_polygon: body.zone_polygon,
        ppe_zone_polygon: body.ppe_zone_polygon,
        zone_check_enabled: body.zone_check_enabled,
        ppe_check_enabled: body.ppe_check_enabled,
        timeout_threshold_sec: body.timeout_threshold_sec,
      };
    }
    return HttpResponse.json({
      success: true,
      message: 'Zone configuration saved',
      camera_id: body.camera_id,
      violation_points: body.zone_polygon.length,
      ppe_points: body.ppe_zone_polygon.length,
    });
  }),

  // Trassir
  http.post('/api/trassir/channels', async ({ request }) => {
    const body = (await request.json()) as TrassirChannelsBody;
    return HttpResponse.json({ success: true, nvr_ip: body.ip, channels: mockTrassirChannels });
  }),
  http.post('/api/trassir/add', async ({ request }) => {
    const body = (await request.json()) as TrassirAddBody;
    return HttpResponse.json({
      success: true,
      added_count: body.selected_channels.length,
      message: `Successfully added ${body.selected_channels.length} cameras`,
    });
  }),

  // Logs
  http.get('/api/logs', () =>
    HttpResponse.json({
      success: true,
      logs: mockLogLines.map((message) => ({ message })),
    }),
  ),

  // Export
  http.post('/api/export', async ({ request }) => {
    const body = (await request.json()) as ExportBody;
    return HttpResponse.json({
      success: true,
      message: 'Export completed',
      file: `export_${body.start_date}_to_${body.end_date}.xlsx`,
      start_date: body.start_date,
      end_date: body.end_date,
    });
  }),
];
