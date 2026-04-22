import { NavLink, useNavigate } from 'react-router-dom';
import { Camera, FileText, Download, Settings, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/stores/theme';
import { useAuth } from '@/stores/auth';
import { logout } from '@/api/auth';
import { StatusIndicator } from './StatusIndicator';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/cameras', label: 'Камеры', icon: Camera },
  { to: '/journal', label: 'Журнал', icon: FileText },
  { to: '/export', label: 'Экспорт', icon: Download },
  { to: '/admin', label: 'Администрирование', icon: Settings },
];

export function TopBar() {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  const clearAuth = useAuth((s) => s.clear);
  const navigate = useNavigate();

  async function onLogout() {
    try {
      await logout();
    } catch {
      /* ignore - still clear session locally */
    }
    clearAuth();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-content items-center gap-6 px-6">
        <img src="/rusklimat.jpg" alt="Русклимат" className="h-8" />
        <nav className="flex items-center gap-1">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <StatusIndicator />
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Сменить тему">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut size={16} /> Выйти
          </Button>
        </div>
      </div>
    </header>
  );
}
