'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { type ReactNode } from 'react';

export interface WidgetConfig {
  id: string;
  title: string;
  visible: boolean;
}

const STORAGE_KEY = 'vortex-dashboard-layout';
const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'wan-summary', title: 'WAN Summary', visible: true },
  { id: 'router-grid', title: 'Router Grid', visible: true },
  { id: 'security-banner', title: 'Security Banner', visible: true },
];

function getInitialLayout(): WidgetConfig[] {
  if (typeof window === 'undefined') return DEFAULT_WIDGETS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_WIDGETS;
}

function SortableWidget({ id, children, isEditing }: { id: string; children: ReactNode; isEditing: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg bg-white/90 dark:bg-slate-700/90 shadow-lg border border-slate-200/50 dark:border-slate-600/50 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical size={14} className="text-slate-400" />
        </div>
      )}
      {children}
    </div>
  );
}

interface DashboardGridProps {
  children: Record<string, ReactNode>;
  defaultWidgets?: WidgetConfig[];
}

export function DashboardGrid({ children, defaultWidgets }: DashboardGridProps) {
  const defaults = defaultWidgets ?? DEFAULT_WIDGETS;
  const [widgets, setWidgets] = useState<WidgetConfig[]>(defaults);
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = getInitialLayout();
    // Merge saved with defaults (handle new widgets added after save)
    const merged = defaults.map(d => {
      const found = saved.find(s => s.id === d.id);
      return found ?? d;
    });
    // Keep saved order for existing ones
    const orderedIds = saved.map(s => s.id).filter(id => defaults.some(d => d.id === id));
    const newIds = defaults.filter(d => !saved.some(s => s.id === d.id)).map(d => d.id);
    const finalOrder = [...orderedIds, ...newIds];
    const final = finalOrder.map(id => merged.find(w => w.id === id)!).filter(Boolean);
    setWidgets(final);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const saveLayout = useCallback((ws: WidgetConfig[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ws)); } catch {}
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgets(prev => {
        const oldIndex = prev.findIndex(w => w.id === active.id);
        const newIndex = prev.findIndex(w => w.id === over.id);
        const next = arrayMove(prev, oldIndex, newIndex);
        saveLayout(next);
        return next;
      });
    }
  };

  const toggleVisibility = (id: string) => {
    setWidgets(prev => {
      const next = prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
      saveLayout(next);
      return next;
    });
  };

  const resetLayout = () => {
    setWidgets(defaults);
    saveLayout(defaults);
  };

  if (!mounted) {
    // SSR: render all widgets in default order
    return <>{defaults.filter(w => w.visible).map(w => <div key={w.id}>{children[w.id]}</div>)}</>;
  }

  const visibleWidgets = widgets.filter(w => w.visible);

  return (
    <div>
      {/* Edit mode toggle */}
      <div className="flex items-center justify-end gap-2 mb-4">
        {isEditing && (
          <button
            onClick={resetLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw size={12} />
            Reset Layout
          </button>
        )}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            isEditing
              ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          {isEditing ? 'Done' : 'Customize'}
        </button>
      </div>

      {/* Widget visibility toggles */}
      {isEditing && (
        <div className="mb-4 glass-card rounded-xl p-3 flex flex-wrap gap-2">
          {widgets.map(w => (
            <button
              key={w.id}
              onClick={() => toggleVisibility(w.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                w.visible
                  ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-600/50'
              }`}
            >
              {w.visible ? <Eye size={12} /> : <EyeOff size={12} />}
              {w.title}
            </button>
          ))}
        </div>
      )}

      {/* Sortable grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="space-y-6">
            {visibleWidgets.map(w => (
              <SortableWidget key={w.id} id={w.id} isEditing={isEditing}>
                {children[w.id]}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
