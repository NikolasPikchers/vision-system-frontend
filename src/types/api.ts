export interface LoginResponse {
  success: true;
  session_id: string;
  username: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface Point { x: number; y: number }

export interface Camera {
  id: number;
  name: string;
  enabled: boolean;
  url: string;
  fps_limit: number;
  zone_check_enabled: boolean;
  ppe_check_enabled: boolean;
  timeout_threshold_sec: number;
  zone_polygon?: Point[];
  ppe_zone_polygon?: Point[];
}

export interface CamerasListResponse { success: true; count: number; cameras: Camera[] }
export interface CameraResponse extends Camera { success: true }

export interface AddCameraRequest {
  name: string; url: string; username?: string; password?: string;
  fps_limit: number; zone_check_enabled: boolean; ppe_check_enabled: boolean; timeout_threshold_sec: number;
}

export interface SaveCameraRequest {
  id: number; name?: string; fps_limit?: number;
  zone_check_enabled?: boolean; ppe_check_enabled?: boolean; timeout_threshold_sec?: number; enabled?: boolean;
}

export interface SaveZoneRequest {
  camera_id: number;
  zone_polygon: Point[];
  ppe_zone_polygon: Point[];
  zone_check_enabled: boolean;
  ppe_check_enabled: boolean;
  timeout_threshold_sec: number;
}

export interface TrassirChannel {
  id: number; name: string; enabled: boolean; online: boolean;
  stream_url_main: string; stream_url_sub: string; thumbnail_url: string;
}

export interface TrassirChannelsResponse { success: true; nvr_ip: string; channels: TrassirChannel[] }

export interface StatusResponse {
  status: 'running' | 'stopped'; version: string; uptime_seconds: number; cameras_connected: boolean;
}

export interface LogsResponse { success: true; logs: { message: string }[] }

export interface ExportRequest { start_date: string; end_date: string; type: string }
export interface ExportResponse { success: true; message: string; file: string; start_date: string; end_date: string }

export interface ApiErrorShape { success: false; error?: string; message?: string }

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type LogEventType = 'zone' | 'ppe' | 'system';

export interface LogEvent {
  id: string;
  ts: Date;
  level: LogLevel;
  cameraId?: number;
  cameraName?: string;
  type: LogEventType;
  message: string;
  raw: string;
}
