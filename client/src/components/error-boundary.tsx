import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from '@/lib/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Nešto je pošlo po zlu</h2>
          <div className="mb-4 text-muted-foreground max-w-md">
            <p>Došlo je do greške u aplikaciji.</p>
            {this.state.error && (
              <pre className="mt-4 p-4 bg-muted text-sm rounded-md overflow-auto text-left">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <Button onClick={() => window.location.reload()}>
            Osveži stranicu
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}