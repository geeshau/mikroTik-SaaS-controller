'use client';

import { useState } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import { RouterCard } from '@/components/dashboard/RouterCard';
import { ProvisionModal } from '@/components/dashboard/ProvisionModal';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { WanSummaryStrip } from '@/components/network/WanSummaryStrip';
import { Zap, LayoutGrid, List, Shield } from 'lucide-react';

const MOCK_ROUTERS = [
  {
    id: 'Vortex-7721',
    name: 'Main Office Gateway',
    model: 'RB5009UG+S+IN',
    status: 'online' as const,
    cpuUsage: 14,
    trafficRx: 450.5,
    trafficTx: 120.2,
    lastSeen: 'Just now',
  },
  {
    id: 'Vortex-8832',
    name: 'Warehouse Node 1',
    model: 'hAP ax3',
    status: 'online' as const,
    cpuUsage: 8,
    trafficRx: 85.2,
    trafficTx: 42.1,
    lastSeen: '2m ago',
  },
  {
    id: 'Vortex-9910',
    name: 'Guest Wi-Fi (East)',
    model: 'cap ac',
    status: 'offline' as const,
    cpuUsage: 0,
    trafficRx: 0,
    trafficTx: 0,
    lastSeen: '1h ago',
  },
];

export default function Home() {
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [orgId] = useState('org-123');

  const online  = MOCK_ROUTERS.filter(r => r.status === 'online').length;
  const offline = MOCK_ROUTERS.filter(r => r.status === 'offline').length;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <DashboardGrid>
          {{
            'wan-summary': (
              <WanSummaryStrip />
            ),
            'router-grid': (
              <>
                {/* Page header */}
                <header className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Operations Dashboard</h1>
                    <p className="text-slate-400 mt-1 text-sm">
                      Real-time status of your MikroTik infrastructure.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {/* Online / offline pills */}
                    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {online} Online
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      {offline} Offline
                    </span>

                    {/* View toggle */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                      <button
                        onClick={() => setView('grid')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          view === 'grid' ? 'bg-slate-100/80 text-slate-800' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <LayoutGrid size={13} /> Grid
                      </button>
                      <button
                        onClick={() => setView('list')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          view === 'list' ? 'bg-slate-100/80 text-slate-800' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <List size={13} /> List
                      </button>
                    </div>
                  </div>
                </header>

                {/* Router cards */}
                <section
                  className={
                    view === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
                      : 'flex flex-col gap-4'
                  }
                >
                  {MOCK_ROUTERS.map((router) => (
                    <RouterCard key={router.id} router={router} />
                  ))}

                  {/* Add Router card */}
                  <button
                    onClick={() => setIsProvisionModalOpen(true)}
                    className="h-full min-h-[240px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col
                      items-center justify-center gap-4 group hover:border-teal-300 transition-all hover:bg-teal-50/30"
                  >
                    <div className="p-4 bg-slate-100 rounded-2xl group-hover:bg-teal-50 transition-colors">
                      <Zap className="text-slate-300 group-hover:text-teal-600 transition-colors" size={28} />
                    </div>
                    <div className="text-center">
                      <span className="block text-slate-800 font-semibold">Provision New Router</span>
                      <span className="text-xs text-slate-300">Generate &quot;One-Click&quot; onboarding script</span>
                    </div>
                  </button>
                </section>
              </>
            ),
            'security-banner': (
              <section className="mt-10 p-6 glass-card border-teal-200 bg-teal-50/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shrink-0">
                    <Shield size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Zero-Exposure Security Active</h4>
                    <p className="text-sm text-slate-400 mt-0.5">
                      All routers communicate via encrypted WireGuard tunnels. Public API ports (8728/8729) are closed.
                    </p>
                  </div>
                </div>
                <button className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-800 rounded-xl text-sm font-bold transition-all shadow-lg shadow-teal-500/20 shrink-0">
                  Tunnel Health
                </button>
              </section>
            ),
          }}
        </DashboardGrid>
      </div>

      <ProvisionModal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        orgId={orgId}
      />
    </AppShell>
  );
}
