import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, OrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { OrderTimeline } from './OrderTimeline';
import { TrustBadge } from './TrustBadge';
import {
  X,
  FileSpreadsheet,
  Building,
  MapPin,
  Truck,
  IndianRupee,
  Scale,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, trackingNumber?: string, notes?: string) => Promise<void>;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !order) return null;

  const handleStatusChange = async (newStatus: OrderStatus, trackingNumber?: string, notes?: string) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(order.id, newStatus, trackingNumber, notes);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
      case 'UTILIZED':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'IN_TRANSIT':
      case 'PROCESSING':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
      case 'CONFIRMED':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
      case 'CANCELLED':
        return 'bg-red-950/80 text-red-300 border-red-500/40';
      default:
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
    }
  };

  const getPaymentColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'RELEASED':
        return 'bg-emerald-950 text-emerald-300 border-emerald-500/30';
      case 'ESCROW_HELD':
        return 'bg-blue-950 text-blue-300 border-blue-500/30';
      case 'REFUNDED':
        return 'bg-red-950 text-red-300 border-red-500/30';
      default:
        return 'bg-amber-950 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-charcoal-900 border border-emerald-950/80 shadow-2xl p-6 sm:p-8 space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-emerald-950/60 pb-5">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                  {order.orderNumber}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border ${getPaymentColor(
                    order.paymentStatus
                  )}`}
                >
                  {order.paymentStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Created: {new Date(order.createdAt).toLocaleString()}</span>
                {order.trackingNumber && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-cyan-300 font-semibold">
                      Tracking: {order.trackingNumber}
                    </span>
                  </>
                )}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Supplier & Buyer Counterparty Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier Card */}
            <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950/60 space-y-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                CO2 Capture Supplier (Source)
              </span>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{order.supplierCompany.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {order.supplierCompany.industry} • {order.supplierCompany.city}, {order.supplierCompany.state || 'Gujarat'}
                  </p>
                </div>
                <TrustBadge
                  score={order.supplierCompany.trustScore}
                  isVerified={order.supplierCompany.isVerified}
                  size="sm"
                />
              </div>
            </div>

            {/* Buyer Card */}
            <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950/60 space-y-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                Procuring Enterprise (Destination)
              </span>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{order.buyerCompany.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {order.buyerCompany.industry} • {order.buyerCompany.city}, {order.buyerCompany.state || 'Gujarat'}
                  </p>
                </div>
                <TrustBadge
                  score={order.buyerCompany.trustScore}
                  isVerified={order.buyerCompany.isVerified}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Animated Fulfillment Timeline */}
          <OrderTimeline
            order={order}
            userRole={user?.role}
            userCompanyId={user?.companyId}
            onUpdateStatus={async (newStatus, trackingNumber, notes) => {
              await handleStatusChange(newStatus, trackingNumber, notes);
            }}
            isLoading={isUpdating}
          />

          {/* Technical Specs & Route Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Physical Properties */}
            <div className="p-5 rounded-2xl bg-charcoal-950 border border-emerald-950/60 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Chemical & Physical Specifications</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-charcoal-900 border border-emerald-950/40">
                  <span className="text-[10px] text-slate-400 block">Total Volume</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {(order.quantityKg / 1000).toFixed(1)} Tonnes
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                    {order.quantityKg.toLocaleString()} kg
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-charcoal-900 border border-emerald-950/40">
                  <span className="text-[10px] text-slate-400 block">Purity Rating</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {order.listing?.purityPercentage ? `${order.listing.purityPercentage}%` : '99.8%'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">GC-MS Certified</span>
                </div>

                <div className="p-2.5 rounded-xl bg-charcoal-900 border border-emerald-950/40">
                  <span className="text-[10px] text-slate-400 block">State of Matter</span>
                  <span className="font-semibold text-white">
                    {order.listing?.stateOfMatter || 'Liquid'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-charcoal-900 border border-emerald-950/40">
                  <span className="text-[10px] text-slate-400 block">Capture Technology</span>
                  <span className="font-semibold text-white truncate block">
                    {order.listing?.captureMethod || 'Post-Combustion'}
                  </span>
                </div>
              </div>
            </div>

            {/* Logistics & Route */}
            <div className="p-5 rounded-2xl bg-charcoal-950 border border-emerald-950/60 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>Logistics & Route Telemetry</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-charcoal-900 border border-emerald-950/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Transit Corridor</span>
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {order.routeDistanceKm || 190} km
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-200 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{order.supplierCompany.city || 'Dahej'} → {order.buyerCompany.city || 'Sanand'}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-charcoal-900 border border-emerald-950/40">
                  <span className="text-[10px] text-slate-400 block">Delivery Destination</span>
                  <p className="text-slate-300 font-medium mt-0.5 truncate">
                    {order.deliveryAddress || `${order.buyerCompany.address}, ${order.buyerCompany.city}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory Server-Recalculated Financial Breakdown */}
          <div className="rounded-2xl bg-charcoal-950 border border-emerald-500/30 p-5 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <IndianRupee className="w-4 h-4 text-brand-400" />
              <span>Server-Recalculated Financial Settlement Breakdown</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-300">
                <tbody className="divide-y divide-emerald-950/60">
                  <tr>
                    <td className="py-2 text-slate-400">CO2 Commodity Cost</td>
                    <td className="py-2 font-mono text-slate-400 text-right">
                      {order.quantityKg.toLocaleString()} kg × ₹{order.unitPricePerKg.toFixed(2)}/kg
                    </td>
                    <td className="py-2 font-mono font-bold text-white text-right">
                      ₹{order.totalCo2Cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-400">Logistics & Freight Transit</td>
                    <td className="py-2 font-mono text-slate-400 text-right">
                      {(order.routeDistanceKm || 190)} km corridor freight
                    </td>
                    <td className="py-2 font-mono font-bold text-white text-right">
                      ₹{order.transportCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-400">Cryogenic Handling & QA Audit Fee</td>
                    <td className="py-2 font-mono text-slate-400 text-right">Fixed standard</td>
                    <td className="py-2 font-mono font-bold text-white text-right">
                      ₹{order.handlingCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-400">Platform Clearing Fee (2.5%)</td>
                    <td className="py-2 font-mono text-slate-400 text-right">Dynamic server rate</td>
                    <td className="py-2 font-mono font-bold text-white text-right">
                      ₹{order.platformFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="bg-charcoal-900/80 font-bold">
                    <td className="py-3 px-3 text-emerald-400 text-sm">Total Landed Amount (Escrow)</td>
                    <td className="py-3 text-slate-400 text-right">All inclusive</td>
                    <td className="py-3 px-3 font-mono text-base text-brand-400 text-right">
                      ₹{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {order.notes && (
            <div className="p-3.5 rounded-xl bg-charcoal-950 border border-emerald-950/60 text-xs text-slate-400">
              <strong className="text-slate-300">Transaction Notes:</strong> {order.notes}
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end pt-2 border-t border-emerald-950/60">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Close Ledger View
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
