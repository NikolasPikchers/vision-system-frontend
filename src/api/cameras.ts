import { apiRequest } from './client';
import type {
  CamerasListResponse, CameraResponse,
  AddCameraRequest, SaveCameraRequest,
} from '@/types/api';

export const listCameras = () => apiRequest<CamerasListResponse>('/api/cameras');
export const getCamera = (id: number) => apiRequest<CameraResponse>(`/api/camera/${id}`);

export const addCamera = (body: AddCameraRequest) =>
  apiRequest<{ success: true; message: string; camera_id: number }>('/api/camera/add', { method: 'POST', body });

export const saveCamera = (body: SaveCameraRequest) =>
  apiRequest<{ success: true; message: string; camera_id: number }>('/api/camera/save', { method: 'POST', body });

export const takeSnapshot = (id: number) =>
  apiRequest<{ success: true; message: string; filename: string; path: string }>(`/api/camera/${id}/snapshot`, { method: 'POST' });
