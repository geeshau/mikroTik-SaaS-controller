'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { registerServiceWorker } from '@/lib/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    registerServiceWorker();

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 glass-card rounded-2xl p-4 shadow-2xl border border-teal-200/50 dark:border-teal-500/30 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-teal-50 dark:bg-teal-500/10 rounded-xl shrink-0">
          <Download className="text-teal-600 dark:text-teal-400" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Install Vortex</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add to home screen for quick access and offline support
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors shadow-sm"
            >
              Install
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
