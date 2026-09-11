import React, { ReactNode } from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  actionLink?: string;
  onActionClick?: () => void;
  customAction?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  actionLink,
  onActionClick,
  customAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-charcoal-900/60 border border-emerald-950/60 max-w-lg mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-emerald-950/50 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
        <Icon className="w-7 h-7 stroke-[1.75]" />
      </div>

      <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-400 max-w-sm leading-relaxed">{description}</p>

      <div className="mt-6 flex items-center space-x-3">
        {customAction}
        {actionText && actionLink && (
          <Link
            to={actionLink}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-charcoal-950 font-semibold text-xs transition-all shadow-md shadow-brand-500/20"
          >
            {actionText}
          </Link>
        )}
        {actionText && onActionClick && !actionLink && (
          <button
            onClick={onActionClick}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-charcoal-950 font-semibold text-xs transition-all shadow-md shadow-brand-500/20"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};
