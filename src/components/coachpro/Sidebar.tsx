'use client';

import {
  LayoutDashboard, Users, MessageCircle, BarChart3,
  CalendarDays, Wallet, ArrowLeftRight, GraduationCap,
  Settings, LogOut, X,
} from 'lucide-react';
import { SIDEBAR_NAV } from '@/lib/coachpro';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, MessageCircle, BarChart3,
  CalendarDays, Wallet, ArrowLeftRight, GraduationCap,
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* ── Mobile overlay ──────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* ── Rail ────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-white/70 backdrop-blur-xl border-r border-white/40
          shadow-[4px_0_24px_rgba(0,0,0,0.04)]
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-black tracking-tight">CP</span>
            </div>
            <span className="text-lg font-extrabold text-slate-800 tracking-tight">CoachPro</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-slate-200/60 text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
            Menu
          </p>
          {SIDEBAR_NAV.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
            const isActive = !!item.active;
            return (
              <button
                key={item.label}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold
                  transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25'
                    : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-700'
                  }
                `}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-6 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold text-slate-400 hover:bg-slate-100/80 hover:text-slate-600 transition-all">
            <Settings size={18} strokeWidth={1.8} />
            Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold text-rose-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
            <LogOut size={18} strokeWidth={1.8} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
