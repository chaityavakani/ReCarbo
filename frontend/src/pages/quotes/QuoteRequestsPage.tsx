import React from 'react';
import { Scale, Clock, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';

export const QuoteRequestsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <Scale className="w-7 h-7 text-amber-400" />
          <span>Request for Quotation (RFQ) Engine</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Deterministic bidding and allocation under TransactionStrategy (FCFS, Highest-Price, Best-Value Score)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-emerald-950/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              Policy: Best-Value Score
            </span>
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Deadline in 4 days</span>
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">
              Bulk Compressed Gas CO2 (98.5%) - Hazira Stream
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supplier: Hazira Green Synthesis • Available: 120,000 kg • Floor Rate: ₹3.20/kg
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950/60 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Submitted Buyer Bids:</span>
              <strong className="text-emerald-400 font-mono">3 Active Offers</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Allocation Strategy:</span>
              <strong className="text-white">Price + Quantity + Purity + Reliability Fit</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Multi-Buyer Split Allowed:</span>
              <strong className="text-emerald-400">Yes (Pro-rata available)</strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">Server Transaction Lock Active</span>
            <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold text-xs shadow-md shadow-brand-500/20 transition-all">
              Submit / Manage Bid
            </button>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-charcoal-900 border border-emerald-950/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Policy: First-Come-First-Served
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Allocated & Closed</span>
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">
              Dahej High-Purity Liquid Stream (99.8%)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supplier: Gujarat Carbon Capture Ltd • 50,000 kg allocated to Aura Polymer Materials
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950/60 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Allocated Volume:</span>
              <strong className="text-white font-mono">30,000 kg (60% lot)</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Agreed Clearing Price:</span>
              <strong className="text-brand-400 font-mono">₹4.50 / kg</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Order Reference:</span>
              <strong className="text-cyan-400 font-mono">RC-2025-00124</strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">Order Dispatched</span>
            <span className="text-xs font-semibold text-emerald-400">View Contract →</span>
          </div>
        </div>
      </div>
    </div>
  );
};
