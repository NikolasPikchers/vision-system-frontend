import { apiRequest } from './client';
import type { LogsResponse } from '@/types/api';

export async function getLogs(): Promise<string[]> {
  const res = await apiRequest<LogsResponse>('/api/logs');
  return res.logs.map((l) => l.message);
}
