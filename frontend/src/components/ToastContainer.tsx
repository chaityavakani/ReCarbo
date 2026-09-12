import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Sparkles,
  Truck,
  CheckCircle2,
  X,
  Scale,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: string;
  linkUrl?: string;
  createdAt: number;
}

export const ToastContainer: React.FC = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id' | 'createdAt'>) => {
    const newToast: ToastMessage = {
      ...toast,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // max 5 toasts visible

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!socket) return;

    // Real-time socket event listeners
    const handleNotificationNew = (data: any) => {
      addToast({
        title: data.title || 'New Notification',
        message: data.message || 'You have a new update.',
        type: data.type || 'SYSTEM_ALERT',
        linkUrl: data.linkUrl,
      });
    };

    const handleOrderStatus = (data: any) => {
      addToast({
        title: `Order Updated: ${data.orderNumber || ''}`,
        message: `Status moved to ${data.status}`,
        type: 'ORDER_STATUS_CHANGED',
        linkUrl: '/orders',
      });
    };

    const handleQuoteSubmitted = (data: any) => {
      addToast({
        title: 'New RFQ Quote Submitted',
        message: `${data.buyerCompany?.name || 'A buyer'} submitted an offer of ${((data.offeredQuantityKg || 0) / 1000).toFixed(1)} Tonnes @ ₹${data.offeredPricePerKg}/kg`,
        type: 'QUOTE_RECEIVED',
        linkUrl: '/quote-requests',
      });
    };

    const handleAllocationResolved = (data: any) => {
      addToast({
        title: 'RFQ Allocation Resolved',
        message: `Allocation completed: ${data.totalAllocatedKg ? (data.totalAllocatedKg / 1000).toFixed(1) : ''} Tonnes assigned to winners.`,
        type: 'QUOTE_ACCEPTED',
        linkUrl: '/orders',
      });
    };

    socket.on('notification:new', handleNotificationNew);
    socket.on('order:status_changed', handleOrderStatus);
    socket.on('quote:submitted', handleQuoteSubmitted);
    socket.on('allocation:resolved', handleAllocationResolved);

    return () => {
      socket.off('notification:new', handleNotificationNew);
      socket.off('order:status_changed', handleOrderStatus);
      socket.off('quote:submitted', handleQuoteSubmitted);
      socket.off('allocation:resolved', handleAllocationResolved);
    };
  }, [socket]);

  const getIcon = (type?: string) => {
    switch (type) {
      case 'ORDER_STATUS_CHANGED':
      case 'ORDER_DELIVERED':
      case 'ORDER_PLACED':
        return <Truck className="w-5 h-5 text-cyan-400" />;
      case 'MATCH_FOUND':
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
      case 'QUOTE_ACCEPTED':
      case 'QUOTE_RECEIVED':
        return <Scale className="w-5 h-5 text-brand-400" />;
      case 'VERIFICATION_UPDATE':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      default:
        return <Bell className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              if (toast.linkUrl) {
                navigate(toast.linkUrl);
                removeToast(toast.id);
              }
            }}
            className="pointer-events-auto p-4 rounded-2xl bg-charcoal-900/95 backdrop-blur-md border border-emerald-500/40 shadow-2xl shadow-emerald-950/50 flex items-start space-x-3 cursor-pointer hover:border-emerald-400 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-charcoal-950 border border-emerald-950 flex items-center justify-center flex-shrink-0 mt-0.5">
              {getIcon(toast.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                  {toast.title}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeToast(toast.id);
                  }}
                  className="text-slate-400 hover:text-white ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2">
                {toast.message}
              </p>
              {toast.linkUrl && (
                <span className="text-[10px] text-brand-400 font-semibold flex items-center space-x-1 mt-1.5">
                  <span>View Details</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
