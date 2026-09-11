import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService } from '../../services/marketplaceService';
import { CO2Requirement, MatchBreakdown } from '../../types';
import { StatCard } from '../../components/StatCard';
import { TrustBadge } from '../../components/TrustBadge';
import { SkeletonTable } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import {
  Layers,
  Sparkles,
  Truck,
  Bot,
  PlusCircle,
  ArrowUpRight,
  TrendingDown,
  Percent,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

export const BuyerDashboard: React.FC = () => {
  const { user, company } = useAuth();
  const [requirements, setRequirements] = useState<CO2Requirement[]>([]);
  const [matches, setMatches] = useState<MatchBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuyerData = async () => {
      try {
        const [reqs, matchResults] = await Promise.all([
          marketplaceService.getRequirements(),
          marketplaceService.getMatches(),
        ]);
        setRequirements(reqs);
        setMatches(matchResults);
      } catch (err) {
        console.error('Failed to load buyer data', err);
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
              <span>CO2 Buyer Procurement Portal</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Procurement Demand"
          value={`${(totalDemandKg / 1000).toFixed(1)} T`}
          subtitle={`${totalDemandKg.toLocaleString()} kg total required`}
          icon={Layers}
          variant="cyan"
        />
        <StatCard
          title="Avg Matched Score"
          value="92.5%"
          subtitle="Top Match: Dahej Amine Stream"
          trend={{ value: '5-Factor AI Match', isPositive: true }}
          icon={Sparkles}
          variant="emerald"
        />
        <StatCard
          title="Cost Avoidance"
          value="18.4%"
          subtitle="Savings vs virgin merchant CO2"
          trend={{ value: '₹1.10/kg cheaper', isPositive: true }}
          icon={TrendingDown}
          variant="emerald"
        />
        <StatCard
          title="CO2 Utilized"
          value="30.0 T"
          subtitle="Productive utilization in polymers"
          icon={CheckCircle2}
          variant="cyan"
        />
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
              to="/marketplace"
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
