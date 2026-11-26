'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Zap, Terminal } from 'lucide-react';
import { isDemoMode } from '@/lib/supabase';

interface ProvisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}

export const ProvisionModal = ({ isOpen, onClose, orgId }: ProvisionModalProps) => {
  const [routerName, setRouterName] = useState('');
  const [script, setScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleProvision = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        // Mock the API response for the demo
        await new Promise(resolve => setTimeout(resolve, 1500));
        setScript(`/interface wireguard add listen-port=13231 name=wg-vortex mt=1420\n/interface wireguard peers add allowed-address=0.0.0.0/0 endpoint-address=demo.vortex.com endpoint-port=51820 interface=wg-vortex public-key="demo_pub_key="\n/ip address add address=10.0.0.2/24 interface=wg-vortex`);
        return;
      }

      const response = await fetch('/api/tunnel/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, routerName }),
      });
      const data = await response.json();
      if (data.script) {
        setScript(data.script);
      }
    } catch (error) {
      console.error('Provisioning failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-200/50 flex justify-between items-center bg-teal-50/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <Zap size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Provision New Router</h3>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              {!script ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">Router Name</label>
                    <input
                      type="text"
                      value={routerName}
                      onChange={(e) => setRouterName(e.target.value)}
                      placeholder="e.g. London-Branch-GW"
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleProvision}
                    disabled={!routerName || isLoading}
                    className="w-full py-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:hover:bg-teal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Generating Script...' : 'Generate Onboarding Script'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                    <Check size={16} />
                    <span>Script Generated Successfully!</span>
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute right-4 top-4 flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="p-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg transition-all"
                        title="Copy to clipboard"
                      >
                        {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                      </button>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-6 font-mono text-sm text-teal-400 overflow-x-auto max-h-[300px] border border-slate-700 shadow-inner">
                      <div className="flex items-center gap-2 mb-4 text-slate-400 border-b border-slate-700 pb-2">
                        <Terminal size={14} />
                        <span>RouterOS Terminal Script</span>
                      </div>
                      <pre>{script}</pre>
                    </div>
                  </div>

                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                    <p className="text-sm text-teal-600 leading-relaxed">
                      <strong>Next Steps:</strong> Paste this script into your MikroTik&apos;s New Terminal. Once executed, the router will establish a secure tunnel to Vortex and appear on your dashboard.
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full py-4 bg-slate-50 hover:bg-slate-100/80 text-slate-800 font-bold rounded-xl transition-all border border-slate-200/60"
                  >
                    Close & Finish
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
