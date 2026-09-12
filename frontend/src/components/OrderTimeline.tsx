import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Order, OrderStatus, UserRole } from '../types';
import {
  Clock,
  CheckCircle2,
  PackageCheck,
  Truck,
  Building2,
  Sparkles,
  XCircle,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface OrderTimelineProps {
  order: Order;
  userRole?: UserRole;
  userCompanyId?: string | null;
  onStatusUpdated?: (updatedOrder: Order) => void;
  onUpdateStatus: (newStatus: OrderStatus, trackingNumber?: string, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

const STAGES: {
  status: OrderStatus;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    status: 'PENDING',
    label: 'Order Placement',
    shortLabel: 'Pending',
    icon: Clock,
    description: 'Order placed, awaiting initial confirmation',
  },
  {
    status: 'CONFIRMED',
    label: 'Confirmed & Escrow Held',
    shortLabel: 'Confirmed',
    icon: ShieldCheck,
    description: 'Commercial terms verified and escrow payment reserved',
  },
  {
    status: 'PROCESSING',
    label: 'Cryogenic Batch Prep',
    shortLabel: 'Processing',
    icon: PackageCheck,
    description: 'Tanker pressurization, purity verification & logistics staging',
  },
  {
    status: 'IN_TRANSIT',
    label: 'Dispatched In-Transit',
    shortLabel: 'In-Transit',
    icon: Truck,
    description: 'En route to receiving facility with active telemetry',
  },
  {
    status: 'DELIVERED',
    label: 'Delivered & Accepted',
    shortLabel: 'Delivered',
    icon: Building2,
    description: 'Offloaded at receiving bay; escrow released to supplier',
  },
  {
    status: 'UTILIZED',
    label: 'Productive Circular Reuse',
    shortLabel: 'Utilized',
    icon: Sparkles,
    description: 'Permanently sequestered or utilized in manufacturing',
  },
];

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  order,
  userRole,
  userCompanyId,
  onUpdateStatus,
  isLoading = false,
}) => {
  const [trackingInput, setTrackingInput] = useState(order.trackingNumber || '');
  const [notesInput, setNotesInput] = useState('');
  const [showInputModal, setShowInputModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCancelled = order.status === 'CANCELLED';

  const getStageIndex = (status: OrderStatus) => {
    return STAGES.findIndex((s) => s.status === status);
  };

  const currentIndex = getStageIndex(order.status);

  const handleActionClick = (status: OrderStatus) => {
    setErrorMsg(null);
    if (status === 'IN_TRANSIT' && !order.trackingNumber) {
      setTargetStatus(status);
      setShowInputModal(true);
    } else {
      executeStatusUpdate(status);
    }
  };

  const executeStatusUpdate = async (status: OrderStatus, tracking?: string, notes?: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onUpdateStatus(status, tracking || trackingInput, notes || notesInput);
      setShowInputModal(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine allowed next step buttons based on user role and current status
  const isSupplier = userRole === 'SUPPLIER' || (userCompanyId && userCompanyId === order.supplierCompanyId);
  const isBuyer = userRole === 'BUYER' || (userCompanyId && userCompanyId === order.buyerCompanyId);
  const isAdmin = userRole === 'ADMIN';

  let nextAction: { status: OrderStatus; label: string; icon: React.ElementType } | null = null;
  if (!isCancelled) {
    if ((isSupplier || isAdmin) && order.status === 'CONFIRMED') {
      nextAction = { status: 'PROCESSING', label: 'Start Cryogenic Processing', icon: PackageCheck };
    } else if ((isSupplier || isAdmin) && order.status === 'PROCESSING') {
      nextAction = { status: 'IN_TRANSIT', label: 'Dispatch & Mark In-Transit', icon: Truck };
    } else if ((isBuyer || isAdmin) && order.status === 'IN_TRANSIT') {
      nextAction = { status: 'DELIVERED', label: 'Confirm Delivery Received', icon: CheckCircle2 };
    } else if ((isBuyer || isAdmin) && order.status === 'DELIVERED') {
      nextAction = { status: 'UTILIZED', label: 'Verify CO2 Utilization', icon: Sparkles };
    }
  }

  return (
    <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-950/60 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <span>Fulfillment Lifecycle Timeline</span>
            {isCancelled && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-950/80 text-red-300 border border-red-500/40">
                Cancelled
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time stage tracking with cryptographic escrow verification
          </p>
        </div>

        {/* Live Active Stage Badge */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <span className="text-[11px] text-slate-400 font-medium">Active Stage:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
              isCancelled
                ? 'bg-red-950 text-red-300 border-red-500/40'
                : order.status === 'UTILIZED'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Animated Timeline Progression */}
      <div className="relative pt-2 pb-4">
        {/* Progress connecting line */}
        <div className="hidden lg:block absolute top-1/2 left-6 right-6 -translate-y-4 h-1 bg-charcoal-800 rounded-full z-0">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-brand-400 rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${isCancelled ? 0 : Math.max(0, (currentIndex / (STAGES.length - 1)) * 100)}%`,
            }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        </div>

        {/* Stages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 relative z-10">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isPassed = !isCancelled && idx < currentIndex;
            const isCurrent = !isCancelled && idx === currentIndex;
            const isFuture = isCancelled || idx > currentIndex;

            return (
              <motion.div
                key={stage.status}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center text-center relative ${
                  isCurrent
                    ? 'bg-gradient-to-b from-charcoal-850 to-charcoal-900 border-emerald-400 shadow-lg shadow-emerald-950/40'
                    : isPassed
                    ? 'bg-charcoal-950/80 border-emerald-900/60 text-slate-300'
                    : 'bg-charcoal-950/40 border-emerald-950/40 text-slate-500'
                }`}
              >
                {/* Step Circle Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all ${
                    isCurrent
                      ? 'bg-emerald-500 text-charcoal-950 font-bold shadow-md shadow-emerald-500/30'
                      : isPassed
                      ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                      : 'bg-charcoal-900 border border-slate-800 text-slate-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                </div>

                <span
                  className={`text-xs font-bold leading-tight ${
                    isCurrent ? 'text-white' : isPassed ? 'text-slate-200' : 'text-slate-500'
                  }`}
                >
                  {stage.shortLabel}
                </span>

                <span className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2 hidden sm:block">
                  {stage.description}
                </span>

                {isCurrent && (
                  <motion.span
                    layoutId="active-dot"
                    className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shadow-sm shadow-emerald-400"
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Role-Gated Interactive Action Controls */}
      {nextAction && (
        <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              Authorized Action: <strong className="text-white">{userRole}</strong> can advance order to next stage.
            </span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              disabled={isLoading || isSubmitting}
              onClick={() => handleActionClick(nextAction!.status)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 text-charcoal-950 font-extrabold text-xs shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <nextAction.icon className="w-4 h-4" />
              )}
              <span>{nextAction.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tracking Number Input Modal for In-Transit Transition */}
      {showInputModal && (
        <div className="p-4 rounded-2xl bg-charcoal-950 border border-cyan-500/40 space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Dispatch Details for In-Transit Shipment
            </h4>
            <button
              onClick={() => setShowInputModal(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Tanker / Dispatch Tracking ID
              </label>
              <input
                type="text"
                placeholder="e.g. TRK-GUJ-88214"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-charcoal-900 border border-cyan-950 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Dispatch Note / Gate Pass Ref
              </label>
              <input
                type="text"
                placeholder="e.g. Cryo tanker inspected & seal attached"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-charcoal-900 border border-cyan-950 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setShowInputModal(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-xs hover:bg-charcoal-900"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              onClick={() => executeStatusUpdate(targetStatus || 'IN_TRANSIT')}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-charcoal-950 font-bold text-xs"
            >
              {isSubmitting ? 'Confirming Dispatch...' : 'Confirm Dispatch & Start Transit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
