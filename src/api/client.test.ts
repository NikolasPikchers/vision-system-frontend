import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiRequest } from './client';
import { ApiError } from './errors';

const originalFetch = global.fetch;

describe('apiRequest', () => {
  beforeEach(() => {
    localStorage.setItem('vs_auth', JSON.stringify({ state: { sessionId: 'session_abc', expiresAt: Date.now() + 60_000 } }));
  });
  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
  });

  it('sends Authorization header when session exists', async () => {
    const spy = vi.fn(async () => new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }));
    global.fetch = spy as unknown as typeof fetch;
    await apiRequest('/api/cameras');
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('session_abc');
  });

  it('does not send Authorization when no session', async () => {
    localStorage.clear();
    const spy = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
    global.fetch = spy as unknown as typeof fetch;
    await apiRequest('/api/status');
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBeNull();
  });

  it('throws ApiError on 401 with body message', async () => {
    global.fetch = (async () => new Response(JSON.stringify({ success: false, message: 'expired' }), { status: 401 })) as unknown as typeof fetch;
    await expect(apiRequest('/api/cameras')).rejects.toBeInstanceOf(ApiError);
    try { await apiRequest('/api/cameras'); } catch (e) {
      expect((e as ApiError).status).toBe(401);
      expect((e as ApiError).message).toBe('expired');
    }
  });

  it('throws ApiError on 400 using error field when message absent', async () => {
    global.fetch = (async () => new Response(JSON.stringify({ success: false, error: 'Bad body' }), { status: 400 })) as unknown as typeof fetch;
    await expect(apiRequest('/api/camera/add', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 400, message: 'Bad body' });
  });

  it('parses JSON body on success', async () => {
    global.fetch = (async () => new Response(JSON.stringify({ success: true, count: 0, cameras: [] }), { status: 200 })) as unknown as typeof fetch;
    const data = await apiRequest<{ count: number }>('/api/cameras');
    expect(data.count).toBe(0);
  });

  it('serializes body as JSON for POST', async () => {
    const spy = vi.fn(async () => new Response('{}', { status: 200 }));
    global.fetch = spy as unknown as typeof fetch;
    await apiRequest('/api/login', { method: 'POST', body: { username: 'admin', password: 'admin' } });
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ username: 'admin', password: 'admin' }));
  });
});
