import { describe, it, expect, beforeEach } from 'vitest';
import { useAuth } from './auth';

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.setState({ sessionId: null, username: null, expiresAt: null });
  });

  it('setSession stores credentials and expiry', () => {
    useAuth.getState().setSession('sess_1', 'admin', 1800);
    const s = useAuth.getState();
    expect(s.sessionId).toBe('sess_1');
    expect(s.username).toBe('admin');
    expect(s.expiresAt).toBeGreaterThan(Date.now());
    expect(s.expiresAt).toBeLessThanOrEqual(Date.now() + 1800 * 1000);
  });

  it('isExpired true when past expiry', () => {
    useAuth.setState({ sessionId: 's', expiresAt: Date.now() - 1000 });
    expect(useAuth.getState().isExpired()).toBe(true);
  });

  it('isExpired true when no expiresAt', () => {
    useAuth.setState({ sessionId: null, expiresAt: null });
    expect(useAuth.getState().isExpired()).toBe(true);
  });

  it('clear resets state', () => {
    useAuth.getState().setSession('s', 'u', 1800);
    useAuth.getState().clear();
    const s = useAuth.getState();
    expect(s.sessionId).toBeNull();
    expect(s.username).toBeNull();
    expect(s.expiresAt).toBeNull();
  });

  it('persists under vs_auth key with state wrapper', () => {
    useAuth.getState().setSession('sess_persist', 'admin', 1800);
    const raw = localStorage.getItem('vs_auth');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.sessionId).toBe('sess_persist');
  });
});
