'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  SITES, OVERLAYS, type Site, type Uplink, type SiteStatus,
} from '@/lib/network';

/**
 * Geospatial WAN topology map.
 *
 * Sites are projected onto the canvas using an equirectangular projection of
 * their lat/lon, then edges are drawn between:
 *   • hub → spoke   (WireGuard overlay membership)
 *   • POP → POP     (transit peering)
 *
 * A site ring is split into arcs, one per WAN uplink, where the arc colour
 * encodes the uplink type and the arc length encodes contracted capacity —
 * the same "signal mixer" idea the rest of the app uses, applied to circuits.
 */

const W = 1000;
const H = 560;

interface Props {
  selectedSiteId?: string | null;
  onSelectSite?: (site: Site) => void;
  focusOverlayId?: string | null;
  showUplinks?: boolean;
  /** Restrict the map to these site ids (e.g. a region filter). */
  visibleSiteIds?: string[] | null;
  className?: string;
}

// ── Projection ─────────────────────────────────────────────────────────────

/**
 * Equirectangular projection fitted to the actual extent of the fleet, so
 * the map always fills the canvas regardless of where the sites are.
 */
function makeProjection(sites: Site[]) {
  const lats = sites.map(s => s.lat);
  const lons = sites.map(s => s.lon);

  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLon = Math.min(...lons);
  let maxLon = Math.max(...lons);

  // Guard against a degenerate single-site / single-axis fleet.
  const latSpan = Math.max(maxLat - minLat, 0.5);
  const lonSpan = Math.max(maxLon - minLon, 0.5);
  minLat -= latSpan * 0.1;
  maxLat += latSpan * 0.1;
  minLon -= lonSpan * 0.1;
  maxLon += lonSpan * 0.1;

  const midLat = (minLat + maxLat) / 2;

  // Longitude degrees shrink with latitude — correct for it so the map keeps
  // true proportions instead of looking stretched east–west.
  const kx = Math.max(Math.cos((midLat * Math.PI) / 180), 0.2);

  const geoW = (maxLon - minLon) * kx;
  const geoH = maxLat - minLat;

  const PAD_X = 80;
  const PAD_TOP = 58;
  const PAD_BOTTOM = 68;

  const usableW = W - PAD_X * 2;
  const usableH = H - PAD_TOP - PAD_BOTTOM;

  // Fit preserving aspect, then relax the fit (up to a cap) so the fleet
  // fills the canvas instead of floating in the middle of it.
  const geoAspect = geoW / geoH;
  const boxAspect = usableW / usableH;

  let w: number;
  let h: number;
  if (geoAspect > boxAspect) {
    w = usableW;
    h = usableW / geoAspect;
  } else {
    h = usableH;
    w = usableH * geoAspect;
  }

  // Relax toward a full-bleed fit, capped so geography never distorts badly.
  const MAX_STRETCH = 1.7;
  if (w < usableW) {
    const stretch = Math.min(MAX_STRETCH, usableW / w);
    w *= stretch;
  }
  if (h < usableH) {
    const stretch = Math.min(MAX_STRETCH, usableH / h);
    h *= stretch;
  }

  const offsetX = (W - w) / 2;
  const offsetY = PAD_TOP + (usableH - h) / 2;

  return (lat: number, lon: number) => ({
    x: offsetX + (((lon - minLon) * kx) / geoW) * w,
    y: offsetY + ((maxLat - lat) / (maxLat - minLat)) * h,
  });
}

function statusColor(s: SiteStatus) {
  switch (s) {
    case 'online':      return '#10b981';
    case 'degraded':    return '#f59e0b';
    case 'offline':     return '#ef4444';
    case 'maintenance': return '#94a3b8';
  }
}

function uplinkArcColor(u: Uplink) {
  if (u.state === 'down') return '#ef4444';
  if (u.state === 'degraded') return '#f59e0b';
  switch (u.type) {
    case 'fiber':     return '#3b82f6';
    case 'ethernet':  return '#8b5cf6';
    case 'dsl':       return '#f59e0b';
    case 'lte':       return '#10b981';
    case '5g':        return '#06b6d4';
    case 'satellite': return '#ec4899';
    case 'starlink':  return '#a3e635';
    case 'backup':    return '#94a3b8';
  }
}

/** Largest contracted capacity in the fleet — used to scale the arcs. */
const MAX_CAPACITY = Math.max(
  ...SITES.flatMap(s => s.uplinks.map(u => u.downMbps)),
  1,
);

/** Node radius scales with contracted capacity, clamped to stay readable. */
function nodeRadius(site: Site): number {
  return 7 + Math.min(site.contractedMbps / 260, 9);
}

/**
 * Push apart nodes that project onto nearly the same point (real branches
 * often sit within a few km of each other). Deterministic, so server and
 * client agree.
 */
function declutter(
  positions: Map<string, { x: number; y: number }>,
  sites: Site[],
): Map<string, { x: number; y: number }> {
  const out = new Map(positions);
  const MIN_GAP = 34;
  const MARGIN = 28;

  for (let pass = 0; pass < 24; pass++) {
    let moved = false;
    for (let i = 0; i < sites.length; i++) {
      for (let j = i + 1; j < sites.length; j++) {
        const a = out.get(sites[i].id)!;
        const b = out.get(sites[j].id)!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const need = MIN_GAP + nodeRadius(sites[i]) + nodeRadius(sites[j]);

        if (dist < need) {
          const ux = dist < 0.001 ? 1 : dx / dist;
          const uy = dist < 0.001 ? 0 : dy / dist;
          const push = (need - dist) / 2;
          out.set(sites[i].id, { x: a.x - ux * push, y: a.y - uy * push });
          out.set(sites[j].id, { x: b.x + ux * push, y: b.y + uy * push });
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  // Keep every node (and its label) inside the canvas.
  for (const site of sites) {
    const p = out.get(site.id)!;
    const r = nodeRadius(site);
    out.set(site.id, {
      x: Math.min(Math.max(p.x, MARGIN + r), W - MARGIN - r),
      y: Math.min(Math.max(p.y, MARGIN + r), H - MARGIN - r - 14),
    });
  }

  return out;
}

export function TopologyMap({
  selectedSiteId,
  onSelectSite,
  focusOverlayId,
  showUplinks = true,
  visibleSiteIds = null,
  className = '',
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{ from: string; to: string } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Pan / zoom handlers ──────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.5, Math.min(3, z + delta)));
  }, []);

  /** Sites actually drawn — the whole fleet, or a filtered subset. */
  const visibleSites = useMemo(() => {
    if (!visibleSiteIds) return SITES;
    const keep = new Set(visibleSiteIds);
    return SITES.filter(s => keep.has(s.id));
  }, [visibleSiteIds]);

  const visibleKey = visibleSites.map(s => s.id).join('|');

  const positions = useMemo(() => {
    const project = makeProjection(visibleSites);
    const raw = new Map<string, { x: number; y: number }>();
    for (const s of visibleSites) raw.set(s.id, project(s.lat, s.lon));
    return declutter(raw, visibleSites);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKey]);

  /** Overlay membership determines which edges are drawn. */
  const edges = useMemo(() => {
    const out: Array<{ from: string; to: string; overlayId: string; degraded: boolean }> = [];
    const overlay = focusOverlayId
      ? OVERLAYS.find(o => o.id === focusOverlayId)
      : OVERLAYS[0];

    if (!overlay) return out;

    const members = new Set(overlay.memberSiteIds);
    const shown = new Set(visibleSites.map(s => s.id));
    for (const site of visibleSites) {
      if (!members.has(site.id)) continue;
      if (site.id === overlay.hubSiteId) continue;
      // Only draw an edge when both ends are on screen.
      if (!shown.has(overlay.hubSiteId)) continue;
      out.push({
        from: overlay.hubSiteId,
        to: site.id,
        overlayId: overlay.id,
        degraded: overlay.status === 'degraded' || site.status === 'degraded',
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusOverlayId, visibleKey]);

  const activeId = hovered ?? selectedSiteId ?? null;

  /** A site is "dimmed" when another site is selected and they aren't linked. */
  const isDimmed = (siteId: string) => {
    if (!activeId) return false;
    if (siteId === activeId) return false;
    return !edges.some(e => e.from === siteId || e.to === siteId);
  };

  const totalCapacity = visibleSites.reduce((s, site) => s + site.contractedMbps, 0);

  // Compute viewBox string from zoom + pan for the minimap
  const vbX = -pan.x / zoom;
  const vbY = -pan.y / zoom;
  const vbW = W / zoom;
  const vbH = H / zoom;

  return (
    <div className={`relative ${className}`}>
      {/* ── Zoom controls ── */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
        <button
          onClick={() => setZoom(z => Math.min(3, z + 0.2))}
          className="w-8 h-8 glass-card rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-500/10 text-sm font-bold"
        >
          +
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
          className="w-8 h-8 glass-card rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-500/10 text-sm font-bold"
        >
          −
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="w-8 h-8 glass-card rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-500/10 text-[10px] font-bold"
        >
          ⟲
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={`w-full h-auto select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        role="img"
        aria-label="WAN topology map"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#99f6e4" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#f0f7f4" stopOpacity="0" />
          </radialGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeOpacity="0.08" strokeWidth="1" />
          </pattern>
          <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={W} height={H} fill="url(#mapGlow)" />
        <rect width={W} height={H} fill="url(#grid)" />

        {/* ── Zoom / pan container ── */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

        {/* ── Overlay links ── */}
        {edges.map((e, i) => {
          const a = positions.get(e.from);
          const b = positions.get(e.to);
          if (!a || !b) return null;

          const related = !activeId || e.from === activeId || e.to === activeId;
          const color = e.degraded ? '#f59e0b' : '#3b82f6';

          // Curved path so overlapping links stay readable.
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const offset = 18;
          const cx = mx - (dy / len) * offset;
          const cy = my + (dx / len) * offset;

          return (
            <g key={`${e.from}-${e.to}-${i}`} opacity={related ? 1 : 0.12}>
              {/* Invisible wider hit area for hover */}
              <path
                d={`M ${a.x},${a.y} Q ${cx},${cy} ${b.x},${b.y}`}
                fill="none"
                stroke="transparent"
                strokeWidth={12}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(ev) => {
                  setHoveredEdge({ from: e.from, to: e.to });
                  setTooltipPos({ x: ev.nativeEvent.offsetX, y: ev.nativeEvent.offsetY });
                }}
                onMouseLeave={() => setHoveredEdge(null)}
              />
              <path
                d={`M ${a.x},${a.y} Q ${cx},${cy} ${b.x},${b.y}`}
                fill="none"
                stroke={color}
                strokeOpacity={e.degraded ? 0.25 : 0.3}
                strokeWidth={1.5}
                strokeDasharray={e.degraded ? '5 5' : 'none'}
                pointerEvents="none"
              />
              {/* Animated packet along the link */}
              <motion.circle
                r={2.4}
                fill={color}
                initial={{ cx: a.x, cy: a.y, opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: 'linear',
                }}
              >
                <animateMotion
                  dur="2.4s"
                  repeatCount="indefinite"
                  begin={`${i * 0.18}s`}
                  path={`M ${a.x},${a.y} Q ${cx},${cy} ${b.x},${b.y}`}
                />
              </motion.circle>
            </g>
          );
        })}

        {/* ── Sites ── */}
        {visibleSites.map(site => {
          const p = positions.get(site.id)!;
          const dim = isDimmed(site.id);
          const isActive = activeId === site.id;
          const c = statusColor(site.status);
          const isHub = OVERLAYS.some(o => o.hubSiteId === site.id);
          const r = nodeRadius(site);

          return (
            <g
              key={site.id}
              opacity={dim ? 0.25 : 1}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                setHovered(site.id);
                setHoveredNode(site.id);
                setTooltipPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
              }}
              onMouseLeave={() => {
                setHovered(null);
                setHoveredNode(null);
              }}
              onClick={() => onSelectSite?.(site)}
            >
              {/* Selection halo — larger ring with glow when selected */}
              {isActive && (
                <>
                  <circle cx={p.x} cy={p.y} r={r + 20} fill="none" stroke={c} strokeOpacity="0.15" strokeWidth="2.5" />
                  <circle cx={p.x} cy={p.y} r={r + 14} fill="none" stroke={c} strokeOpacity="0.4" strokeWidth="1.5" filter="url(#nodeGlow)">
                    <animate attributeName="r" values={`${r + 9};${r + 18};${r + 9}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.5;0.05;0.5" dur="2s" repeatCount="indefinite" />
                  </circle>
                </>
              )}

              {/* Hub badge */}
              {isHub && (
                <g transform={`translate(${p.x + r + 2}, ${p.y - r - 2})`}>
                  <circle r="8" fill="#14b8a6" fillOpacity="0.2" stroke="#14b8a6" strokeWidth="1" />
                  <text textAnchor="middle" dy="3" fontSize="9" fill="#0d9488" fontWeight="700">H</text>
                </g>
              )}

              {/* Uplink arcs — one per WAN circuit */}
              {showUplinks &&
                site.uplinks.map((u, i) => {
                  const total = site.uplinks.length;
                  const sweep = 300 / total;
                  const start = -150 + i * sweep + sweep * 0.15;
                  const end = start + sweep * 0.7;
                  const capScale = 0.35 + (u.downMbps / MAX_CAPACITY) * 0.65;
                  const rad = r + 5 + (1 - capScale) * 7;
                  const mid = ((start + end) / 2) * (Math.PI / 180);
                  const sx = p.x + Math.cos(mid - (Math.PI / 180) * (sweep * 0.35)) * rad;
                  const sy = p.y + Math.sin(mid - (Math.PI / 180) * (sweep * 0.35)) * rad;
                  const ex = p.x + Math.cos(mid + (Math.PI / 180) * (sweep * 0.35)) * rad;
                  const ey = p.y + Math.sin(mid + (Math.PI / 180) * (sweep * 0.35)) * rad;
                  const large = sweep * 0.7 > 180 ? 1 : 0;
                  const color = uplinkArcColor(u);

                  return (
                    <path
                      key={u.id}
                      d={`M ${sx},${sy} A ${rad},${rad} 0 ${large} 1 ${ex},${ey}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={u.state === 'active' ? 3.2 : 1.8}
                      strokeOpacity={u.state === 'active' ? 0.95 : 0.5}
                      strokeLinecap="round"
                      strokeDasharray={u.state === 'down' ? '3 3' : 'none'}
                    />
                  );
                })}

              {/* Node */}
              <circle cx={p.x} cy={p.y} r={r} fill="#ffffff" stroke={c} strokeWidth="2" filter={isActive ? 'url(#nodeGlow)' : undefined} />
              <circle cx={p.x} cy={p.y} r={r * 0.42} fill={c} fillOpacity={0.85} />
              {site.status === 'online' && (
                <circle cx={p.x} cy={p.y} r={r * 0.42} fill={c}>
                  <animate attributeName="opacity" values="0.9;0.25;0.9" dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}

              <text
                x={p.x}
                y={p.y + r + 16}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#334155"
              >
                {site.code}
              </text>
              <text
                x={p.x}
                y={p.y + r + 28}
                textAnchor="middle"
                fontSize="9.5"
                fill="#94a3b8"
              >
                {site.currentMbps} Mbps
              </text>
            </g>
          );
        })}

        </g>{/* end zoom/pan container */}

        {/* ── Minimap ── */}
        <g transform={`translate(${W - 140}, ${H - 100})`}>
          <rect x={0} y={0} width={120} height={80} rx={6} fill="#f8fafc" fillOpacity={0.85} stroke="#cbd5e1" strokeWidth={0.8} />
          {/* Full extent */}
          {visibleSites.map(site => {
            const p = positions.get(site.id)!;
            return (
              <circle
                key={`mm-${site.id}`}
                cx={(p.x / W) * 120}
                cy={(p.y / H) * 80}
                r={1.8}
                fill={statusColor(site.status)}
                fillOpacity={0.7}
              />
            );
          })}
          {/* Viewport rectangle */}
          <rect
            x={Math.max(0, (vbX / W) * 120)}
            y={Math.max(0, (vbY / H) * 80)}
            width={Math.min(120, (vbW / W) * 120)}
            height={Math.min(80, (vbH / H) * 80)}
            rx={2}
            fill="#14b8a6"
            fillOpacity={0.12}
            stroke="#14b8a6"
            strokeWidth={1}
          />
        </g>
      </svg>

      {/* ── Node tooltip ── */}
      {hoveredNode && (() => {
        const site = visibleSites.find(s => s.id === hoveredNode);
        if (!site) return null;
        return (
          <div
            className="absolute z-20 glass-card rounded-xl px-3 py-2 shadow-xl pointer-events-none text-xs"
            style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 10, minWidth: 160 }}
          >
            <p className="font-bold text-slate-800 dark:text-slate-200">{site.name}</p>
            <p className="text-slate-500 dark:text-slate-400 capitalize">{site.role} · {site.status}</p>
            <p className="text-slate-500 dark:text-slate-400">{site.contractedMbps} Mbps contracted</p>
            <p className="text-slate-500 dark:text-slate-400">{site.uplinks.length} uplink{site.uplinks.length !== 1 ? 's' : ''}</p>
          </div>
        );
      })()}

      {/* ── Edge tooltip ── */}
      {hoveredEdge && (() => {
        const fromSite = visibleSites.find(s => s.id === hoveredEdge.from);
        const toSite = visibleSites.find(s => s.id === hoveredEdge.to);
        if (!fromSite || !toSite) return null;
        const link = toSite.uplinks[0];
        return (
          <div
            className="absolute z-20 glass-card rounded-xl px-3 py-2 shadow-xl pointer-events-none text-xs"
            style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 10, minWidth: 180 }}
          >
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {fromSite.code} ↔ {toSite.code}
            </p>
            {link && (
              <>
                <p className="text-slate-500 dark:text-slate-400 capitalize">
                  {link.type} · {link.state}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  ↓ {link.downMbps} / ↑ {link.upMbps} Mbps
                </p>
              </>
            )}
            <p className="text-slate-500 dark:text-slate-400">
              {toSite.currentMbps} / {toSite.contractedMbps} Mbps utilised
            </p>
          </div>
        );
      })()}

      {/* ── Legend ── */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto flex gap-x-4 gap-y-1.5 rounded-xl border border-slate-200/60 bg-white/80 px-3 py-2 backdrop-blur-md overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">Circuits</span>
        {(['fiber', '5g', 'lte', 'starlink', 'dsl'] as const).map(t => (
          <span key={t} className="flex items-center gap-1.5 text-[10px] text-slate-500 shrink-0">
            <span
              className="h-0.5 w-4 rounded-full"
              style={{ backgroundColor: uplinkArcColor({ type: t } as Uplink) }}
            />
            {t === '5g' ? '5G' : t === 'lte' ? 'LTE' : t === 'dsl' ? 'DSL' : t}
          </span>
        ))}
      </div>

      <div className="absolute right-3 top-32 rounded-xl border border-slate-200/60 bg-white/80 px-3 py-2 backdrop-blur-md">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fleet</p>
        <p className="mt-0.5 text-sm font-black text-slate-800">
          {visibleSites.length} sites
          <span className="mx-1.5 text-slate-300">·</span>
          {(totalCapacity / 1000).toFixed(1)} Gbps
        </p>
      </div>
    </div>
  );
}
