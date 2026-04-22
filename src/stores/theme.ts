import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  toggle: () => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (t) => set({ theme: t }),
      toggle: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    { name: 'vs_theme' }
  )
);
