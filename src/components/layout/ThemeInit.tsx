import { useEffect } from 'react';
import { useTheme } from '@/stores/theme';

export function ThemeInit() {
  const theme = useTheme((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return null;
}
