import { Toaster as Sonner } from 'sonner';
import { useTheme } from '@/stores/theme';

export function Toaster() {
  const theme = useTheme((s) => s.theme);
  return <Sonner theme={theme} position="bottom-right" richColors closeButton />;
}
