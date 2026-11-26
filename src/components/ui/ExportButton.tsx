'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, FileJson, Loader2 } from 'lucide-react';
import { exportToCsv, exportToPdf, exportToJson } from '@/lib/export';
import { notify } from '@/lib/notifications';

interface ExportButtonProps {
  /** Base filename without extension */
  filename: string;
  /** Report title for PDF header */
  title: string;
  /** Column headers */
  headers: string[];
  /** Row data */
  rows: (string | number)[][];
  /** Optional raw data for JSON export */
  jsonData?: unknown;
  /** PDF subtitle */
  subtitle?: string;
  /** Additional CSS classes */
  className?: string;
}

export function ExportButton({
  filename,
  title,
  headers,
  rows,
  jsonData,
  subtitle,
  className = '',
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleExport = async (format: 'csv' | 'pdf' | 'json') => {
    setLoading(format);
    try {
      const ts = new Date().toISOString().slice(0, 10);
      const fname = `${filename}-${ts}`;

      switch (format) {
        case 'csv':
          exportToCsv(fname, headers, rows);
          break;
        case 'pdf':
          await exportToPdf(fname, title, headers, rows, { subtitle });
          break;
        case 'json':
          exportToJson(fname, jsonData ?? rows);
          break;
      }
      
      notify.exportReady(`${fname}.${format}`);
    } catch (err) {
      notify.error('Export failed', String(err));
    } finally {
      setLoading(null);
      setOpen(false);
    }
  };

  const formats = [
    { key: 'csv' as const, label: 'CSV Spreadsheet', icon: FileSpreadsheet },
    { key: 'pdf' as const, label: 'PDF Report', icon: FileText },
    { key: 'json' as const, label: 'JSON Data', icon: FileJson },
  ];

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200/50 dark:border-slate-700/50"
      >
        <Download size={14} />
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 glass-card rounded-xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden z-50">
          {formats.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleExport(key)}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50"
            >
              {loading === key ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Icon size={14} className="text-slate-400" />
              )}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
