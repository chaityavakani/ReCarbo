import React, { useState, useEffect } from 'react';
import { marketplaceService } from '../../services/marketplaceService';
import { NotificationItem } from '../../types';
import { SkeletonTable } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Bell, CheckCheck, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await marketplaceService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAll = async () => {
    await marketplaceService.markAllNotificationsRead();
    loadNotifications();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Bell className="w-7 h-7 text-emerald-400" />
            <span>Platform Notifications</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time updates on matches, RFQ offers, order dispatches, and verification audits
          </p>
        </div>

        <button
          onClick={handleMarkAll}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-charcoal-900 border border-emerald-950 hover:border-emerald-500 text-xs font-semibold text-slate-300 hover:text-white transition-all"
        >
          <CheckCheck className="w-4 h-4 text-emerald-400" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={4} />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No Notifications"
          description="You are completely caught up with all platform activity."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border transition-all flex items-start space-x-4 ${
                n.isRead
                  ? 'bg-charcoal-900/60 border-emerald-950/40 text-slate-400'
                  : 'bg-charcoal-900 border-emerald-500/40 text-slate-200 shadow-lg shadow-emerald-950/20'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{n.title}</h3>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
