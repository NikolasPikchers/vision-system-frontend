import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CamerasAdmin } from './admin/CamerasAdmin';
import { ZonesAdmin } from './admin/ZonesAdmin';
import { TrassirAdmin } from './admin/TrassirAdmin';
import { SystemLog } from './admin/SystemLog';

const subtabs = [
  { to: 'cameras', label: 'Камеры' },
  { to: 'zones', label: 'Зоны контроля' },
  { to: 'trassir', label: 'Trassir NVR' },
  { to: 'logs', label: 'Лог системы' },
];

export function AdminPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Администрирование</h1>
      <nav className="flex gap-1 border-b border-border">
        {subtabs.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                '-mb-px border-b-2 px-4 py-2 text-sm transition-colors',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<Navigate to="cameras" replace />} />
        <Route path="cameras" element={<CamerasAdmin />} />
        <Route path="zones" element={<ZonesAdmin />} />
        <Route path="trassir" element={<TrassirAdmin />} />
        <Route path="logs" element={<SystemLog />} />
      </Routes>
    </div>
  );
}
