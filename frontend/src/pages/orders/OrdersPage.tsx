import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { OrderDetailModal } from '../../components/OrderDetailModal';
import { SkeletonTable } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { TrustBadge } from '../../components/TrustBadge';
import {
  FileSpreadsheet,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Eye,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time Socket.IO synchronization
  useEffect(() => {
    if (!socket) return;

    const handleOrderStatusChanged = (data: { orderId: string; status: OrderStatus; updatedOrder?: Order }) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === data.orderId) {
            return data.updatedOrder || { ...o, status: data.status };
          }
          return o;
        })
      );
      if (selectedOrder && selectedOrder.id === data.orderId) {
        setSelectedOrder((prev) => (prev ? (data.updatedOrder || { ...prev, status: data.status }) : null));
      }
    };

    const handleOrderCreated = (newOrder: Order) => {
      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    };

    socket.on('order:status_changed', handleOrderStatusChanged);
    socket.on('order:created', handleOrderCreated);
    socket.on('order:delivered', handleOrderStatusChanged);

    return () => {
      socket.off('order:status_changed', handleOrderStatusChanged);
      socket.off('order:created', handleOrderCreated);
      socket.off('order:delivered', handleOrderStatusChanged);
    };
  }, [socket, selectedOrder]);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    trackingNumber?: string,
    notes?: string
  ) => {
    const updated = await orderService.updateStatus(orderId, newStatus, trackingNumber, notes);
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSelectedOrder(updated);
  };

  // Filtering
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      selectedStatusTab === 'ALL' || o.status === selectedStatusTab;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyerCompany.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.supplierCompany.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
      case 'PROCESSING':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
      case 'IN_TRANSIT':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40';
      case 'DELIVERED':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'UTILIZED':
        return 'bg-emerald-900 text-emerald-200 border-emerald-400 shadow-sm shadow-emerald-500/30';
      case 'CANCELLED':
        return 'bg-red-950/80 text-red-300 border-red-500/40';
      default:
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
    }
  };

  const statusTabs = [
    { key: 'ALL', label: 'All Orders' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'IN_TRANSIT', label: 'In-Transit' },
    { key: 'DELIVERED', label: 'Delivered' },
    { key: 'UTILIZED', label: 'Utilized' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
            <span>Orders & Delivery Ledger</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            End-to-end commercial CO2 procurement orders, cryogenic telemetry, escrow status, and utilization verification
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-charcoal-900 border border-emerald-950 hover:border-emerald-500 text-xs font-semibold text-slate-300 hover:text-white transition-all self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Ledger</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {statusTabs.map((tab) => {
            const count =
              tab.key === 'ALL'
                ? orders.length
                : orders.filter((o) => o.status === tab.key).length;

            return (
              <button
                key={tab.key}
                onClick={() => setSelectedStatusTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  selectedStatusTab === tab.key
                    ? 'bg-emerald-500 text-charcoal-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'bg-charcoal-900 text-slate-400 hover:text-white border border-emerald-950/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedStatusTab === tab.key
                      ? 'bg-charcoal-950/30 text-charcoal-950'
                      : 'bg-charcoal-950 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ref, buyer, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-charcoal-900 border border-emerald-950/80 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Orders Table Ledger */}
      <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={5} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Orders Found"
              description={
                searchQuery || selectedStatusTab !== 'ALL'
                  ? 'No orders match your active filter criteria.'
                  : 'You do not have any CO2 transaction orders yet. Place a quote or create a listing to begin.'
              }
              actionText="Explore Marketplace"
              actionLink="/marketplace"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-charcoal-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-emerald-950/60">
                <tr>
                  <th className="p-4">Order Ref</th>
                  <th className="p-4">Counterparties</th>
                  <th className="p-4">CO2 Volume</th>
                  <th className="p-4">Total Amount (₹)</th>
                  <th className="p-4">Corridor Route</th>
                  <th className="p-4">Status & Escrow</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/40">
                {filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => {
                      setSelectedOrder(ord);
                      setIsModalOpen(true);
                    }}
                    className="hover:bg-charcoal-800/60 transition-colors cursor-pointer group"
                  >
                    {/* Order Ref */}
                    <td className="p-4">
                      <div className="font-mono font-bold text-cyan-400 group-hover:text-brand-300 transition-colors">
                        {ord.orderNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Counterparties */}
                    <td className="p-4">
                      <div className="font-semibold text-white truncate max-w-[200px]">
                        {ord.buyerCompany?.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        From: <span className="text-slate-300">{ord.supplierCompany?.name}</span>
                      </div>
                    </td>

                    {/* Volume */}
                    <td className="p-4">
                      <div className="font-mono font-bold text-white text-sm">
                        {(ord.quantityKg / 1000).toFixed(1)} Tonnes
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        ₹{ord.unitPricePerKg.toFixed(2)}/kg
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="p-4">
                      <div className="font-mono font-bold text-brand-400 text-sm">
                        ₹{ord.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {ord.paymentStatus.replace('_', ' ')}
                      </div>
                    </td>

                    {/* Route */}
                    <td className="p-4">
                      <div className="flex items-center space-x-1.5 text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate max-w-[140px]">
                          {ord.supplierCompany?.city || 'Dahej'} → {ord.buyerCompany?.city || 'Sanand'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {ord.routeDistanceKm ? `${ord.routeDistanceKm} km` : '190 km'} corridor
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getStatusBadge(
                          ord.status
                        )}`}
                      >
                        {ord.status}
                      </span>
                      {ord.trackingNumber && (
                        <div className="text-[10px] text-cyan-400 font-mono mt-1">
                          {ord.trackingNumber}
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(ord);
                          setIsModalOpen(true);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-charcoal-800 group-hover:bg-brand-500 group-hover:text-charcoal-950 text-slate-300 text-xs font-semibold transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal & Interactive Timeline */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};
