import React, { useState, useEffect } from 'react';
import { marketplaceService, ListingFilters } from '../../services/marketplaceService';
import { CO2Listing, AIMatchResult } from '../../types';
import { TrustBadge } from '../../components/TrustBadge';
import { SkeletonTable } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ListingDetailModal } from '../../components/ListingDetailModal';
import { MatchDrawer } from '../../components/MatchDrawer';
import { RFQQuoteModal } from '../../components/RFQQuoteModal';
import { useAuth } from '../../context/AuthContext';
import {
  Store,
  Search,
  Filter,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag,
  Layers,
  ArrowUpDown,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState<CO2Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [minPurity, setMinPurity] = useState<number>(90);
  const [maxPrice, setMaxPrice] = useState<number>(10);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'purity_desc' | 'quantity_desc'>('newest');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Modals State
  const [selectedListing, setSelectedListing] = useState<CO2Listing | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rfqModalData, setRfqModalData] = useState<{
    isOpen: boolean;
    mode: 'SUBMIT_QUOTE' | 'CREATE_RFQ';
    listingId?: string;
    quoteRequestId?: string;
    listingTitle?: string;
    maxAvailableKg?: number;
    minOrderKg?: number;
    basePricePerKg?: number;
  }>({ isOpen: false, mode: 'SUBMIT_QUOTE' });

  // Matching Drawer State
  const [matchDrawerData, setMatchDrawerData] = useState<{
    isOpen: boolean;
    matches: AIMatchResult[];
    bestDeal: AIMatchResult | null;
  }>({ isOpen: false, matches: [], bestDeal: null });

  const loadListings = async () => {
    try {
      setLoading(true);
      const filters: ListingFilters = {
        search: searchTerm || undefined,
        stateOfMatter: stateFilter !== 'ALL' ? stateFilter : undefined,
        industry: industryFilter !== 'ALL' ? industryFilter : undefined,
        minPurity: minPurity > 90 ? minPurity : undefined,
        maxPrice: maxPrice < 10 ? maxPrice : undefined,
        verifiedOnly: verifiedOnly || undefined,
        sortBy,
        status: 'ACTIVE',
      };
      const data = await marketplaceService.getListings(filters);
      setListings(data);
    } catch (err) {
      console.error('Failed to load marketplace streams', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [stateFilter, industryFilter, minPurity, maxPrice, verifiedOnly, sortBy]);

  // Debounced text search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadListings();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleOpenDetail = (listing: CO2Listing) => {
    setSelectedListing(listing);
    setShowDetailModal(true);
  };

  const handleInitiateRFQFromListing = async (listing: CO2Listing) => {
    setShowDetailModal(false);
    // Check if listing has open RFQ or create one
    try {
      const rfqs = await marketplaceService.getQuoteRequests(listing.id);
      const openRfq = rfqs.find((r) => r.status === 'OPEN');
      if (openRfq) {
        setRfqModalData({
          isOpen: true,
          mode: 'SUBMIT_QUOTE',
          quoteRequestId: openRfq.id,
          listingTitle: listing.title,
          maxAvailableKg: listing.quantityAvailableKg,
          minOrderKg: listing.minOrderKg,
          basePricePerKg: listing.pricePerKg,
        });
      } else {
        // Navigate or open RFQ Creator
        navigate(`/quote-requests?listingId=${listing.id}`);
      }
    } catch (e) {
      navigate(`/quote-requests?listingId=${listing.id}`);
    }
  };

  const handleFindMatchesForListing = async (listing: CO2Listing) => {
    try {
      const data = await marketplaceService.findMatchesForListing(listing.id);
      setMatchDrawerData({
        isOpen: true,
        matches: data.matches,
        bestDeal: data.matches.length > 0 ? data.matches[0] : null,
      });
    } catch (e) {
      console.error('Failed to load matches for listing', e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/30">
              Verified Post-Capture Streams
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3 mt-1">
            <Store className="w-7 h-7 text-brand-400" />
            <span>Circular Carbon Marketplace</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Explore and procure industrial post-capture CO2 streams across Gujarat & India
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/calculator"
            className="px-4 py-2.5 rounded-xl bg-charcoal-900 border border-emerald-500/30 hover:border-emerald-500 text-emerald-300 text-xs font-semibold transition-all flex items-center space-x-2 shadow-lg"
          >
            <span>Logistics Freight Estimator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {user?.role === 'SUPPLIER' && (
            <Link
              to="/listings"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>List Supply Stream</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Search & Quick State Bar */}
      <div className="p-4 rounded-3xl bg-charcoal-900 border border-emerald-950/80 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xl">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search stream, capture method, Dahej, Hazira, Bharuch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-charcoal-950 border border-emerald-950 text-xs text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Liquid', 'Compressed Gas', 'Solid'].map((st) => (
            <button
              key={st}
              onClick={() => setStateFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                stateFilter === st
                  ? 'bg-brand-500 text-charcoal-950 shadow-md shadow-brand-500/20 font-bold'
                  : 'bg-charcoal-950 text-slate-400 hover:text-white border border-emerald-950'
              }`}
            >
              {st === 'ALL' ? 'All Physical States' : st}
            </button>
          ))}

          <button
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            className={`p-2 rounded-xl text-xs font-semibold border flex items-center space-x-1 transition-all ${
              showFiltersDrawer || verifiedOnly || minPurity > 90 || maxPrice < 10
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-charcoal-950 border-emerald-950 text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center space-x-1.5 bg-charcoal-950 px-3 py-1.5 rounded-xl border border-emerald-950 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-charcoal-950 text-white">Newest First</option>
              <option value="price_asc" className="bg-charcoal-950 text-white">Price: Low to High</option>
              <option value="price_desc" className="bg-charcoal-950 text-white">Price: High to Low</option>
              <option value="purity_desc" className="bg-charcoal-950 text-white">Highest Purity</option>
              <option value="quantity_desc" className="bg-charcoal-950 text-white">Largest Volume</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFiltersDrawer && (
        <div className="p-5 rounded-3xl bg-charcoal-950 border border-emerald-500/30 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-200 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
              Minimum Purity: <strong className="text-emerald-400 font-mono">{minPurity}%</strong>
            </label>
            <input
              type="range"
              min="90"
              max="99.9"
              step="0.1"
              value={minPurity}
              onChange={(e) => setMinPurity(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-charcoal-900 h-2 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
              Max Price: <strong className="text-brand-400 font-mono">₹{maxPrice.toFixed(1)}/kg</strong>
            </label>
            <input
              type="range"
              min="2.0"
              max="10.0"
              step="0.5"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-brand-500 bg-charcoal-900 h-2 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
              Source Industry
            </label>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-charcoal-900 border border-emerald-950 text-white"
            >
              <option value="ALL">All Industries</option>
              <option value="Chemicals">Chemicals & Refining</option>
              <option value="Fertilizer">Fertilizer & Ammonia</option>
              <option value="Cement">Cement & Building</option>
              <option value="Energy">Energy & Power</option>
            </select>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <input
              type="checkbox"
              id="verifiedOnly"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 rounded accent-brand-500 bg-charcoal-900 border-emerald-950"
            />
            <label htmlFor="verifiedOnly" className="text-slate-300 font-semibold cursor-pointer">
              Verified Suppliers Only
            </label>
          </div>
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <SkeletonTable rows={4} />
      ) : listings.length === 0 ? (
        <EmptyState
          title="No CO2 Streams Found"
          description="No industrial streams match your current search and filter criteria."
          actionText="Clear All Filters"
          onActionClick={() => {
            setSearchTerm('');
            setStateFilter('ALL');
            setIndustryFilter('ALL');
            setMinPurity(90);
            setMaxPrice(10);
            setVerifiedOnly(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
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

                <h3
                  onClick={() => handleOpenDetail(item)}
                  className="text-sm font-bold text-white leading-snug cursor-pointer hover:text-brand-400 transition-colors"
                >
                  {item.title}
                </h3>

                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>
                    {item.supplierCompany?.name} ({item.supplierCompany?.city || 'Gujarat'})
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description || item.captureMethod}
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
                      ₹{item.pricePerKg.toFixed(2)}/kg
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleOpenDetail(item)}
                    className="text-xs text-slate-400 hover:text-white font-medium"
                  >
                    View Specs
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFindMatchesForListing(item)}
                      title="Find Matching Offtakers"
                      className="p-2 rounded-xl bg-charcoal-950 hover:bg-charcoal-800 text-cyan-400 border border-emerald-950 text-xs transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleInitiateRFQFromListing(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold text-xs transition-all shadow-md shadow-brand-500/20"
                    >
                      Procure / RFQ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Listing Detail Modal */}
      <ListingDetailModal
        listing={selectedListing}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onInitiateRFQ={handleInitiateRFQFromListing}
        onFindMatches={handleFindMatchesForListing}
      />

      {/* RFQ Quote Submission Modal */}
      <RFQQuoteModal
        isOpen={rfqModalData.isOpen}
        mode={rfqModalData.mode}
        quoteRequestId={rfqModalData.quoteRequestId}
        listingId={rfqModalData.listingId}
        listingTitle={rfqModalData.listingTitle}
        maxAvailableKg={rfqModalData.maxAvailableKg}
        minOrderKg={rfqModalData.minOrderKg}
        basePricePerKg={rfqModalData.basePricePerKg}
        onClose={() => setRfqModalData({ ...rfqModalData, isOpen: false })}
        onSuccess={() => loadListings()}
      />

      {/* AI Matchmaker Drawer */}
      <MatchDrawer
        isOpen={matchDrawerData.isOpen}
        matches={matchDrawerData.matches}
        bestDeal={matchDrawerData.bestDeal}
        onClose={() => setMatchDrawerData({ ...matchDrawerData, isOpen: false })}
        onSelectListingForRFQ={(listingId) => {
          setMatchDrawerData({ ...matchDrawerData, isOpen: false });
          const target = listings.find((l) => l.id === listingId);
          if (target) handleInitiateRFQFromListing(target);
        }}
      />
    </div>
  );
};
