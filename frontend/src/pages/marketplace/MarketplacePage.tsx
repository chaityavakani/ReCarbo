import React, { useState, useEffect } from 'react';
import { marketplaceService, ListingFilters } from '../../services/marketplaceService';
import { orderService } from '../../services/orderService';
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
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowUpDown,
  SlidersHorizontal,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  ShoppingCart,
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

  // Direct Order Modal (FIXED_PRICE listings for buyers)
  const [directOrderModal, setDirectOrderModal] = useState<{
    isOpen: boolean;
    listing: CO2Listing | null;
    quantityKg: number;
    deliveryAddress: string;
    isSubmitting: boolean;
    error: string | null;
    success: boolean;
  }>({
    isOpen: false,
    listing: null,
    quantityKg: 0,
    deliveryAddress: '',
    isSubmitting: false,
    error: null,
    success: false,
  });

  // Inline toast for non-modal feedback
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' } | null>(null);
  const showToast = (message: string, type: 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

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

    if (!user) {
      showToast('Please log in to procure or submit an RFQ.', 'error');
      navigate('/login');
      return;
    }

    // --- SUPPLIER: open CREATE_RFQ modal for their own listing ---
    if (user.role === 'SUPPLIER') {
      setRfqModalData({
        isOpen: true,
        mode: 'CREATE_RFQ',
        listingId: listing.id,
        listingTitle: listing.title,
        maxAvailableKg: listing.quantityAvailableKg,
        minOrderKg: listing.minOrderKg,
        basePricePerKg: listing.pricePerKg,
      });
      return;
    }

    // --- BUYER: FIXED_PRICE listing → direct order ---
    if (user.role === 'BUYER' && listing.transactionMode === 'FIXED_PRICE') {
      setDirectOrderModal({
        isOpen: true,
        listing,
        quantityKg: listing.minOrderKg || 1000,
        deliveryAddress: '',
        isSubmitting: false,
        error: null,
        success: false,
      });
      return;
    }

    // --- BUYER: REQUEST_QUOTE listing → check for open RFQ ---
    if (user.role === 'BUYER' && listing.transactionMode === 'REQUEST_QUOTE') {
      try {
        const rfqs = await marketplaceService.getQuoteRequests(listing.id);
        const openRfq = rfqs.find((r) => r.status === 'OPEN');
        if (openRfq) {
          setRfqModalData({
            isOpen: true,
            mode: 'SUBMIT_QUOTE',
            quoteRequestId: openRfq.id,
            listingId: listing.id,
            listingTitle: listing.title,
            maxAvailableKg: listing.quantityAvailableKg,
            minOrderKg: listing.minOrderKg,
            basePricePerKg: listing.pricePerKg,
          });
        } else {
          showToast('No open RFQ round for this listing yet. The supplier has not opened bidding. You can view all RFQs in Quote Requests.', 'info');
          setTimeout(() => navigate(`/quote-requests?listingId=${listing.id}`), 3000);
        }
      } catch {
        showToast('Unable to check RFQ status. Please try again.', 'error');
      }
      return;
    }

    // --- ADMIN: navigate to quote-requests page ---
    if (user.role === 'ADMIN') {
      navigate(`/quote-requests?listingId=${listing.id}`);
      return;
    }

    showToast('Action not available for your account role.', 'error');
  };

  const handleSubmitDirectOrder = async () => {
    const { listing, quantityKg, deliveryAddress } = directOrderModal;
    if (!listing) return;

    if (!deliveryAddress.trim()) {
      setDirectOrderModal((prev) => ({
        ...prev,
        error: 'Delivery address is required to calculate transport cost.',
      }));
      return;
    }

    if (quantityKg < (listing.minOrderKg || 1000)) {
      setDirectOrderModal((prev) => ({
        ...prev,
        error: `Minimum order is ${(listing.minOrderKg / 1000).toFixed(1)} tonnes (${listing.minOrderKg.toLocaleString()} kg)`,
      }));
      return;
    }
    if (quantityKg > listing.quantityAvailableKg) {
      setDirectOrderModal((prev) => ({
        ...prev,
        error: `Cannot exceed available supply of ${(listing.quantityAvailableKg / 1000).toFixed(1)} tonnes`,
      }));
      return;
    }

    setDirectOrderModal((prev) => ({ ...prev, isSubmitting: true, error: null }));
    try {
      await orderService.createDirectOrder({
        listingId: listing.id,
        quantityKg,
        deliveryAddress: deliveryAddress || undefined,
      });
      setDirectOrderModal((prev) => ({ ...prev, isSubmitting: false, success: true }));
      loadListings();
    } catch (err: any) {
      setDirectOrderModal((prev) => ({
        ...prev,
        isSubmitting: false,
        error: err.response?.data?.error?.message || err.message || 'Failed to place order',
      }));
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
                      {user?.role === 'SUPPLIER'
                        ? 'Open RFQ'
                        : item.transactionMode === 'FIXED_PRICE'
                        ? 'Procure Now'
                        : 'Submit Bid'}
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

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in slide-in-from-bottom-4 max-w-sm text-center ${
            toast.type === 'error'
              ? 'bg-rose-950 border-rose-500/50 text-rose-200'
              : 'bg-charcoal-900 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Direct Order Modal (FIXED_PRICE listings for buyers) */}
      {directOrderModal.isOpen && directOrderModal.listing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-charcoal-900 border border-emerald-950/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-emerald-950/60">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Place Direct Order</h2>
                  <p className="text-xs text-slate-400 line-clamp-1">{directOrderModal.listing.title}</p>
                </div>
              </div>
              <button
                onClick={() => setDirectOrderModal((p) => ({ ...p, isOpen: false }))}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {directOrderModal.success ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <p className="text-white font-bold text-sm">Order Placed Successfully!</p>
                <p className="text-xs text-slate-400">Your order has been confirmed. Track it in the Orders section.</p>
                <div className="flex justify-center space-x-3 pt-2">
                  <button
                    onClick={() => setDirectOrderModal((p) => ({ ...p, isOpen: false }))}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs"
                  >
                    Continue Browsing
                  </button>
                  <button
                    onClick={() => navigate('/orders')}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-charcoal-950 font-bold text-xs"
                  >
                    View My Orders
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Listing Summary */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-charcoal-950 border border-emerald-950">
                    <span className="text-[10px] text-slate-500 block">Available</span>
                    <span className="font-bold text-white font-mono">
                      {(directOrderModal.listing.quantityAvailableKg / 1000).toFixed(0)} T
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-charcoal-950 border border-emerald-950">
                    <span className="text-[10px] text-slate-500 block">Purity</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {directOrderModal.listing.purityPercentage}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-charcoal-950 border border-emerald-950">
                    <span className="text-[10px] text-slate-500 block">Rate</span>
                    <span className="font-bold text-brand-400 font-mono">
                      ₹{directOrderModal.listing.pricePerKg.toFixed(2)}/kg
                    </span>
                  </div>
                </div>

                {/* Quantity Slider */}
                <div>
                  <div className="flex justify-between text-slate-300 mb-1.5 font-semibold uppercase tracking-wider">
                    <span>Order Quantity</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {(directOrderModal.quantityKg / 1000).toFixed(1)} T ({directOrderModal.quantityKg.toLocaleString()} kg)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={directOrderModal.listing.minOrderKg}
                    max={directOrderModal.listing.quantityAvailableKg}
                    step={Math.max(1000, Math.floor(directOrderModal.listing.quantityAvailableKg / 20))}
                    value={directOrderModal.quantityKg}
                    onChange={(e) =>
                      setDirectOrderModal((p) => ({ ...p, quantityKg: Number(e.target.value), error: null }))
                    }
                    className="w-full accent-emerald-500 bg-charcoal-950 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>Min: {(directOrderModal.listing.minOrderKg / 1000).toFixed(1)} T</span>
                    <span>Max: {(directOrderModal.listing.quantityAvailableKg / 1000).toFixed(1)} T</span>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-slate-300 mb-1.5 font-semibold uppercase tracking-wider">
                    Delivery Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot 12, GIDC Sanand, Ahmedabad, Gujarat"
                    value={directOrderModal.deliveryAddress}
                    onChange={(e) =>
                      setDirectOrderModal((p) => ({ ...p, deliveryAddress: e.target.value, error: null }))
                    }
                    className={`w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border text-white placeholder:text-slate-600 focus:outline-none transition-colors ${
                      directOrderModal.deliveryAddress.trim()
                        ? 'border-emerald-500/50 focus:border-brand-500'
                        : 'border-rose-500/50 focus:border-rose-400'
                    }`}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Required — transport & logistics cost is calculated based on this delivery address.
                  </p>
                </div>

                {/* Order Summary */}
                <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950 space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>CO₂ Cost ({(directOrderModal.quantityKg / 1000).toFixed(1)} T × ₹{directOrderModal.listing.pricePerKg}/kg):</span>
                    <strong className="text-white font-mono">
                      ₹{(directOrderModal.quantityKg * directOrderModal.listing.pricePerKg).toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Transport Cost:</span>
                    <span className="font-mono text-slate-400 text-[11px]">Calculated from delivery address → supplier</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Handling + QA Audit:</span>
                    <span className="font-mono">₹2,500</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Platform Fee (2.5%):</span>
                    <span className="font-mono text-slate-400 text-[11px]">Applied on subtotal</span>
                  </div>
                  <div className="pt-1.5 border-t border-emerald-950/60 flex justify-between text-slate-300 font-semibold">
                    <span>Total (estimated):</span>
                    <span className="text-brand-400 font-mono font-bold">Confirmed at order creation</span>
                  </div>
                </div>

                {directOrderModal.error && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{directOrderModal.error}</span>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setDirectOrderModal((p) => ({ ...p, isOpen: false }))}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitDirectOrder}
                    disabled={directOrderModal.isSubmitting || !directOrderModal.deliveryAddress.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {directOrderModal.isSubmitting ? (
                      <span>Placing Order...</span>
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Confirm Order</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
