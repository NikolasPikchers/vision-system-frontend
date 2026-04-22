import { apiRequest } from './client';
import type { LoginResponse } from '@/types/api';

export const login = (username: string, password: string) =>
  apiRequest<LoginResponse>('/api/login', { method: 'POST', body: { username, password } });

export const logout = () =>
  apiRequest<{ success: true; message?: string }>('/api/logout', { method: 'POST' });
