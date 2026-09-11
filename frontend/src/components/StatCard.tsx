import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: LucideIcon;
  variant?: 'emerald' | 'cyan' | 'amber' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = 'emerald',
}) => {
  const variantStyles = {
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      glow: 'shadow-emerald-950/20',
      iconBg: 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30',
      accent: 'text-emerald-400',
    },
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      glow: 'shadow-cyan-950/20',
      iconBg: 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30',
      accent: 'text-cyan-400',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      glow: 'shadow-amber-950/20',
      iconBg: 'bg-amber-950/80 text-amber-400 border border-amber-500/30',
      accent: 'text-amber-400',
    },
    neutral: {
      border: 'border-slate-800 hover:border-slate-700',
      glow: '',
      iconBg: 'bg-charcoal-800 text-slate-300 border border-slate-700',
      accent: 'text-slate-300',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-charcoal-900/80 backdrop-blur-md border ${style.border} p-5 shadow-lg ${style.glow} transition-all duration-200 hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
              {value}
            </span>
          </div>
        </div>

        <div className={`p-2.5 rounded-xl ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-emerald-950/40 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
