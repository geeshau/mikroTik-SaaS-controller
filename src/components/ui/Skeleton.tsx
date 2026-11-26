'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', variant = 'rectangular', width, height }: SkeletonProps) {
  const baseClasses = 'bg-slate-200/60 dark:bg-slate-700/40 animate-pulse';
  const variantClasses = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 glass-card rounded-2xl space-y-5">
      <div className="flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <Skeleton variant="rectangular" className="w-11 h-11" />
          <div className="space-y-2">
            <Skeleton variant="text" className="w-36 h-4" />
            <Skeleton variant="text" className="w-24 h-3" />
          </div>
        </div>
        <Skeleton variant="rectangular" className="w-20 h-6 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <div className="pt-5 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-between">
        <Skeleton variant="text" className="w-16 h-3" />
        <Skeleton variant="text" className="w-24 h-3" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <Skeleton variant="text" className="w-48 h-5" />
      </div>
      <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} variant="text" className="flex-1 h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* WAN Strip skeleton */}
      <Skeleton className="h-24 w-full" />
      {/* Header skeleton */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-52 h-7" />
          <Skeleton variant="text" className="w-72 h-4" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-24 h-8 rounded-full" />
          <Skeleton className="w-24 h-8 rounded-full" />
        </div>
      </div>
      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 110 }: { height?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Skeleton variant="text" className="w-20 h-3" />
        <Skeleton variant="text" className="w-16 h-4" />
      </div>
      <Skeleton className="w-full" height={height} />
    </div>
  );
}
