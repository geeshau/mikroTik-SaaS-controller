'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap, LayoutGrid, Cpu, GitMerge, Activity,
  Users, Bell, Search, Shield, ChevronRight,
  Globe2, Route, Building2, Menu, X, Radio, ShieldCheck,
} from 'lucide-react';
import { SITES } from '@/lib/network';

const NAV = [
  { href: '/network',         label: 'WAN Overview',   icon: Globe2     },
  { href: '/sites',           label: 'Sites',          icon: Building2  },
  { href: '/sdwan',           label: 'SD-WAN',         icon: Route      },
  { href: '/hotspots',        label: 'Hotspots',       icon: Radio      },
  { href: '/access-control',  label: 'Access Control', icon: ShieldCheck },
  { href: '/',                label: 'Operations',     icon: LayoutGrid },
  { href: '/firmware-audit',  label: 'Firmware Audit', icon: Cpu        },
  { href: '/bulk-push',       label: 'Bulk Push',      icon: GitMerge   },
  { href: '/audit-log',       label: 'Audit Log',      icon: Activity   },
  { href: '/client-portal',   label: 'Client Portal',  icon: Users      },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onlineSites = SITES.filter(s => s.status === 'online').length;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  const navList = (
    <>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2 mt-1">
        Management
      </p>
      {NAV.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/'
          ? pathname === '/'
          : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileNavOpen(false)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all ${
              isActive
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25'
                : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-700'
            }`}
          >
            <Icon size={16} className="shrink-0" />
            {label}
            {isActive && <ChevronRight size={12} className="ml-auto opacity-70" />}
          </Link>
        );
      })}
    </>
  );

  const sidebarFooter = (
    <>
      {/* Tunnel status */}
      <div className="p-3 border-t border-slate-200/50">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200/60 rounded-xl">
          <Shield size={13} className="text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-700">Tunnels Active</p>
            <p className="text-[10px] text-emerald-600/60">{onlineSites} / {SITES.length} sites online</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        </div>
      </div>

      {/* User */}
      <div className="p-3 border-t border-slate-200/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow shrink-0">
            AU
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">Admin User</p>
            <p className="text-[10px] text-slate-400 truncate">admin@org.com</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-64 flex-col fixed h-full z-40 bg-white/70 backdrop-blur-xl border-r border-white/40 shadow-[4px_0_24px_rgba(0,0,0,0.04)]">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200/50 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md">
            <Zap className="text-white fill-white" size={16} />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-800">VORTEX</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto no-scrollbar">{navList}</nav>

        {sidebarFooter}
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <aside className="absolute left-0 top-0 h-full w-64 max-w-[85vw] bg-white/90 backdrop-blur-xl border-r border-white/40 flex flex-col shadow-2xl">
            <div className="h-16 flex items-center justify-between gap-3 px-6 border-b border-slate-200/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md">
                  <Zap className="text-white fill-white" size={16} />
                </div>
                <span className="text-lg font-extrabold tracking-tight text-slate-800">VORTEX</span>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
                className="p-2 -mr-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto no-scrollbar">{navList}</nav>

            {sidebarFooter}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/40 flex items-center gap-3 px-4 sm:px-6 lg:px-8 sticky top-0 bg-white/60 backdrop-blur-xl z-30">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
            className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100/80 transition-colors shrink-0"
          >
            <Menu size={20} />
          </button>

          {/* Brand — mobile only */}
          <Link
            href="/"
            className="lg:hidden flex items-center gap-2 shrink-0"
            aria-label="Vortex home"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
              <Zap className="text-white fill-white" size={13} />
            </div>
            <span className="text-base font-extrabold tracking-tight text-slate-800 hidden min-[380px]:inline">
              VORTEX
            </span>
          </Link>

          <div className="flex-1 min-w-0 max-w-md">
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors"
                size={15}
              />
              <input
                type="text"
                placeholder="Search sites, routers, circuits, MACs..."
                className="w-full bg-white/60 border border-slate-200/60 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all placeholder:text-slate-300 text-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              aria-label="Notifications"
              className="relative p-2 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-400 rounded-full ring-2 ring-white" />
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
