import { apiRequest } from './client';
import type { ExportRequest, ExportResponse } from '@/types/api';

export const exportEvents = (body: ExportRequest) =>
  apiRequest<ExportResponse>('/api/export', { method: 'POST', body });
