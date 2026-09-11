import React from 'react';
import { ShieldCheck, ShieldAlert, Award } from 'lucide-react';

interface TrustBadgeProps {
  score?: number;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  score = 85,
  isVerified = false,
  size = 'md',
  showScore = true,
}) => {
  const getScoreColor = (val: number) => {
    if (val >= 90) return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
    if (val >= 75) return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30';
    return 'text-amber-400 bg-amber-950/60 border-amber-500/30';
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  };

  return (
    <div className="inline-flex items-center space-x-2">
      {isVerified ? (
        <span
          className={`inline-flex items-center space-x-1 font-semibold rounded-full border bg-emerald-950/80 border-emerald-500/40 text-emerald-300 ${sizeClasses[size]}`}
          title="Verified Industrial Organization"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified</span>
        </span>
      ) : (
        <span
          className={`inline-flex items-center space-x-1 font-medium rounded-full border bg-charcoal-800 text-slate-400 border-slate-700 ${sizeClasses[size]}`}
          title="Pending Verification Review"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Unverified</span>
        </span>
      )}

      {showScore && (
        <span
          className={`inline-flex items-center space-x-1 font-mono font-bold rounded-full border ${getScoreColor(
            score
          )} ${sizeClasses[size]}`}
          title="Trust & Reliability Index"
        >
          <Award className="w-3.5 h-3.5" />
          <span>{score.toFixed(1)}/100</span>
        </span>
      )}
    </div>
  );
};
