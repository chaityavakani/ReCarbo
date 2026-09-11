import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService } from '../../services/marketplaceService';
import { CO2Listing } from '../../types';
import { StatCard } from '../../components/StatCard';
import { TrustBadge } from '../../components/TrustBadge';
import { SkeletonTable } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
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
} from 'lucide-react';

export const SupplierDashboard: React.FC = () => {
  const { user, company } = useAuth();
  const [listings, setListings] = useState<CO2Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupplierData = async () => {
      try {
        const allListings = await marketplaceService.getListings();
        // Filter listings belonging to this company if exists
        const supplierListings = company?.id
          ? allListings.filter((l) => l.supplierCompanyId === company.id)
          : allListings;
        setListings(supplierListings.length > 0 ? supplierListings : allListings);
      } catch (err) {
        console.error('Failed to load supplier listings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierData();
  }, [company?.id]);

  const totalSupplyKg = listings.reduce((acc, curr) => acc + curr.quantityAvailableKg, 0);
  const totalTonnes = (totalSupplyKg / 1000).toFixed(1);
  const avgPurity = listings.length
    ? (listings.reduce((acc, curr) => acc + curr.purityPercentage, 0) / listings.length).toFixed(1)
    : '99.2';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950/80 via-charcoal-900 to-charcoal-900 border border-emerald-500/20 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CO2 Capture Supplier Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {user?.name}
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Facility: <span className="text-white font-medium">{company?.name || 'Gujarat Industrial Unit'}</span> • {company?.city || 'Dahej/Bharuch'}, Gujarat
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active CO2 Supply"
          value={`${totalTonnes} T`}
          subtitle={`${totalSupplyKg.toLocaleString()} kg total inventory`}
          trend={{ value: '+15% this month', isPositive: true }}
          icon={Layers}
          variant="emerald"
        />
        <StatCard
          title="Avg Purity Grade"
          value={`${avgPurity}%`}
          subtitle="Meets pharmaceutical & polymer specs"
          icon={Sparkles}
          variant="cyan"
        />
        <StatCard
          title="Inquiries / RFQs"
          value="4 Active"
          subtitle="2 Quote requests pending evaluation"
          trend={{ value: 'Deterministic FCFS', isPositive: true }}
          icon={Scale}
          variant="amber"
        />
        <StatCard
          title="Realized Revenue"
          value="₹2.25 L"
          subtitle="From 50T Dahej liquid stream"
          icon={IndianRupee}
          variant="emerald"
        />
      </div>

      {/* Active Listings Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Active CO2 Listings</h2>
            <p className="text-xs text-slate-400">Captured carbon available for procurement</p>
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
          <SkeletonTable rows={3} />
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

      {/* Matching & Logistics Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* RFQ & Quote Requests Preview */}
        <div className="rounded-2xl bg-charcoal-900 border border-emerald-950/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Pending RFQ Inquiries</span>
            </h3>
            <Link to="/quote-requests" className="text-xs text-brand-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-charcoal-950 border border-emerald-950/60 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white">Aura Polymer Materials (Ahmedabad)</span>
                <p className="text-[11px] text-slate-400">Offer: 30,000 kg @ ₹4.50/kg</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 border border-amber-500/30 text-amber-300">
                Evaluating FCFS
              </span>
            </div>

            <div className="p-3 rounded-xl bg-charcoal-950 border border-emerald-950/60 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white">Vadodara Eco-Concrete Works</span>
                <p className="text-[11px] text-slate-400">Offer: 20,000 kg @ ₹4.20/kg</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                Matched 92.5%
              </span>
            </div>
          </div>
        </div>

        {/* Verification & Trust Badge Callout */}
        <div className="rounded-2xl bg-charcoal-900 border border-emerald-950/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Industrial Compliance & Trust</span>
            </div>
            <h3 className="text-sm font-bold text-white">Facility Carbon Verification</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Your Dahej capture facility maintains a <strong>94.5/100 Trust Score</strong>. Verified purity metrics are automatically shared with eligible commercial buyers for accelerated RFQ closing.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-950/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">Simulated Industrial Audit</span>
            <Link to="/profile" className="text-brand-400 font-semibold hover:underline">
              View Profile & Certs →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
