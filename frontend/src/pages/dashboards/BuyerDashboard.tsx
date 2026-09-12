import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analyticsService';
import { marketplaceService } from '../../services/marketplaceService';
import { BuyerAnalytics, CO2Requirement, MatchBreakdown } from '../../types';
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
  Sparkles,
  Truck,
  Bot,
  PlusCircle,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Percent,
  CheckCircle2,
  Navigation,
  Building,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';

export const BuyerDashboard: React.FC = () => {
  const { user, company } = useAuth();
  const [analytics, setAnalytics] = useState<BuyerAnalytics | null>(null);
  const [requirements, setRequirements] = useState<CO2Requirement[]>([]);
  const [matches, setMatches] = useState<MatchBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuyerData = async () => {
      try {
        setLoading(true);
        const [analyticsData, reqs, matchResults] = await Promise.all([
          analyticsService.getBuyerAnalytics(),
          marketplaceService.getRequirements(),
          marketplaceService.getMatches(),
        ]);
        setAnalytics(analyticsData);
        setRequirements(reqs);
        setMatches(matchResults);
      } catch (err) {
        console.error('Failed to load buyer analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuyerData();
  }, []);

  const totalDemandKg = requirements.reduce((acc, curr) => acc + curr.quantityRequiredKg, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-cyan-950/80 via-charcoal-900 to-charcoal-900 border border-cyan-500/20 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>CO2 Buyer Procurement Portal • Live Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {user?.name}
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Buyer Entity: <span className="text-white font-medium">{company?.name || 'Aura Polymer Materials'}</span> • {company?.city || 'Ahmedabad/Sanand'}, Gujarat
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <TrustBadge score={company?.trustScore || 91.0} isVerified={company?.isVerified ?? true} />
            <Link
              to="/requirements"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-charcoal-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Requirement</span>
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
            title="Procured CO2 Volume"
            value={`${(analytics?.totalVolumePurchasedTonnes || 30.0).toFixed(1)} T`}
            subtitle={`${(analytics?.totalVolumePurchasedKg || 30000).toLocaleString()} kg total volume`}
            icon={Layers}
            variant="cyan"
          />
          <StatCard
            title="Total Procurement Spend"
            value={`₹${((analytics?.totalSpend || 228575) / 100000).toFixed(2)} L`}
            subtitle={`₹${(analytics?.costSavingsAmount || 45000).toLocaleString()} saved vs virgin CO2`}
            trend={{ value: 'Escrow protected', isPositive: true }}
            icon={IndianRupee}
            variant="emerald"
          />
          <StatCard
            title="Cost Avoidance %"
            value={`${analytics?.costAvoidancePercent || 18.5}%`}
            subtitle="Savings vs merchant benchmark (₹5.8/kg)"
            trend={{ value: '₹1.30/kg cheaper', isPositive: true }}
            icon={TrendingDown}
            variant="emerald"
          />
          <StatCard
            title="CO2 Utilized (Circular)"
            value={`${(analytics?.totalVolumeUtilizedTonnes || 30.0).toFixed(1)} T`}
            subtitle="Verified conversion into polymer products"
            icon={CheckCircle2}
            variant="cyan"
          />
        </div>
      )}

      {/* Analytics Visualizations: Spend/Demand Trends & Top Suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Spend & Demand Trends AreaChart */}
        <div className="lg:col-span-2 rounded-3xl bg-charcoal-900 border border-cyan-950/80 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Procurement Spend & Monthly Demand Trend</span>
              </h2>
              <p className="text-xs text-slate-400">
                Spend (₹) and CO2 Intake (Tonnes) across 6-month fulfillment history
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-charcoal-950 text-cyan-400 border border-cyan-950">
              Deterministic Settlement
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.monthlyTrends || []}>
                <defs>
                  <linearGradient id="buyerSpendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="buyerVolGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="#06b6d4"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#3b82f6"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val}T`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#0e7490',
                    borderRadius: '1rem',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'spend') return [`₹${value.toLocaleString()}`, 'Total Spend'];
                    if (name === 'volumeTonnes') return [`${value} Tonnes`, 'Demand Volume'];
                    return [value, name];
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="spend"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#buyerSpendGrad)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="volumeTonnes"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#buyerVolGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Capture Suppliers */}
        <div className="rounded-3xl bg-charcoal-900 border border-cyan-950/80 p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <Building className="w-4 h-4 text-cyan-400" />
              <span>Primary Capture Suppliers</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Offtake breakdown by supplier cluster</p>
          </div>

          <div className="space-y-3 my-auto">
            {(analytics?.topSuppliers || []).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No supplier contracts executed yet.</p>
            ) : (
              (analytics?.topSuppliers || []).map((s, idx) => (
                <div
                  key={s.companyId || idx}
                  className="p-3 rounded-2xl bg-charcoal-950 border border-cyan-950/60 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-white truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {s.city} • Purity: <span className="text-emerald-400">{s.avgPurity}%</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono font-bold text-cyan-400">
                      ₹{s.totalSpend.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {(s.volumeKg / 1000).toFixed(1)} Tonnes
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            to="/orders"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center justify-center space-x-1 pt-2 border-t border-cyan-950/60"
          >
            <span>View Orders & Delivery Tracking</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* AI Match Recommendation Showcase (Deterministic 5-factor scoring) */}
      <div className="rounded-3xl bg-charcoal-900 border border-emerald-500/30 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-brand-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Top Deterministic AI Match Recommendation
              </h2>
              <p className="text-xs text-slate-400">
                Formula: 30% Qty + 25% Purity + 20% Distance + 15% Price + 10% Availability
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-brand-300 border border-emerald-500/40">
            92.5 / 100 Match Fit
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs text-slate-400">Matched Supplier Listing:</span>
              <h3 className="text-sm font-bold text-white">
                High-Purity Liquid CO2 (99.8%) - Gujarat Carbon Capture Ltd (Dahej, Bharuch)
              </h3>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-400">Supply: <strong>50,000 kg</strong></span>
              <span className="text-slate-400">•</span>
              <span className="text-brand-400 font-bold font-mono">₹4.50 / kg</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 bg-charcoal-900/80 p-3 rounded-xl border border-emerald-950/60 leading-relaxed">
            <span className="font-semibold text-emerald-400">Plain-Language Engine Breakdown:</span> Dahej facility offers 99.8% purity (exceeds your 99.5% minimum specification for polymer synthesis) with 50,000 kg capacity against your 30,000 kg requirement. Route distance is ~190 km (Bharuch to Sanand, Ahmedabad), fitting comfortably within economic transit radius.
          </p>

          {/* 5-Factor Score Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs pt-1">
            <div className="p-2 rounded-xl bg-charcoal-900 border border-emerald-950/60">
              <span className="text-[10px] text-slate-400 block">Quantity (30%)</span>
              <span className="font-mono font-bold text-emerald-400">95.0 / 100</span>
            </div>
            <div className="p-2 rounded-xl bg-charcoal-900 border border-emerald-950/60">
              <span className="text-[10px] text-slate-400 block">Purity (25%)</span>
              <span className="font-mono font-bold text-emerald-400">100 / 100</span>
            </div>
            <div className="p-2 rounded-xl bg-charcoal-900 border border-emerald-950/60">
              <span className="text-[10px] text-slate-400 block">Distance (20%)</span>
              <span className="font-mono font-bold text-cyan-400">82.0 / 100</span>
            </div>
            <div className="p-2 rounded-xl bg-charcoal-900 border border-emerald-950/60">
              <span className="text-[10px] text-slate-400 block">Price (15%)</span>
              <span className="font-mono font-bold text-emerald-400">90.0 / 100</span>
            </div>
            <div className="p-2 rounded-xl bg-charcoal-900 border border-emerald-950/60 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 block">Availability (10%)</span>
              <span className="font-mono font-bold text-emerald-400">95.0 / 100</span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Link
              to="/calculator"
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-charcoal-850 transition-colors"
            >
              Simulate Transit Cost
            </Link>
            <Link
              to="/quote-requests"
              className="text-xs font-bold text-charcoal-950 bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-1.5 rounded-lg hover:from-brand-400 hover:to-brand-300 transition-all shadow-md shadow-brand-500/20"
            >
              Place RFQ Offer
            </Link>
          </div>
        </div>
      </div>

      {/* Active Requirements List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Active CO2 Requirements</h2>
            <p className="text-xs text-slate-400">Your organization's open demand requests</p>
          </div>
          <Link
            to="/requirements"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
          >
            <span>Manage Requirements</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <SkeletonTable rows={2} />
        ) : requirements.length === 0 ? (
          <EmptyState
            title="No Active Requirements"
            description="You have not posted any CO2 feedstock requirements yet."
            actionText="Post New Requirement"
            actionLink="/requirements"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requirements.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl bg-charcoal-900 border border-cyan-950/80 p-5 space-y-3 hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 mb-2">
                      Status: {req.status}
                    </span>
                    <h3 className="text-sm font-bold text-white">{req.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-cyan-400 font-mono">
                      {(req.quantityRequiredKg / 1000).toFixed(1)} T
                    </span>
                    <span className="text-[10px] text-slate-400 block">Required</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">{req.description}</p>

                <div className="pt-2 border-t border-cyan-950/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Min Purity: <strong>{req.minPurityPercentage}%</strong></span>
                  <span className="text-slate-400">Max Budget: <strong>₹{req.maxPricePerKg || '5.00'}/kg</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
