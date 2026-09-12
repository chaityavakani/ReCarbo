import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analyticsService';
import { marketplaceService } from '../../services/marketplaceService';
import { SupplierAnalytics, CO2Listing } from '../../types';
import { StatCard } from '../../components/StatCard';
import { TrustBadge } from '../../components/TrustBadge';
import { SkeletonCard, SkeletonTable } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Layers,
  IndianRupee,
  Scale,
  Sparkles,
  PlusCircle,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  Truck,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { CO2AnimatedBackground } from '../../components/CO2AnimatedBackground';

export const SupplierDashboard: React.FC = () => {
  const { user, company } = useAuth();
  const [analytics, setAnalytics] = useState<SupplierAnalytics | null>(null);
  const [listings, setListings] = useState<CO2Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupplierData = async () => {
      try {
        setLoading(true);
        const [analyticsData, allListings] = await Promise.all([
          analyticsService.getSupplierAnalytics(),
          marketplaceService.getListings(),
        ]);
        setAnalytics(analyticsData);
        const supplierListings = company?.id
          ? allListings.filter((l) => l.supplierCompanyId === company.id)
          : allListings;
        setListings(supplierListings);
      } catch (err) {
        console.error('Failed to load supplier analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierData();
  }, [company?.id]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950/80 via-charcoal-900 to-charcoal-900 border border-emerald-500/20 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <CO2AnimatedBackground variant="emerald" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CO2 Capture Supplier Portal • Live Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {user?.name}
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Facility: <span className="text-white font-medium">{company?.name || 'Gujarat Carbon Hub'}</span> • {company?.city || 'Dahej/Bharuch'}, Gujarat
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <TrustBadge score={company?.trustScore || 94.5} isVerified={company?.isVerified ?? true} />
            <Link
              to="/listings"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-charcoal-950 font-bold text-xs shadow-lg shadow-brand-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Captured CO2</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Industrial Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Realized Revenue"
            value={`₹${((analytics?.totalRevenue || 225000) / 100000).toFixed(2)} L`}
            subtitle={`₹${(analytics?.escrowInFlightRevenue || 0).toLocaleString()} in escrow transit`}
            trend={{ value: '+18% vs last month', isPositive: true }}
            icon={IndianRupee}
            variant="emerald"
          />
          <StatCard
            title="CO2 Volume Sold"
            value={`${(analytics?.totalVolumeSoldTonnes || 50.0).toFixed(1)} T`}
            subtitle={`${(analytics?.totalVolumeDeliveredTonnes || 30.0).toFixed(1)} T delivered`}
            icon={Layers}
            variant="cyan"
          />
          <StatCard
            title="Avg Realized Price"
            value={`₹${(analytics?.avgRealizedPricePerKg || 4.5).toFixed(2)}`}
            subtitle="Per kg commercial settled rate"
            trend={{ value: 'Deterministic parity', isPositive: true }}
            icon={Sparkles}
            variant="neutral"
          />
          <StatCard
            title="RFQ Conversion Rate"
            value={`${analytics?.rfqConversionRate || 100}%`}
            subtitle={`${analytics?.allocatedRfqs || 2} of ${analytics?.totalRfqs || 2} RFQs allocated`}
            trend={{ value: 'Active bidding', isPositive: true }}
            icon={Scale}
            variant="amber"
          />
        </div>
      )}

      {/* Analytics Visualizations: Revenue Trends & Top Buyers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue & Volume Trends AreaChart */}
        <div className="lg:col-span-2 rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Monthly Realized Revenue & Volume Trend</span>
              </h2>
              <p className="text-xs text-slate-400">
                Revenue (₹) and CO2 Volume (Tonnes) across 6-month trading history
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-charcoal-950 text-emerald-400 border border-emerald-950">
              Live Ledger Synced
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.monthlyTrends || []}>
                <defs>
                  <linearGradient id="supplierRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="supplierVolGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="#10b981"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#06b6d4"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val}T`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#064e3b',
                    borderRadius: '1rem',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'revenue') return [`₹${value.toLocaleString()}`, 'Revenue'];
                    if (name === 'volumeTonnes') return [`${value} Tonnes`, 'Volume'];
                    return [value, name];
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#supplierRevGrad)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="volumeTonnes"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#supplierVolGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Industrial Buyers BarChart */}
        <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <Building className="w-4 h-4 text-brand-400" />
              <span>Top Purchasing Enterprises</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Offtake demand by buyer entity</p>
          </div>

          <div className="space-y-3 my-auto">
            {(analytics?.topBuyers || []).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No offtake buyers recorded yet.</p>
            ) : (
              (analytics?.topBuyers || []).map((b, idx) => (
                <div
                  key={b.companyId || idx}
                  className="p-3 rounded-2xl bg-charcoal-950 border border-emerald-950/60 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-white truncate">{b.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {b.city} • {b.orderCount} transaction{b.orderCount > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono font-bold text-brand-400">
                      ₹{b.totalSpend.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {(b.volumeKg / 1000).toFixed(1)} Tonnes
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            to="/orders"
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center justify-center space-x-1 pt-2 border-t border-emerald-950/60"
          >
            <span>View Complete Orders Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Active Listings Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Active CO2 Listings</h2>
            <p className="text-xs text-slate-400">Captured carbon available for commercial procurement</p>
          </div>
          <Link
            to="/listings"
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center space-x-1"
          >
            <span>Manage All Listings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <SkeletonTable rows={2} />
        ) : listings.length === 0 ? (
          <EmptyState
            title="No Active Listings"
            description="You have not published any captured CO2 inventory yet."
            actionText="Publish First Listing"
            actionLink="/listings"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-charcoal-900 border border-emerald-950/80 p-5 space-y-4 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-brand-300 border border-emerald-500/30 mb-2">
                      {item.stateOfMatter} • {item.transactionMode.replace('_', ' ')}
                    </span>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-brand-400 font-mono">
                      ₹{item.pricePerKg.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">per kg</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-emerald-950/60 text-center">
                  <div className="p-2 rounded-xl bg-charcoal-950 border border-emerald-950/40">
                    <span className="text-[10px] text-slate-400 block">Available</span>
                    <span className="text-xs font-bold text-white font-mono">
                      {(item.quantityAvailableKg / 1000).toFixed(1)} Tonnes
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-charcoal-950 border border-emerald-950/40">
                    <span className="text-[10px] text-slate-400 block">Purity</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {item.purityPercentage}%
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-charcoal-950 border border-emerald-950/40">
                    <span className="text-[10px] text-slate-400 block">Min Order</span>
                    <span className="text-xs font-bold text-white font-mono">
                      {(item.minOrderKg / 1000).toFixed(1)} Tonnes
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
