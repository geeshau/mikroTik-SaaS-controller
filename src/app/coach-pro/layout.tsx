import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CoachPro — Football Manager Dashboard',
  description: 'Professional football manager dashboard with team statistics, standings, and match planning.',
};

/**
 * CoachPro has its own layout (light-mint pastel aesthetic)
 * that is completely independent of the dark MikroTik AppShell.
 */
export default function CoachProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef9f4] via-[#f0f7f4] to-[#e8f4f0] text-slate-800">
      {children}
    </div>
  );
}
