import { apiRequest } from './client';
import type { StatusResponse } from '@/types/api';

export const getStatus = () => apiRequest<StatusResponse>('/api/status');
