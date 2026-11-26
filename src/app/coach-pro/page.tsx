'use client';

import { useState, useEffect } from 'react';
import {
  Search, Bell, Menu, ChevronRight, Trophy,
  MapPin, Clock, Target, DollarSign, CreditCard,
  Star, CalendarCheck, Flame,
} from 'lucide-react';
import Sidebar from '@/components/coachpro/Sidebar';
import {
  STANDINGS, GAME_STATS, METRICS, NEXT_MATCH,
  type StandingsRow,
} from '@/lib/coachpro';

/* ── Icon map for metric tiles ──────────────────────────────────────────── */
const METRIC_ICON: Record<string, React.ElementType> = {
  Target, DollarSign, CreditCard, Star,
};

/* ═══════════════════════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function CoachProDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* close mobile sidebar on resize up */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = () => { if (mq.matches) setSidebarOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top bar ────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-white/40 px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4">
            {/* Left: hamburger + greeting */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100/80 text-slate-500"
              >
                <Menu size={22} />
              </button>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium">Welcome back,</p>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight truncate">
                  Dashboard
                </h1>
              </div>
            </div>

            {/* Right: search, bell, profile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/60 border border-slate-200/60 text-slate-400 text-sm hover:bg-white/80 transition">
                <Search size={15} />
                <span className="hidden md:inline">Search…</span>
              </button>
              <button className="sm:hidden p-2 rounded-xl hover:bg-slate-100/80 text-slate-400">
                <Search size={18} />
              </button>
              <button className="relative p-2 rounded-xl hover:bg-slate-100/80 text-slate-400">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-400 ring-2 ring-white" />
              </button>
              <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200/60">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow">
                  AP
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-bold text-slate-700 leading-tight">Andrea Pirlo</p>
                  <p className="text-[11px] text-slate-400">Head Coach</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Dashboard content ──────────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* ── Row 1: Next Game + Standings ───────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <NextGameCard />
              <StandingsCard />
            </div>

            {/* ── Row 2: Game Statistics ─────────────────────────────── */}
            <GameStatsCard />

            {/* ── Row 3: Metric tiles ───────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {METRICS.map((m) => {
                const Icon = METRIC_ICON[m.icon] ?? Target;
                return (
                  <div
                    key={m.label}
                    className="glass-card-light group flex items-center gap-4 p-5 rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className={`shrink-0 w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center ${m.fg} shadow-sm`}>
                      <Icon size={22} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 font-medium">{m.label}</p>
                      <p className="text-xl font-extrabold text-slate-800 tracking-tight">{m.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Row 4: Training reminder banner ───────────────────── */}
            <TrainingBanner />
          </div>
        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Next Game Card
   ═══════════════════════════════════════════════════════════════════════════ */

function NextGameCard() {
  const m = NEXT_MATCH;
  return (
    <div className="glass-card-light rounded-2xl p-6 sm:p-7 relative overflow-hidden">
      {/* Decorative accent circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-teal-400/15 to-emerald-400/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-br from-amber-300/10 to-yellow-300/5 blur-2xl pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={14} className="text-amber-500" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.league}</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-800">Next game</h2>
          </div>
          <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
            {m.round}
          </span>
        </div>

        {/* Match-up */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 py-6">
          {/* Home */}
          <div className="flex flex-col items-center gap-2.5">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg"
              style={{ background: m.home.color }}
            >
              {m.home.short}
            </div>
            <span className="text-sm font-bold text-slate-700">{m.home.name}</span>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-300">VS</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock size={12} />
              <span className="text-[11px] font-medium">20:45</span>
            </div>
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-2.5">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg"
              style={{ background: m.away.color }}
            >
              {m.away.short}
            </div>
            <span className="text-sm font-bold text-slate-700">{m.away.name}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <MapPin size={12} />
            <span>{m.venue}</span>
          </div>
          <span className="text-xs text-slate-400">{m.date}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Standings Card
   ═══════════════════════════════════════════════════════════════════════════ */

function StandingsCard() {
  return (
    <div className="glass-card-light rounded-2xl p-6 sm:p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-extrabold text-slate-800">Standings</h2>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          Serie A
        </span>
      </div>

      <div className="overflow-x-auto -mx-6 sm:-mx-7 px-6 sm:px-7">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <th className="text-left pb-3 pl-0">#</th>
              <th className="text-left pb-3">Team</th>
              <th className="text-center pb-3">MP</th>
              <th className="text-center pb-3">W</th>
              <th className="text-center pb-3">D</th>
              <th className="text-center pb-3">L</th>
              <th className="text-center pb-3">G</th>
              <th className="text-center pb-3 pr-0">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {STANDINGS.map((row: StandingsRow) => (
              <tr
                key={row.rank}
                className={`hover:bg-teal-50/40 transition-colors ${row.rank === 1 ? 'bg-teal-50/30' : ''}`}
              >
                <td className="py-3 pl-0 font-bold text-slate-400 w-8">{row.rank}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm"
                      style={{ background: row.color }}
                    >
                      {row.short.slice(0, 2)}
                    </div>
                    <span className="font-semibold text-slate-700 whitespace-nowrap">{row.team}</span>
                  </div>
                </td>
                <td className="py-3 text-center text-slate-500">{row.mp}</td>
                <td className="py-3 text-center font-semibold text-emerald-600">{row.w}</td>
                <td className="py-3 text-center text-slate-400">{row.d}</td>
                <td className="py-3 text-center text-rose-400">{row.l}</td>
                <td className="py-3 text-center text-slate-500 font-mono text-xs">{row.g}</td>
                <td className="py-3 text-center pr-0 font-extrabold text-slate-800">{row.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Game Statistics Card
   ═══════════════════════════════════════════════════════════════════════════ */

function GameStatsCard() {
  const { played, victories, draws, lost } = GAME_STATS;
  const total = played;
  const pctV = (victories / total) * 100;
  const pctD = (draws / total) * 100;
  const pctL = (lost / total) * 100;

  const segments = [
    { label: 'Victories', count: victories, pct: pctV, color: 'bg-emerald-400', text: 'text-emerald-600', light: 'bg-emerald-50' },
    { label: 'Draws',     count: draws,     pct: pctD, color: 'bg-amber-400',   text: 'text-amber-600',   light: 'bg-amber-50'   },
    { label: 'Lost',      count: lost,      pct: pctL, color: 'bg-rose-400',    text: 'text-rose-500',    light: 'bg-rose-50'    },
  ];

  return (
    <div className="glass-card-light rounded-2xl p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-lg font-extrabold text-slate-800">Games statistic</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            PL {played}
          </span>
        </div>
      </div>

      {/* Segmented bar */}
      <div className="flex h-4 rounded-full overflow-hidden mb-5 shadow-inner bg-slate-100/80">
        <div
          className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
          style={{ width: `${pctV}%` }}
        />
        <div
          className="bg-gradient-to-r from-amber-300 to-amber-400 transition-all duration-700"
          style={{ width: `${pctD}%` }}
        />
        <div
          className="bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-700"
          style={{ width: `${pctL}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 sm:gap-8">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${s.color} shadow-sm`} />
            <div>
              <p className="text-xs text-slate-400 font-medium">{s.label}</p>
              <p className={`text-lg font-extrabold ${s.text}`}>{s.count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Training Reminder Banner
   ═══════════════════════════════════════════════════════════════════════════ */

function TrainingBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 p-6 sm:p-8 text-white shadow-xl shadow-teal-500/20">
      {/* 3D-style decorative accents */}
      <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/3 blur-sm" />
      <div className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full bg-white/10 translate-y-1/2 blur-sm" />
      <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/15 -translate-y-1/2" />
      {/* Small floating orbs for 3D depth */}
      <div className="absolute top-4 right-32 w-6 h-6 rounded-full bg-white/20 shadow-lg" />
      <div className="absolute bottom-6 right-16 w-4 h-4 rounded-full bg-white/15 shadow-md" />
      <div className="absolute top-8 left-1/2 w-3 h-3 rounded-full bg-white/25" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <CalendarCheck size={24} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame size={14} className="text-amber-300" />
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Don&apos;t forget</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold leading-tight">
              Setup training for next week
            </h3>
            <p className="text-sm text-white/70 mt-1">
              Prepare drills, assign groups, and schedule recovery sessions.
            </p>
          </div>
        </div>

        <button className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-teal-700 font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
          Go to training center
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
