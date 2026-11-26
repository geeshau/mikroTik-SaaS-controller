import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Router, Activity, Shield, Wifi, Camera, Loader2, ArrowRight } from 'lucide-react';
import { VUMeter } from './VUMeter';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';
import { isDemoMode } from '@/lib/supabase';

interface RouterCardProps {
  router: {
    id: string;
    name: string;
    model: string;
    status: 'online' | 'offline';
    cpuUsage: number;
    trafficRx: number; // Mbps
    trafficTx: number; // Mbps
    lastSeen: string;
  };
}

export const RouterCard = ({ router }: RouterCardProps) => {
  const liveMetrics = useRealtimeMetrics(router.id);
  const [data, setData] = useState(router);
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);
  const [snapSaved, setSnapSaved] = useState(false);

  useEffect(() => {
    if (liveMetrics) {
      setData(prev => ({
        ...prev,
        cpuUsage:  liveMetrics.cpu_load,
        trafficRx: liveMetrics.rx_bps / 1_000_000,
        trafficTx: liveMetrics.tx_bps / 1_000_000,
        lastSeen:  'Just now',
        status:    'online',
      }));
    }
  }, [liveMetrics]);

  const isOnline = data.status === 'online';

  const takeSnapshot = async (e: React.MouseEvent) => {
    e.preventDefault(); // don't navigate via the Link wrapper
    setIsTakingSnapshot(true);
    try {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        await fetch(`/api/routers/${data.id}/snapshot`, { method: 'POST' });
      }
      setSnapSaved(true);
      setTimeout(() => setSnapSaved(false), 2000);
    } catch {
      // silently fail in demo
    } finally {
      setIsTakingSnapshot(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="p-6 bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 hover:border-slate-300
        transition-colors shadow-2xl relative group"
    >
      {/* Header row */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex gap-3 items-center">
          <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
            <Router size={22} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800 leading-tight">{data.name}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{data.model} · {data.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/50">
          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {data.status}
          </span>
        </div>
      </div>

      {/* VU Meters */}
      <div className="grid grid-cols-2 gap-4">
        <VUMeter value={data.cpuUsage} label="CPU Load" color="#ef4444" />
        <VUMeter
          value={(data.trafficRx / 1000) * 100}
          label="RX Traffic"
          unit="Gbps"
          displayValue={Number((data.trafficRx / 1000).toFixed(2))}
          color="#3b82f6"
        />
      </div>

      {/* Footer */}
      <div className="mt-5 pt-5 border-t border-slate-200/50 flex justify-between items-center">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Activity size={11} />
          <span>{data.lastSeen}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick-action buttons */}
          <button
            onClick={takeSnapshot}
            disabled={isTakingSnapshot}
            title="Take Config Snapshot"
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-40"
          >
            {isTakingSnapshot
              ? <Loader2 size={15} className="animate-spin" />
              : snapSaved
              ? <Camera size={15} className="text-emerald-600" />
              : <Camera size={15} />}
          </button>
          <button title="Security Settings"
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors">
            <Shield size={15} />
          </button>
          <button title="Wi-Fi Management"
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors">
            <Wifi size={15} />
          </button>

          {/* Detail link */}
          <Link
            href={`/routers/${data.id}`}
            title="View Details"
            className="p-1.5 text-slate-400 hover:text-teal-600 transition-colors"
          >
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
