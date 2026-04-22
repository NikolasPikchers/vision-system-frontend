import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { LoginPage } from '@/pages/LoginPage';
import { CamerasPage } from '@/pages/CamerasPage';
import { JournalPage } from '@/pages/JournalPage';
import { ExportPage } from '@/pages/ExportPage';
import { AdminPage } from '@/pages/AdminPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { path: '/', element: <Navigate to="/cameras" replace /> },
      { path: '/cameras', element: <CamerasPage /> },
      { path: '/journal', element: <JournalPage /> },
      { path: '/export', element: <ExportPage /> },
      { path: '/admin/*', element: <AdminPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/cameras" replace /> },
]);
