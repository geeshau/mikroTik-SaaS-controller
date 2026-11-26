'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Router, Cpu, Shield, Radio, X } from 'lucide-react';
import { notify } from '@/lib/notifications';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'success' as const, title: 'Main Office Gateway online', time: '2m ago', read: false },
  { id: 2, type: 'warning' as const, title: 'CPU threshold breach — Warehouse Node', time: '5m ago', read: false },
  { id: 3, type: 'error' as const, title: 'Guest Wi-Fi (East) offline', time: '1h ago', read: true },
  { id: 4, type: 'info' as const, title: 'Firmware v7.14.3 available for 3 routers', time: '2h ago', read: true },
  { id: 5, type: 'success' as const, title: 'Bulk push completed — 5 routers', time: '3h ago', read: true },
];

const TYPE_STYLES = {
  success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  error: 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400',
  info: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400',
};

const TYPE_ICONS = {
  success: Router,
  warning: Cpu,
  error: Radio,
  info: Shield,
};

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className="relative p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-[9px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Notifications</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-teal-600 hover:text-teal-500 font-semibold">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-200/50 dark:divide-slate-700/50">
            {notifications.map(n => {
              const Icon = TYPE_ICONS[n.type];
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${!n.read ? 'bg-teal-50/30 dark:bg-teal-500/5' : ''} hover:bg-slate-50/50 dark:hover:bg-slate-700/30`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${TYPE_STYLES[n.type]}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!n.read ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                      {n.title}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{n.time}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1" />}
                </div>
              );
            })}
          </div>
          <div className="px-4 py-2.5 border-t border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => {
                notify.routerOnline('Tower AP — Ngong');
                setOpen(false);
              }}
              className="w-full text-xs text-center text-teal-600 hover:text-teal-500 font-semibold py-1"
            >
              Send test notification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
