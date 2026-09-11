import React, { useState, useEffect } from 'react';
import { marketplaceService } from '../../services/marketplaceService';
import { CO2Listing } from '../../types';
import { TrustBadge } from '../../components/TrustBadge';
import { SkeletonTable } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import {
  Store,
  Search,
  Filter,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MarketplacePage: React.FC = () => {
  const [listings, setListings] = useState<CO2Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');

  useEffect(() => {
    const loadListings = async () => {
      try {
        const data = await marketplaceService.getListings();
        setListings(data);
      } catch (err) {
        console.error('Failed to load listings', err);
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, []);

  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.supplierCompany?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.supplierCompany?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === 'ALL' || l.stateOfMatter === stateFilter;
    return matchesSearch && matchesState;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Store className="w-7 h-7 text-brand-400" />
            <span>Circular Carbon Marketplace</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Explore verified industrial post-capture CO2 streams across Gujarat & India
          </p>
        </div>

        <Link
          to="/calculator"
          className="px-4 py-2.5 rounded-xl bg-charcoal-900 border border-emerald-500/30 hover:border-emerald-500 text-emerald-300 text-xs font-semibold transition-all self-start sm:self-center flex items-center space-x-2"
        >
          <span>Logistics Cost Estimator</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-900 border border-emerald-950/80 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by facility, city (Dahej, Hazira, Bharuch)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'Liquid', 'Compressed Gas', 'Solid'].map((st) => (
            <button
              key={st}
              onClick={() => setStateFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                stateFilter === st
                  ? 'bg-brand-500 text-charcoal-950 shadow-md shadow-brand-500/20'
                  : 'bg-charcoal-950 text-slate-400 hover:text-white border border-emerald-950'
              }`}
            >
              {st === 'ALL' ? 'All Physical States' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <SkeletonTable rows={4} />
      ) : filteredListings.length === 0 ? (
        <EmptyState
          title="No CO2 Streams Found"
          description="No listings match your search criteria. Try adjusting your filters."
          actionText="Clear Search Filters"
          onActionClick={() => {
            setSearchTerm('');
            setStateFilter('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-charcoal-900/90 border border-emerald-950/80 p-6 space-y-4 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-200 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    {item.stateOfMatter} • {item.transactionMode.replace('_', ' ')}
                  </span>
                  <TrustBadge
                    score={item.supplierCompany?.trustScore || 90}
                    isVerified={item.supplierCompany?.isVerified ?? true}
                    size="sm"
                    showScore={false}
                  />
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">{item.title}</h3>

                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{item.supplierCompany?.name} ({item.supplierCompany?.city || 'Gujarat'})</span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 border-t border-emerald-950/60 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-charcoal-950 border border-emerald-950/60">
                    <span className="text-[10px] text-slate-500 block">Supply</span>
                    <span className="font-bold text-white font-mono">
                      {(item.quantityAvailableKg / 1000).toFixed(0)} T
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-charcoal-950 border border-emerald-950/60">
                    <span className="text-[10px] text-slate-500 block">Purity</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {item.purityPercentage}%
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-charcoal-950 border border-emerald-950/60">
                    <span className="text-[10px] text-slate-500 block">Rate</span>
                    <span className="font-bold text-brand-400 font-mono">
                      ₹{item.pricePerKg}/kg
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Link
                    to="/calculator"
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Estimate Freight
                  </Link>

                  <Link
                    to="/quote-requests"
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-charcoal-950 font-bold text-xs transition-all shadow-md shadow-brand-500/20"
                  >
                    Procure / RFQ
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
