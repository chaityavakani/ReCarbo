import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { NotificationItem } from '../../types';
import { useSocket } from '../../context/SocketContext';
import { SkeletonTable } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import {
  Bell,
  CheckCheck,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Truck,
  Scale,
  Check,
  ExternalLink,
  Filter,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Real-time socket sync
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
    };

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      await handleMarkRead(n.id);
    }
    if (n.linkUrl) {
      navigate(n.linkUrl);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'ORDER_STATUS_CHANGED':
      case 'ORDER_DELIVERED':
      case 'ORDER_PLACED':
        return <Truck className="w-4 h-4 text-cyan-400" />;
      case 'MATCH_FOUND':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'QUOTE_ACCEPTED':
      case 'QUOTE_RECEIVED':
      case 'QUOTE_REJECTED':
        return <Scale className="w-4 h-4 text-brand-400" />;
      case 'VERIFICATION_UPDATE':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-400" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'UNREAD') return !n.isRead;
    if (activeTab === 'ORDERS')
      return (
        n.type === 'ORDER_PLACED' ||
        n.type === 'ORDER_STATUS_CHANGED' ||
        n.type === 'ORDER_DELIVERED'
      );
    if (activeTab === 'MATCHES')
      return (
        n.type === 'MATCH_FOUND' ||
        n.type === 'QUOTE_ACCEPTED' ||
        n.type === 'QUOTE_RECEIVED'
      );
    if (activeTab === 'SYSTEM')
      return n.type === 'SYSTEM_ALERT' || n.type === 'VERIFICATION_UPDATE';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Bell className="w-7 h-7 text-emerald-400" />
            <span>Platform Notification Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time commercial updates on matches, RFQ allocations, order dispatch telemetries, and regulatory verifications
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-charcoal-900 border border-emerald-950 hover:border-emerald-500 text-xs font-semibold text-slate-300 hover:text-white transition-all self-start sm:self-center"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'ALL', label: 'All Notifications', count: notifications.length },
          { key: 'UNREAD', label: 'Unread', count: unreadCount },
          {
            key: 'ORDERS',
            label: 'Orders & Dispatch',
            count: notifications.filter(
              (n) =>
                n.type === 'ORDER_PLACED' ||
                n.type === 'ORDER_STATUS_CHANGED' ||
                n.type === 'ORDER_DELIVERED'
            ).length,
          },
          {
            key: 'MATCHES',
            label: 'Matches & Quotes',
            count: notifications.filter(
              (n) =>
                n.type === 'MATCH_FOUND' ||
                n.type === 'QUOTE_ACCEPTED' ||
                n.type === 'QUOTE_RECEIVED'
            ).length,
          },
          {
            key: 'SYSTEM',
            label: 'System & Verification',
            count: notifications.filter(
              (n) =>
                n.type === 'SYSTEM_ALERT' || n.type === 'VERIFICATION_UPDATE'
            ).length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === tab.key
                ? 'bg-emerald-500 text-charcoal-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-charcoal-900 text-slate-400 hover:text-white border border-emerald-950/60'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.key
                  ? 'bg-charcoal-950/30 text-charcoal-950'
                  : 'bg-charcoal-950 text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <SkeletonTable rows={4} />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title="No Notifications"
          description={
            activeTab === 'UNREAD'
              ? 'You have read all pending platform updates.'
              : 'No notification records found in this category.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-5 rounded-2xl border transition-all flex items-start space-x-4 cursor-pointer group hover:border-emerald-400 ${
                n.isRead
                  ? 'bg-charcoal-900/60 border-emerald-950/40 text-slate-400'
                  : 'bg-charcoal-900 border-emerald-500/40 text-slate-200 shadow-lg shadow-emerald-950/20'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  n.isRead
                    ? 'bg-charcoal-950 border border-emerald-950/60 text-slate-400'
                    : 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                }`}
              >
                {getNotifIcon(n.type)}
              </div>

              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-400" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(n.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>

                <div className="flex items-center justify-between pt-2">
                  {n.linkUrl ? (
                    <span className="text-[11px] text-brand-400 font-semibold flex items-center space-x-1 group-hover:underline">
                      <span>View related record</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  ) : (
                    <div />
                  )}

                  {!n.isRead && (
                    <button
                      onClick={(e) => handleMarkRead(n.id, e)}
                      className="text-[10px] text-slate-400 hover:text-emerald-300 flex items-center space-x-1 px-2 py-0.5 rounded-md hover:bg-charcoal-800"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark Read</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
