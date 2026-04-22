import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('UI error boundary:', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
          <AlertTriangle size={32} className="text-destructive" />
          <h2 className="text-xl font-semibold">Произошла ошибка</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.state.error.message || 'Неизвестная ошибка'}
          </p>
          <Button onClick={this.reset}>Попробовать снова</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
