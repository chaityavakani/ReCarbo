import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`animate-pulse rounded-lg bg-charcoal-800/80 border border-emerald-950/30 ${className}`}
    />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="rounded-2xl bg-charcoal-900 border border-emerald-950/60 p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-36" />
      <div className="pt-2 border-t border-emerald-950/40 flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 rounded-xl bg-charcoal-900/60 border border-emerald-950/40 animate-pulse"
        >
          <Skeleton className="h-5 w-5 rounded-md" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/5 ml-auto" />
        </div>
      ))}
    </div>
  );
};
