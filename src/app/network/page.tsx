'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Globe2, Network, Layers, Zap, TrendingUp, TrendingDown, Server,
  Radio, ShieldCheck, ArrowRight, Activity, Building2, AlertTriangle,
  CheckCircle2, XCircle, Gauge, Route, Wifi,
} from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import { TopologyMap } from '@/components/network/TopologyMap';
import { SparklineChart } from '@/components/dashboard/SparklineChart';
import {
  SITES, OVERLAYS, REGIONS, allUplinks, capacityBuckets,
  totalContractedMbps, totalCurrentMbps, totalSubscribers,
  SITE_ROLE_META, UPLINK_TYPE_META,
  type Site, type SiteStatus,
} from '@/lib/network';
import { series, hashSeed } from '@/lib/prng';

const STATUS_META: Record<SiteStatus, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  online:      { label: 'Online',      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  degraded:    { label: 'Degraded',    color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: AlertTriangle },
  offline:     { label: 'Offline',     color: 'text-rose-500',     bg: 'bg-rose-50',     border: 'border-rose-200',     icon: XCircle },
  maintenance: { label: 'Maintenance', color: 'text-slate-400',   bg: 'bg-slate-100',       border: 'border-slate-200',      icon: AlertTriangle },
};

export default function NetworkPage() {
  const [regionFilter, setRegionFilter] = useState('All');
  const [overlayId, setOverlayId] = useState(OVERLAYS[0].id);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  const filtered = useMemo(
    () => SITES.filter(s => regionFilter === 'All' || s.region === regionFilter),
    [regionFilter],
  );

  const uplinkList = useMemo(() => allUplinks(), []);
  const buckets = useMemo(() => capacityBuckets(), []);

  const health = useMemo(() => {
    const online = SITES.filter(s => s.status === 'online').length;
    const degraded = SITES.filter(s => s.status === 'degraded').length;
    const offline = SITES.filter(s => s.status === 'offline').length;
    return { online, degraded, offline, total: SITES.length };
  }, []);

  const contracted = totalContractedMbps();
  const current = totalCurrentMbps();
  const utilisation = contracted ? (current / contracted) * 100 : 0;

  const activeUplinks = uplinkList.filter(u => u.state === 'active');
  const standbyUplinks = uplinkList.filter(u => u.state === 'standby');
  const downUplinks = uplinkList.filter(u => u.state === 'down');

  /** Aggregate WAN throughput series for the top chart. */
  const wanSeries = useMemo(
    () => series(current * 1.15, current * 0.22, 36, hashSeed('wan-aggregate'), 0.4),
    [current],
  );

  const overlay = OVERLAYS.find(o => o.id === overlayId)!;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8">

        {/* ── Header ── */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2 sm:gap-3">
              <Globe2 className="text-teal-600 shrink-0" size={20} /> Wide Area Network
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              {SITES.length} sites · {uplinkList.length} WAN circuits · {totalSubscribers().toLocaleString()} subscribers
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/60 rounded-xl p-1 overflow-x-auto no-scrollbar">
              {OVERLAYS.map(o => (
                <button
                  key={o.id}
                  onClick={() => setOverlayId(o.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    overlayId === o.id ? 'bg-teal-100 text-teal-600' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {o.name}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: 'Contracted',   value: `${(contracted / 1000).toFixed(1)}`, unit: 'Gbps', icon: Network,      color: '#3b82f6', sub: `${uplinkList.length} circuits` },
            { label: 'Utilised',     value: utilisation.toFixed(0),           unit: '%',     icon: Gauge,        color: '#10b981', sub: `${current.toLocaleString()} Mbps now` },
            { label: 'Active / Standby', value: `${activeUplinks.length}/${standbyUplinks.length}`, unit: '', icon: Zap, color: '#f59e0b', sub: `${downUplinks.length} down` },
            { label: 'Sites online', value: `${health.online}/${health.total}`, unit: '', icon: Building2, color: '#22c55e', sub: `${health.degraded} degraded` },
            { label: 'Overlay',      value: overlay.status.toUpperCase(),      unit: '',      icon: ShieldCheck, color: '#a855f7', sub: `${overlay.memberSiteIds.length} members` },
          ].map(({ label, value, unit, icon: Icon, color, sub }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest truncate">{label}</p>
                <div className="p-1.5 rounded-lg shrink-0" style={{ background: `${color}22` }}>
                  <Icon size={13} style={{ color }} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-800">
                {value}
                {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 truncate">{sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Topology + site list ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">

          {/* Map */}
          <div className="glass-card overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200/50 flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 shrink-0">
                <Layers size={14} className="text-teal-600" /> Network Topology
              </h2>
              <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/60 rounded-xl p-1 overflow-x-auto no-scrollbar max-w-full">
                {['All', ...REGIONS].map(r => (
                  <button
                    key={r}
                    onClick={() => setRegionFilter(r)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap shrink-0 ${
                      regionFilter === r ? 'bg-slate-100/80 text-slate-800' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <TopologyMap
              focusOverlayId={overlayId}
              selectedSiteId={selectedSite?.id ?? null}
              onSelectSite={setSelectedSite}
              visibleSiteIds={regionFilter === 'All' ? null : filtered.map(s => s.id)}
            />
          </div>

          {/* Site list */}
          <div className="glass-card overflow-hidden flex flex-col max-h-[640px]">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Server size={14} className="text-emerald-600" /> Sites
              </h2>
              <span className="text-[10px] text-slate-400">{filtered.length} shown</span>
            </div>
            <ul className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {filtered.map(site => {
                const meta = STATUS_META[site.status];
                const roleMeta = SITE_ROLE_META[site.role];
                const active = selectedSite?.id === site.id;
                return (
                  <li key={site.id}>
                    <button
                      onClick={() => setSelectedSite(site)}
                      className={`w-full text-left px-6 py-3.5 transition-colors ${
                        active ? 'bg-teal-50/40' : 'hover:bg-teal-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{site.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {site.code} · {site.city}
                          </p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${roleMeta.bg} ${roleMeta.border} ${roleMeta.color}`}>
                          {roleMeta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2.5">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold">
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.color.replace('text-', 'bg-')}`} />
                          <span className={meta.color}>{meta.label}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {site.currentMbps} / {site.contractedMbps} Mbps
                        </span>
                        <span className="ml-auto text-[10px] text-slate-300">
                          {site.uplinks.length} uplink{site.uplinks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {/* Capacity bar */}
                      <div className="mt-2 h-1 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min((site.currentMbps / Math.max(site.contractedMbps, 1)) * 100, 100)}%`,
                            background: meta.color.replace('text-', 'bg-'),
                          }}
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {selectedSite && (
              <div className="p-4 border-t border-slate-200/50 bg-teal-50/30">
                <Link
                  href={`/sites/${selectedSite.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold rounded-xl transition-all"
                >
                  Open {selectedSite.code}
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Throughput + capacity distribution ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 lg:col-span-2">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity size={14} className="text-teal-600" /> Aggregate WAN Throughput
            </h2>
            <SparklineChart data={wanSeries} color="#3b82f6" label="All sites" unit=" Mbps" height={110} />
            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-200/50">
              {[
                { label: 'Peak',  value: Math.max(...wanSeries).toFixed(0), unit: 'Mbps', icon: TrendingUp,   color: '#3b82f6' },
                { label: 'Mean',  value: (wanSeries.reduce((s, v) => s + v, 0) / wanSeries.length).toFixed(0), unit: 'Mbps', icon: Activity, color: '#10b981' },
                { label: 'Headroom', value: (contracted - current).toLocaleString(), unit: 'Mbps', icon: TrendingDown, color: '#8b5cf6' },
              ].map(({ label, value, unit, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: `${color}22` }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-black text-slate-800">
                      {value}
                      <span className="text-[10px] font-normal text-slate-400 ml-1">{unit}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Gauge size={14} className="text-amber-600" /> Circuit Utilisation
            </h2>
            <div className="space-y-3">
              {buckets.map(b => {
                const pct = uplinkList.length ? (b.count / uplinkList.length) * 100 : 0;
                return (
                  <div key={b.label}>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-slate-500 font-mono">{b.label}</span>
                      <span className="text-slate-500 font-bold">{b.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: b.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-5 border-t border-slate-200/50 space-y-2">
              {(['fiber', '5g', 'lte', 'starlink', 'dsl'] as const).map(t => {
                const count = uplinkList.filter(u => u.type === t).length;
                return (
                  <div key={t} className="flex items-center gap-2 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: UPLINK_TYPE_META[t].color }} />
                    <span className="text-slate-500">{UPLINK_TYPE_META[t].label}</span>
                    <span className="ml-auto font-mono text-slate-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Circuits table ── */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/50 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Radio size={14} className="text-violet-600" /> WAN Circuits
            </h2>
            <span className="text-[10px] text-slate-400">
              {activeUplinks.length} active · {standbyUplinks.length} standby · {downUplinks.length} down
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-200/50">
                  <th className="text-left px-6 py-3 font-semibold">Site</th>
                  <th className="text-left px-4 py-3 font-semibold">Circuit</th>
                  <th className="text-left px-4 py-3 font-semibold">Provider</th>
                  <th className="text-left px-4 py-3 font-semibold">Public IP</th>
                  <th className="text-right px-4 py-3 font-semibold">Down</th>
                  <th className="text-left px-4 py-3 font-semibold">Utilisation</th>
                  <th className="text-right px-4 py-3 font-semibold">Latency</th>
                  <th className="text-right px-4 py-3 font-semibold">Loss</th>
                  <th className="text-right px-6 py-3 font-semibold">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uplinkList.map(u => {
                  const stateColor =
                    u.state === 'active' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                    : u.state === 'standby' ? 'text-teal-600 bg-teal-50 border-teal-200'
                    : u.state === 'degraded' ? 'text-amber-600 bg-amber-50 border-amber-200'
                    : 'text-rose-500 bg-rose-50 border-rose-200';

                  return (
                    <tr key={u.id} className="hover:bg-teal-50/30 transition-colors">
                      <td className="px-6 py-3">
                        <Link href={`/sites/${u.siteId}`} className="text-slate-800 hover:text-teal-600 transition-colors">
                          {u.siteName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: UPLINK_TYPE_META[u.type].color }} />
                          {u.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{u.provider}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{u.publicIp}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">
                        {u.downMbps || '—'}
                        <span className="text-slate-400"> M</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${u.utilizationPct}%`,
                                backgroundColor:
                                  u.utilizationPct > 80 ? '#ef4444' : u.utilizationPct > 50 ? '#f59e0b' : '#10b981',
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{u.utilizationPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">{u.latencyMs} ms</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">{u.lossPct.toFixed(1)}%</td>
                      <td className="px-6 py-3 text-right">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${stateColor}`}>
                          {u.state}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SD-WAN shortcuts ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { href: '/sdwan', icon: Route, color: '#a855f7', title: 'SD-WAN Policies', body: 'Per-site policy based routing, application classes and egress steering.' },
            { href: '/sdwan', icon: Layers, color: '#06b6d4', title: 'Overlay Mesh', body: 'WireGuard hub-and-spoke meshes with per-peer handshakes and RTT.' },
            { href: '/sites', icon: Wifi, color: '#10b981', title: 'Site Templates', body: 'Push a standardised site profile to every branch in one operation.' },
          ].map(({ href, icon: Icon, color, title, body }) => (
            <Link
              key={title}
              href={href}
              className="glass-card p-5 flex items-start gap-4 hover:border-slate-300 transition-all group"
            >
              <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${color}22` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 group-hover:text-teal-600 transition-colors">{title}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{body}</p>
              </div>
              <ArrowRight size={15} className="text-slate-300 group-hover:text-teal-600 transition-colors mt-1" />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
