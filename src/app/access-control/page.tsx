'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Ban, Plus, Trash2, Search, Terminal, Globe,
  ArrowLeft, CheckCircle2, AlertTriangle, Power, ChevronRight,
  Radio, Activity, CircleSlash, Zap,
} from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import {
  ACCESS_LISTS, ACL_KIND_META, ACL_SCOPE_META,
  aclTotals, routerOsAclCommands, validateCidr, isHostAddress,
  relativeTime, type AccessList, type AclKind, type AclScope, type AclEntry,
} from '@/lib/hotspot';
import { SITES } from '@/lib/network';

type KindFilter = 'all' | AclKind;

interface LocalEntry extends AclEntry {
  local: boolean;
}

interface LocalList extends Omit<AccessList, 'entries'> {
  entries: LocalEntry[];
}

const KIND_META = {
  whitelist: ACL_KIND_META.whitelist,
  blacklist: ACL_KIND_META.blacklist,
};

export default function AccessControlPage() {
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [siteId, setSiteId] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | AclScope>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // Local, editable copy of the seeded lists so the console can add/remove
  // entries and arm/disarm lists without a round-trip.
  const [lists, setLists] = useState<LocalList[]>(() =>
    ACCESS_LISTS.map(l => ({ ...l, entries: l.entries.map(e => ({ ...e, local: false })) })),
  );

  const totals = useMemo(() => aclTotals(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lists.filter(l => {
      const matchKind = kindFilter === 'all' || l.kind === kindFilter;
      const matchSite = siteId === 'all' || l.siteId === siteId;
      const matchScope = scopeFilter === 'all' || l.scope === scopeFilter;
      const matchQ =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.siteName.toLowerCase().includes(q) ||
        l.siteCode.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.entries.some(e => e.cidr.includes(q) || e.comment.toLowerCase().includes(q));
      return matchKind && matchSite && matchScope && matchQ;
    });
  }, [lists, kindFilter, siteId, scopeFilter, query]);

  const selected = useMemo(
    () => lists.find(l => l.id === selectedId) ?? null,
    [lists, selectedId],
  );

  const appendLog = (lines: string[]) => {
    setLog(prev => [...lines.map(l => `> ${l}`), ...prev].slice(0, 40));
  };

  const toggleList = async (list: LocalList) => {
    setBusy(true);
    try {
      const res = await fetch('/api/network/access-lists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: list.id, enabled: !list.enabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        appendLog([`! ${data.error ?? 'Update failed'}`]);
      } else {
        setLists(prev => prev.map(l => (l.id === list.id ? { ...l, enabled: data.enabled } : l)));
        appendLog(data.commands?.length ? data.commands : [`${list.name} ${data.enabled ? 'armed' : 'disarmed'}`]);
      }
    } catch {
      appendLog(['! Network error while updating the list']);
    } finally {
      setBusy(false);
    }
  };

  const addEntry = async (list: LocalList, cidr: string, comment: string) => {
    const validation = validateCidr(cidr);
    if (!validation.ok || !validation.cidr) {
      appendLog([`! ${validation.error ?? 'Invalid address'}`]);
      return { ok: false as const, error: validation.error ?? 'Invalid address' };
    }
    if (list.entries.some(e => e.cidr === validation.cidr)) {
      appendLog([`! ${validation.cidr} is already in ${list.name}`]);
      return { ok: false as const, error: 'Address already listed' };
    }

    setBusy(true);
    try {
      const res = await fetch('/api/network/access-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: list.id, cidr: validation.cidr, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        appendLog([`! ${data.error ?? 'Add failed'}`]);
        return { ok: false as const, error: data.error ?? 'Add failed' };
      }

      setLists(prev =>
        prev.map(l =>
          l.id === list.id
            ? {
                ...l,
                entries: [
                  {
                    id: `${list.id}-local-${l.entries.length + 1}`,
                    cidr: validation.cidr!,
                    comment: comment.trim() || 'Added from console',
                    addedAt: new Date().toISOString(),
                    addedBy: 'admin@org.com',
                    hitCount: 0,
                    lastHitAt: null,
                    status: 'active',
                    local: true,
                  },
                  ...l.entries,
                ],
              }
            : l,
        ),
      );
      appendLog([data.command]);
      return { ok: true as const };
    } catch {
      appendLog(['! Network error while adding the entry']);
      return { ok: false as const, error: 'Network error' };
    } finally {
      setBusy(false);
    }
  };

  const removeEntry = async (list: LocalList, entry: LocalEntry) => {
    setBusy(true);
    try {
      const res = await fetch('/api/network/access-lists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: list.id, entryId: entry.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        appendLog([`! ${data.error ?? 'Remove failed'}`]);
        return;
      }
      setLists(prev =>
        prev.map(l =>
          l.id === list.id
            ? { ...l, entries: l.entries.filter(e => e.id !== entry.id) }
            : l,
        ),
      );
      appendLog([data.command]);
    } catch {
      appendLog(['! Network error while removing the entry']);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto space-y-6 sm:space-y-8">

        {/* ── Header ── */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
              <Link href="/hotspots" className="hover:text-slate-700 transition-colors flex items-center gap-1.5">
                <ArrowLeft size={13} /> Hotspots
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2 sm:gap-3">
              <ShieldCheck className="text-emerald-600 shrink-0" size={20} /> IP Access Control
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Whitelist and blacklist addresses pushed to the router firewall
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              {totals.enabled} / {totals.lists} lists armed
            </span>
          </div>
        </header>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: 'Whitelist', value: totals.whitelistEntries, sub: 'allowed addresses', color: 'text-emerald-600', icon: ShieldCheck },
            { label: 'Blacklist', value: totals.blacklistEntries, sub: 'blocked addresses', color: 'text-rose-500',     icon: Ban },
            { label: 'Blocked Hits', value: totals.blockedHits, sub: 'packets dropped', color: 'text-amber-600', icon: CircleSlash },
            { label: 'Allowed Hits', value: totals.allowedHits, sub: 'packets accepted', color: 'text-teal-600',   icon: CheckCircle2 },
          ].map(({ label, value, sub, color, icon: Icon }) => (
            <div key={label} className="glass-card p-3 sm:p-5 flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-2.5 bg-slate-100 rounded-xl shrink-0">
                <Icon size={18} className={color} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest truncate">{label}</p>
                <p className={`text-xl sm:text-2xl font-black ${color} truncate`}>{value}</p>
                <p className="text-[10px] text-slate-300 truncate hidden sm:block">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/60 rounded-xl p-1 shrink-0">
            {(['all', 'whitelist', 'blacklist'] as KindFilter[]).map(k => (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  kindFilter === k
                    ? k === 'whitelist' ? 'bg-emerald-50 text-emerald-600'
                    : k === 'blacklist' ? 'bg-rose-50 text-rose-500'
                    : 'bg-slate-100/80 text-slate-800'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {k === 'whitelist' && <ShieldCheck size={12} />}
                {k === 'blacklist' && <Ban size={12} />}
                {k === 'all' ? 'All' : k === 'whitelist' ? 'Allow' : 'Deny'}
              </button>
            ))}
          </div>

          <select
            value={siteId}
            onChange={e => setSiteId(e.target.value)}
            aria-label="Filter by site"
            className="max-w-full bg-slate-100 border border-slate-200/60 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <option value="all" className="bg-white">All sites</option>
            {SITES.map(s => (
              <option key={s.id} value={s.id} className="bg-white">{s.code} — {s.name}</option>
            ))}
          </select>

          <select
            value={scopeFilter}
            onChange={e => setScopeFilter(e.target.value as 'all' | AclScope)}
            aria-label="Filter by scope"
            className="max-w-full bg-slate-100 border border-slate-200/60 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <option value="all" className="bg-white">Any chain</option>
            {(Object.keys(ACL_SCOPE_META) as AclScope[]).map((s: AclScope) => (
              <option key={s} value={s} className="bg-white">{ACL_SCOPE_META[s].label}</option>
            ))}
          </select>

          <div className="relative group w-full min-w-0 sm:w-60 sm:flex-none">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"
              size={15}
            />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search address, list, site…"
              className="w-full bg-slate-100 border border-slate-200/60 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-300 text-slate-800"
            />
          </div>

          <span className="ml-auto text-xs text-slate-400 self-center">
            {filtered.length} list{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
          <div className="min-w-0 space-y-6">

            {/* List of lists */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-200/50 text-[10px] text-slate-400 uppercase tracking-widest">
                      <th className="px-4 sm:px-5 py-3 text-left">List</th>
                      <th className="px-4 sm:px-5 py-3 text-left">Site</th>
                      <th className="px-4 sm:px-5 py-3 text-left">Chain</th>
                      <th className="px-4 sm:px-5 py-3 text-left">Entries</th>
                      <th className="px-4 sm:px-5 py-3 text-left">Hits</th>
                      <th className="px-4 sm:px-5 py-3 text-left">Synced</th>
                      <th className="px-4 sm:px-5 py-3 text-right">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((l, i) => {
                      const km = KIND_META[l.kind];
                      return (
                        <motion.tr
                          key={l.id}
                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          onClick={() => setSelectedId(l.id === selectedId ? null : l.id)}
                          className={`hover:bg-teal-50/30 transition-colors cursor-pointer ${
                            selectedId === l.id ? 'bg-emerald-500/[0.06]' : ''
                          }`}
                        >
                          <td className="px-4 sm:px-5 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`p-1.5 rounded-lg shrink-0 ${km.bg} ${km.color}`}>
                                {l.kind === 'whitelist' ? <ShieldCheck size={14} /> : <Ban size={14} />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{l.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{l.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-5 py-3">
                            <p className="text-xs text-slate-500 truncate">{l.siteName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{l.siteCode}</p>
                          </td>
                          <td className="px-4 sm:px-5 py-3">
                            <span className="text-[11px] text-slate-500">{ACL_SCOPE_META[l.scope].label}</span>
                            <p className="text-[10px] text-slate-400 font-mono">chain={ACL_SCOPE_META[l.scope].chain}</p>
                          </td>
                          <td className="px-4 sm:px-5 py-3">
                            <p className="text-xs font-mono text-slate-500">{l.entries.length}</p>
                            <p className="text-[10px] text-slate-400">
                              {l.entries.filter(e => isHostAddress(e.cidr)).length} host · {l.entries.filter(e => !isHostAddress(e.cidr)).length} range
                            </p>
                          </td>
                          <td className="px-4 sm:px-5 py-3 text-xs font-mono text-slate-500">
                            {l.entries.reduce((s, e) => s + e.hitCount, 0).toLocaleString()}
                          </td>
                          <td className="px-4 sm:px-5 py-3">
                            <p className="text-[11px] text-slate-500">{relativeTime(l.lastSyncedAt)}</p>
                            <p className="text-[10px] text-slate-400">created {relativeTime(l.createdAt)}</p>
                          </td>
                          <td className="px-4 sm:px-5 py-3 text-right">
                            <button
                              onClick={e => { e.stopPropagation(); toggleList(l); }}
                              disabled={busy}
                              aria-label={l.enabled ? `Disarm ${l.name}` : `Arm ${l.name}`}
                              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-40 ${
                                l.enabled
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20'
                                  : 'bg-slate-100 text-slate-400 border-slate-200/60 hover:bg-slate-100/80'
                              }`}
                            >
                              <Power size={11} />
                              {l.enabled ? 'Armed' : 'Off'}
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm">No access lists match the current filter.</div>
              )}
            </motion.div>

            {/* Entry table for the selected list */}
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-slate-200/50 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {selected.name} — addresses
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{selected.description}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${KIND_META[selected.kind].bg} ${KIND_META[selected.kind].color} border ${KIND_META[selected.kind].border}`}>
                    {KIND_META[selected.kind].label}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="border-b border-slate-200/50 text-[10px] text-slate-400 uppercase tracking-widest">
                        <th className="px-4 sm:px-5 py-3 text-left">Address</th>
                        <th className="px-4 sm:px-5 py-3 text-left">Comment</th>
                        <th className="px-4 sm:px-5 py-3 text-left">Added</th>
                        <th className="px-4 sm:px-5 py-3 text-left">Hits</th>
                        <th className="px-4 sm:px-5 py-3 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selected.entries.map(e => (
                        <tr key={e.id} className="hover:bg-teal-50/30 transition-colors">
                          <td className="px-4 sm:px-5 py-3">
                            <span className="text-xs font-mono font-bold text-slate-500">{e.cidr}</span>
                            <p className="text-[10px] text-slate-400">
                              {isHostAddress(e.cidr) ? 'single host' : 'address range'}
                            </p>
                          </td>
                          <td className="px-4 sm:px-5 py-3">
                            <span className="text-xs text-slate-500">{e.comment}</span>
                            <p className="text-[10px] text-slate-400 font-mono">{e.addedBy}</p>
                          </td>
                          <td className="px-4 sm:px-5 py-3 text-[11px] text-slate-500">{relativeTime(e.addedAt)}</td>
                          <td className="px-4 sm:px-5 py-3 text-xs font-mono text-slate-500">{e.hitCount.toLocaleString()}</td>
                          <td className="px-4 sm:px-5 py-3 text-right">
                            <button
                              onClick={() => removeEntry(selected, e)}
                              disabled={busy}
                              aria-label={`Remove ${e.cidr}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-lg bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-50/80 transition-all disabled:opacity-40"
                            >
                              <Trash2 size={11} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right rail ── */}
          <aside className="min-w-0 space-y-4 xl:sticky xl:top-24">
            {selected ? (
              <AddEntryCard
                list={selected}
                busy={busy}
                onAdd={(cidr, comment) => addEntry(selected, cidr, comment)}
              />
            ) : (
              <div className="glass-card p-4 sm:p-5">
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-3">Access control overview</p>
                <div className="space-y-3">
                  {[
                    { label: 'Lists configured', value: `${totals.lists}`, color: 'text-slate-800' },
                    { label: 'Lists armed', value: `${totals.enabled}`, color: 'text-emerald-600' },
                    { label: 'Allowed addresses', value: `${totals.whitelistEntries}`, color: 'text-emerald-600' },
                    { label: 'Blocked addresses', value: `${totals.blacklistEntries}`, color: 'text-rose-500' },
                    { label: 'Packets dropped', value: totals.blockedHits.toLocaleString(), color: 'text-amber-600' },
                    { label: 'Packets accepted', value: totals.allowedHits.toLocaleString(), color: 'text-teal-600' },
                  ].map(x => (
                    <div key={x.label} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-400 truncate">{x.label}</span>
                      <span className={`text-sm font-black ${x.color} shrink-0`}>{x.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/50">
                  <p className="text-[10px] text-slate-300">
                    Select a list to add or remove addresses and to preview the exact firewall rules the controller pushes.
                  </p>
                </div>
              </div>
            )}

            {/* RouterOS preview */}
            {selected && (
              <div className="glass-card p-4 sm:p-5">
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Terminal size={10} /> RouterOS preview
                </p>
                <div className="bg-slate-800 border border-slate-200/50 rounded-lg p-2.5 max-h-56 overflow-y-auto no-scrollbar">
                  {routerOsAclCommands(selected).map((cmd, i) => (
                    <p key={i} className="text-[10px] font-mono text-emerald-400/80 leading-relaxed break-all">
                      {cmd}
                    </p>
                  ))}
                </div>
                <p className="text-[10px] text-slate-300 mt-2">
                  {selected.entries.length} rule{selected.entries.length !== 1 ? 's' : ''} in the{' '}
                  <span className="font-mono text-slate-400">{ACL_SCOPE_META[selected.scope].chain}</span> chain ·
                  action <span className="font-mono text-slate-400">{selected.kind === 'whitelist' ? 'accept' : 'drop'}</span>
                </p>
              </div>
            )}

            {/* Command log */}
            {log.length > 0 && (
              <div className="glass-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Terminal size={10} /> Rule log
                  </p>
                  <button
                    onClick={() => setLog([])}
                    className="text-[10px] text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="bg-slate-800 border border-slate-200/50 rounded-lg p-2.5 max-h-48 overflow-y-auto no-scrollbar">
                  {log.map((l, i) => (
                    <p
                      key={i}
                      className={`text-[10px] font-mono leading-relaxed break-all ${
                        l.startsWith('!') ? 'text-rose-500' : 'text-emerald-400/80'
                      }`}
                    >
                      {l}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Cross links */}
            <div className="glass-card p-4 sm:p-5">
              <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Zap size={10} /> Related
              </p>
              <div className="space-y-1">
                <Link
                  href="/hotspots"
                  className="flex items-center justify-between gap-2 text-xs text-teal-600 hover:text-teal-500 transition-colors py-1"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Radio size={12} className="shrink-0" />
                    <span className="truncate">Hotspot AP management</span>
                  </span>
                  <ChevronRight size={13} className="shrink-0" />
                </Link>
                <Link
                  href="/sdwan"
                  className="flex items-center justify-between gap-2 text-xs text-violet-600 hover:text-violet-500 transition-colors py-1"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Globe size={12} className="shrink-0" />
                    <span className="truncate">SD-WAN policy routing</span>
                  </span>
                  <ChevronRight size={13} className="shrink-0" />
                </Link>
                <Link
                  href="/audit-log"
                  className="flex items-center justify-between gap-2 text-xs text-teal-600 hover:text-teal-500 transition-colors py-1"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Activity size={12} className="shrink-0" />
                    <span className="truncate">Audit log</span>
                  </span>
                  <ChevronRight size={13} className="shrink-0" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

/* ── Add-address form ─────────────────────────────────────────────────────── */

function AddEntryCard({
  list,
  busy,
  onAdd,
}: {
  list: LocalList;
  busy: boolean;
  onAdd: (cidr: string, comment: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [cidr, setCidr] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await onAdd(cidr, comment);
    if (res.ok) {
      setCidr('');
      setComment('');
    } else {
      setError(res.error ?? 'Could not add the address');
    }
  };

  const km = KIND_META[list.kind];

  return (
    <form onSubmit={submit} className="glass-card p-4 sm:p-5">
      <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <Plus size={10} /> Add address to {list.name}
      </p>

      <label className="block mb-2">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest">IPv4 address or CIDR</span>
        <input
          type="text"
          value={cidr}
          onChange={e => { setCidr(e.target.value); setError(null); }}
          placeholder="203.0.113.24 or 198.51.100.0/24"
          className="mt-1 w-full bg-slate-100 border border-slate-200/60 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-300"
        />
      </label>

      <label className="block mb-3">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest">Comment</span>
        <input
          type="text"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Why is this address allowed or blocked?"
          className="mt-1 w-full bg-slate-100 border border-slate-200/60 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-300"
        />
      </label>

      {error && (
        <p className="flex items-start gap-1.5 text-[11px] text-rose-500 mb-3">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          <span className="min-w-0">{error}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={busy || cidr.trim() === ''}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500/25"
      >
        {list.kind === 'whitelist' ? <ShieldCheck size={14} /> : <Ban size={14} />}
        {list.kind === 'whitelist' ? 'Allow address' : 'Block address'}
      </button>

      <p className="text-[10px] text-slate-300 mt-3">
        A single host is stored as <span className="font-mono text-slate-400">/32</span>. The rule is applied to the{' '}
        <span className="font-mono text-slate-400">{ACL_SCOPE_META[list.scope].chain}</span> chain with action{' '}
        <span className="font-mono text-slate-400">{list.kind === 'whitelist' ? 'accept' : 'drop'}</span>.
      </p>

      <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center gap-2">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${km.bg} ${km.color} border ${km.border}`}>
          {km.label}
        </span>
        <span className="text-[10px] text-slate-400 truncate">
          {list.entries.length} entr{list.entries.length !== 1 ? 'ies' : 'y'} · {list.siteCode}
        </span>
      </div>
    </form>
  );
}
