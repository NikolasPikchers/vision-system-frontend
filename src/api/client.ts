import { ApiError } from './errors';

interface StoredAuth { state?: { sessionId?: string | null; expiresAt?: number | null } }

function readSessionId(): string | null {
  try {
    const raw = localStorage.getItem('vs_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    return parsed.state?.sessionId ?? null;
  } catch { return null; }
}

export interface RequestOpts {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const sessionId = readSessionId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...opts.headers,
  };
  if (sessionId) headers['Authorization'] = sessionId;

  const res = await fetch(path, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
  });

  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
  }

  if (!res.ok) {
    const body = data as { message?: string; error?: string };
    const msg = body.message ?? body.error ?? res.statusText;
    const err = new ApiError(res.status, msg, data);
    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vs:session-expired'));
    }
    throw err;
  }
  return data as T;
}

export async function apiBlob(path: string): Promise<{ blob: Blob; headers: Headers }> {
  const sessionId = readSessionId();
  const headers: Record<string, string> = {};
  if (sessionId) headers['Authorization'] = sessionId;
  const res = await fetch(path, { headers });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  const blob = await res.blob();
  return { blob, headers: res.headers };
}
