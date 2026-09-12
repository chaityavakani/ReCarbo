import React from 'react';
import {
  X,
  MapPin,
  Sparkles,
  Layers,
  Thermometer,
  Gauge,
  Scale,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { CO2Listing } from '../types';
import { TrustBadge } from './TrustBadge';
import { Link } from 'react-router-dom';

interface ListingDetailModalProps {
  listing: CO2Listing | null;
  isOpen: boolean;
  onClose: () => void;
  onInitiateRFQ?: (listing: CO2Listing) => void;
  onFindMatches?: (listing: CO2Listing) => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  isOpen,
  onClose,
  onInitiateRFQ,
  onFindMatches,
}) => {
  if (!isOpen || !listing) return null;

  const quantityTonnes = (listing.quantityAvailableKg / 1000).toFixed(1);
  const minOrderTonnes = (listing.minOrderKg / 1000).toFixed(1);
  const totalValue = listing.quantityAvailableKg * listing.pricePerKg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-charcoal-900 border border-emerald-950/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-emerald-950/60">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                {listing.stateOfMatter} • {listing.transactionMode.replace('_', ' ')}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-400">
                Status: {listing.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white pt-1">{listing.title}</h2>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>
                {listing.supplierCompany?.name} ({listing.supplierCompany?.city || 'Gujarat'}, India)
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stream Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3.5 rounded-2xl bg-charcoal-950 border border-emerald-950">
            <span className="text-[10px] text-slate-500 block">Available Inventory</span>
            <span className="font-bold text-white font-mono text-base">{quantityTonnes} T</span>
            <span className="text-[10px] text-slate-400 block font-mono">
              ({listing.quantityAvailableKg.toLocaleString()} kg)
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-charcoal-950 border border-emerald-950">
            <span className="text-[10px] text-slate-500 block">Purity Assay</span>
            <span className="font-bold text-emerald-400 font-mono text-base">
              {listing.purityPercentage}%
            </span>
            <span className="text-[10px] text-slate-400 block">Verified Assay</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-charcoal-950 border border-emerald-950">
            <span className="text-[10px] text-slate-500 block">Pricing Rate</span>
            <span className="font-bold text-brand-400 font-mono text-base">
              ₹{listing.pricePerKg.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 block">per kg CO2</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-charcoal-950 border border-emerald-950">
            <span className="text-[10px] text-slate-500 block">Total Lot Value</span>
            <span className="font-bold text-cyan-400 font-mono text-base">
              ₹{(totalValue / 1000).toFixed(0)}k
            </span>
            <span className="text-[10px] text-slate-400 block">
              ₹{totalValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Physical Specifications Audit */}
        <div className="p-5 rounded-2xl bg-charcoal-950 border border-emerald-950 text-xs space-y-2.5">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
            Technical & Physical Specifications
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Capture Technology:</span>
              <strong className="text-white">{listing.captureMethod}</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Physical Form:</span>
              <strong className="text-white">{listing.stateOfMatter}</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Pressure:</span>
              <strong className="text-white font-mono">
                {listing.pressureBar ? `${listing.pressureBar} bar` : 'Atmospheric'}
              </strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Storage Temp:</span>
              <strong className="text-white font-mono">
                {listing.temperatureC !== null && listing.temperatureC !== undefined
                  ? `${listing.temperatureC}°C`
                  : 'Ambient'}
              </strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Minimum Order:</span>
              <strong className="text-white font-mono">
                {minOrderTonnes} T ({listing.minOrderKg.toLocaleString()} kg)
              </strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Lot Splitting:</span>
              <strong className="text-emerald-400">
                {listing.isSplitAllowed ? 'Allowed (Multi-Buyer)' : 'Single Winner Only'}
              </strong>
            </div>
          </div>
        </div>

        {/* Supplier Profile Summary */}
        <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              {listing.supplierCompany?.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">{listing.supplierCompany?.name}</span>
                <TrustBadge
                  score={listing.supplierCompany?.trustScore || 90}
                  isVerified={listing.supplierCompany?.isVerified ?? true}
                  size="sm"
                />
              </div>
              <span className="text-[11px] text-slate-400">
                {listing.supplierCompany?.industry} • {listing.supplierCompany?.city}
              </span>
            </div>
          </div>

          <Link
            to={`/calculator?origin=${encodeURIComponent(listing.supplierCompany?.city || 'Dahej')}&price=${listing.pricePerKg}`}
            className="text-xs text-emerald-400 hover:underline flex items-center space-x-1"
          >
            <span>Estimate Freight</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-emerald-950/60">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs hover:text-white"
          >
            Close
          </button>

          {onFindMatches && (
            <button
              type="button"
              onClick={() => onFindMatches(listing)}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Find Offtakers / Matches</span>
            </button>
          )}

          {onInitiateRFQ && (
            <button
              type="button"
              onClick={() => onInitiateRFQ(listing)}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold text-xs shadow-md shadow-brand-500/20"
            >
              <span>Procure / Submit RFQ Quote</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
