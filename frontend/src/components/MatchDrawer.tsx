import React from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Truck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Info,
} from 'lucide-react';
import { AIMatchResult, CO2Requirement } from '../types';
import { TrustBadge } from './TrustBadge';

interface MatchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  matches: AIMatchResult[];
  bestDeal: AIMatchResult | null;
  requirement?: CO2Requirement | null;
  onSelectListingForRFQ?: (listingId: string) => void;
}

export const MatchDrawer: React.FC<MatchDrawerProps> = ({
  isOpen,
  onClose,
  matches,
  bestDeal,
  requirement,
  onSelectListingForRFQ,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-charcoal-900 border-l border-emerald-950/80 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-emerald-950/60 flex items-center justify-between bg-charcoal-950">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">AI Carbon Matchmaking Engine</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Deterministic 5-Factor
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {requirement ? `Matching streams for: ${requirement.title}` : 'Ranked supplier streams based on hard eligibility & multi-factor scoring'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Best Deal Featured Card */}
          {bestDeal && (
            <div className="relative rounded-3xl bg-gradient-to-b from-emerald-950/60 to-charcoal-950 border-2 border-brand-500/50 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-500 text-charcoal-950 shadow-md shadow-brand-500/20">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Top Recommended Match</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-brand-400">
                    {bestDeal.overallScore}% Overall Score
                  </span>
                </div>
                <TrustBadge
                  score={bestDeal.listing.supplierCompany?.trustScore || 95}
                  isVerified={bestDeal.listing.supplierCompany?.isVerified ?? true}
                  size="sm"
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{bestDeal.listing.title}</h3>
                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {bestDeal.listing.supplierCompany?.name} ({bestDeal.listing.supplierCompany?.city}) • {bestDeal.distanceKm} km freight corridor
                  </span>
                </div>
              </div>

              {/* Natural-Language Explanation Banner */}
              <div className="p-3.5 rounded-2xl bg-charcoal-900/90 border border-emerald-950 text-xs text-slate-300 leading-relaxed space-y-1">
                <div className="flex items-center space-x-1.5 text-brand-400 font-semibold text-[11px]">
                  <Info className="w-3.5 h-3.5" />
                  <span>Why This Stream Is Ranked #1:</span>
                </div>
                <p className="text-slate-300">{bestDeal.explanation}</p>
              </div>

              {/* 5-Factor Score Breakdown Progress */}
              <div className="space-y-2 p-4 rounded-2xl bg-charcoal-900/60 border border-emerald-950">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Deterministic Score Breakdown
                </span>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Quantity Fit (30%):</span>
                      <strong className="text-white font-mono">{bestDeal.quantityScore}%</strong>
                    </div>
                    <div className="w-full bg-charcoal-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-500 h-full rounded-full"
                        style={{ width: `${bestDeal.quantityScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Purity Fit (25%):</span>
                      <strong className="text-emerald-400 font-mono">{bestDeal.purityScore}%</strong>
                    </div>
                    <div className="w-full bg-charcoal-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full"
                        style={{ width: `${bestDeal.purityScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Logistics Proximity (20%):</span>
                      <strong className="text-cyan-400 font-mono">{bestDeal.distanceScore}%</strong>
                    </div>
                    <div className="w-full bg-charcoal-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full rounded-full"
                        style={{ width: `${bestDeal.distanceScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Price Fit (15%):</span>
                      <strong className="text-amber-400 font-mono">{bestDeal.priceScore}%</strong>
                    </div>
                    <div className="w-full bg-charcoal-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{ width: `${bestDeal.priceScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Landed Cost Estimation Summary */}
              <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                    Total Estimated Landed Cost
                  </span>
                  <div className="text-lg font-mono font-bold text-white">
                    ₹{bestDeal.estimatedLandedCost.totalAmount.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-brand-400 font-mono">
                    (₹{bestDeal.estimatedLandedCost.costPerKg} / delivered kg)
                  </span>
                </div>

                {onSelectListingForRFQ && (
                  <button
                    onClick={() => onSelectListingForRFQ(bestDeal.listingId)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold text-xs shadow-md shadow-brand-500/20"
                  >
                    <span>Procure / RFQ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Other Ranked Matches List */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              All Eligible Ranked Matches ({matches.length})
            </h4>

            {matches.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No matching supplier streams found passing hard eligibility filters.
              </div>
            ) : (
              matches.map((item, idx) => (
                <div
                  key={item.listingId}
                  className="rounded-2xl bg-charcoal-950 border border-emerald-950/80 p-4 space-y-3 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-charcoal-800 text-slate-400 text-[10px] font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-white">{item.listing.title}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                      {item.overallScore}%
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2">{item.explanation}</p>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="p-2 rounded-xl bg-charcoal-900 border border-emerald-950">
                      <span className="text-slate-500 block">Rate</span>
                      <span className="font-bold text-white font-mono">₹{item.listing.pricePerKg}/kg</span>
                    </div>
                    <div className="p-2 rounded-xl bg-charcoal-900 border border-emerald-950">
                      <span className="text-slate-500 block">Purity</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {item.listing.purityPercentage}%
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-charcoal-900 border border-emerald-950">
                      <span className="text-slate-500 block">Distance</span>
                      <span className="font-bold text-cyan-400 font-mono">{item.distanceKm} km</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Landed: <strong className="text-white font-mono">₹{item.estimatedLandedCost.costPerKg}/kg</strong>
                    </span>

                    {onSelectListingForRFQ && (
                      <button
                        onClick={() => onSelectListingForRFQ(item.listingId)}
                        className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center space-x-1"
                      >
                        <span>Start RFQ</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
