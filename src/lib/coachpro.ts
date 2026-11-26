/**
 * CoachPro football-manager dashboard — static data & types.
 *
 * Everything here is deterministic (no Math.random) so SSR and CSR match.
 */

/* ── Types ─────────────────────────────────────────────────────────────── */

export interface StandingsRow {
  rank: number;
  team: string;
  short: string;       // badge abbreviation
  color: string;       // badge bg colour
  mp: number;
  w: number;
  d: number;
  l: number;
  g: string;           // goals (e.g. "32:8")
  pts: number;
}

export interface MetricTile {
  label: string;
  value: string;
  icon: string;        // lucide icon name
  bg: string;           // pastel badge bg (tailwind)
  fg: string;           // icon colour
}

export interface NavItem {
  label: string;
  icon: string;
  active?: boolean;
}

/* ── Sidebar nav ───────────────────────────────────────────────────────── */

export const SIDEBAR_NAV: NavItem[] = [
  { label: 'Dashboard',      icon: 'LayoutDashboard', active: true },
  { label: 'Squad',          icon: 'Users'           },
  { label: 'Messenger',      icon: 'MessageCircle'   },
  { label: 'Statistic',      icon: 'BarChart3'       },
  { label: 'Calendar',       icon: 'CalendarDays'    },
  { label: 'Finance',        icon: 'Wallet'          },
  { label: 'Transfers',      icon: 'ArrowLeftRight'  },
  { label: 'Youth academy',  icon: 'GraduationCap'   },
];

/* ── Standings (Serie A, top 6) ────────────────────────────────────────── */

export const STANDINGS: StandingsRow[] = [
  { rank: 1, team: 'Juventus',    short: 'JUV', color: '#000',    mp: 14, w: 11, d: 2, l: 1, g: '32:8',  pts: 35 },
  { rank: 2, team: 'Inter Milan', short: 'INT', color: '#0033a0', mp: 14, w: 10, d: 3, l: 1, g: '28:11', pts: 33 },
  { rank: 3, team: 'AC Milan',    short: 'ACM', color: '#c5122e', mp: 14, w: 10, d: 2, l: 2, g: '27:14', pts: 32 },
  { rank: 4, team: 'Lazio',       short: 'LAZ', color: '#87ceeb', mp: 14, w: 9,  d: 3, l: 2, g: '24:12', pts: 30 },
  { rank: 5, team: 'Napoli',      short: 'NAP', color: '#1e88e5', mp: 14, w: 8,  d: 4, l: 2, g: '22:10', pts: 28 },
  { rank: 6, team: 'Sassuolo',    short: 'SAS', color: '#00a651', mp: 14, w: 7,  d: 3, l: 4, g: '19:15', pts: 24 },
];

/* ── Game statistics ───────────────────────────────────────────────────── */

export const GAME_STATS = {
  played:    14,
  victories: 11,
  draws:      2,
  lost:       1,
};

/* ── Metric tiles ──────────────────────────────────────────────────────── */

export const METRICS: MetricTile[] = [
  { label: 'Possession',      value: '65%',      icon: 'Target',       bg: 'bg-teal-100',   fg: 'text-teal-600'   },
  { label: 'Overall Price',   value: '$690.2m',  icon: 'DollarSign',   bg: 'bg-amber-100',  fg: 'text-amber-600'  },
  { label: 'Transfer Budget', value: '$240.6m',  icon: 'CreditCard',   bg: 'bg-violet-100', fg: 'text-violet-600' },
  { label: 'Average Score',   value: '7.2',      icon: 'Star',         bg: 'bg-rose-100',   fg: 'text-rose-500'   },
];

/* ── Next match ────────────────────────────────────────────────────────── */

export const NEXT_MATCH = {
  league: 'Serie A',
  round:  'Matchday 15',
  date:   'Sunday, 1 Dec 2026 — 20:45',
  home:   { name: 'Juventus',  short: 'JUV', color: '#000'    },
  away:   { name: 'Sassuolo',  short: 'SAS', color: '#00a651' },
  venue:  'Allianz Stadium, Turin',
};
