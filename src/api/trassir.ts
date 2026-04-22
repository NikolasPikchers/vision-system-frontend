import { apiRequest } from './client';
import type { TrassirChannelsResponse } from '@/types/api';

export interface TrassirConnectRequest {
  ip: string; port: number; username: string; password: string;
}

export const getChannels = (body: TrassirConnectRequest) =>
  apiRequest<TrassirChannelsResponse>('/api/trassir/channels', { method: 'POST', body });

export interface TrassirAddChannel {
  id: number; name: string; stream_url_sub: string;
  fps_limit: number; zone_check: boolean; ppe_check: boolean; timeout: number;
}

export const addChannels = (selected: TrassirAddChannel[]) =>
  apiRequest<{ success: true; added_count: number; message: string }>(
    '/api/trassir/add', { method: 'POST', body: { selected_channels: selected } }
  );
