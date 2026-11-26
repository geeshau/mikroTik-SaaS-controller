'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle className="text-rose-500" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Something went wrong</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                An unexpected error occurred. The error has been logged.
              </p>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">
                    Technical details
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-800 dark:bg-slate-900 rounded-xl text-xs text-rose-400 overflow-auto max-h-32 font-mono">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-teal-500/20"
              >
                <RefreshCw size={14} />
                Try Again
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-colors"
              >
                <Home size={14} />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
