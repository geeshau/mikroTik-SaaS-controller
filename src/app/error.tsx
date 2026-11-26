'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-[#eef9f4] via-[#f0f7f4] to-[#e8f4f0] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="glass-card rounded-2xl p-10 max-w-lg w-full text-center space-y-8">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
          <AlertTriangle className="text-rose-500" size={40} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Something went wrong</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3">
            An unexpected error occurred while loading this page.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-teal-500/20"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold transition-colors"
          >
            <Home size={16} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
