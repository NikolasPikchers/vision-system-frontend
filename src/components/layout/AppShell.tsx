import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { AuthExpiryListener } from './AuthExpiryListener';
import { ErrorBoundary } from './ErrorBoundary';

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AuthExpiryListener />
      <TopBar />
      <main className="mx-auto max-w-content px-6 py-6">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
