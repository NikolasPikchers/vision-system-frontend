import { apiRequest, apiBlob } from './client';
import type { SaveZoneRequest } from '@/types/api';

export const saveZone = (body: SaveZoneRequest) =>
  apiRequest<{ success: true; message: string; camera_id: number; violation_points: number; ppe_points: number }>(
    '/api/camera/zone/save', { method: 'POST', body }
  );

export const getZoneFrame = (cameraId: number) => apiBlob(`/api/camera/${cameraId}/zone-frame`);
