import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  sessionId: string | null;
  username: string | null;
  expiresAt: number | null;
  setSession: (id: string, username: string, expiresInSec: number) => void;
  clear: () => void;
  isExpired: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      username: null,
      expiresAt: null,
      setSession: (id, username, expiresInSec) =>
        set({ sessionId: id, username, expiresAt: Date.now() + expiresInSec * 1000 }),
      clear: () => set({ sessionId: null, username: null, expiresAt: null }),
      isExpired: () => {
        const exp = get().expiresAt;
        return exp === null || Date.now() >= exp;
      },
    }),
    { name: 'vs_auth' }
  )
);
