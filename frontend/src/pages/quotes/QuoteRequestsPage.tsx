import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { marketplaceService } from '../../services/marketplaceService';
import { QuoteRequest, Quote, AllocationPolicy } from '../../types';
import { SkeletonTable } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { RFQQuoteModal } from '../../components/RFQQuoteModal';
import { TrustBadge } from '../../components/TrustBadge';
import {
  Scale,
  Clock,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  Zap,
  Users,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Award,
  Layers,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export const QuoteRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [searchParams] = useSearchParams();
  const filterListingId = searchParams.get('listingId');

  const [rfqs, setRfqs] = useState<QuoteRequest[]>([]);
  const [selectedRfq, setSelectedRfq] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isExecutingAllocation, setIsExecutingAllocation] = useState(false);

  // Policy selector for active RFQ
  const [selectedPolicy, setSelectedPolicy] = useState<AllocationPolicy>('BEST_VALUE');
  const [allocationPreview, setAllocationPreview] = useState<any>(null);

  // Modal State
  const [quoteModalData, setQuoteModalData] = useState<{
    isOpen: boolean;
    quoteRequestId?: string;
    listingTitle?: string;
    maxAvailableKg?: number;
    minOrderKg?: number;
    basePricePerKg?: number;
  }>({ isOpen: false });

  const loadRfqs = async () => {
    try {
      setLoading(true);
      const data = await marketplaceService.getQuoteRequests(filterListingId || undefined);
      setRfqs(data);
      if (data.length > 0 && !selectedRfq) {
        setSelectedRfq(data[0]);
        setSelectedPolicy(data[0].allocationPolicy);
      } else if (selectedRfq) {
        const refreshed = data.find((r) => r.id === selectedRfq.id);
        if (refreshed) setSelectedRfq(refreshed);
      }
    } catch (err) {
      console.error('Failed to load RFQs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRfqs();
  }, [filterListingId]);

  // Real-time Socket.IO Listeners
  useEffect(() => {
    if (!socket) return;

    const handleQuoteEvent = (quote: any) => {
      console.log('⚡ Socket event received:', quote);
      loadRfqs();
    };

    const handleAllocationEvent = (result: any) => {
      setMessage('🎉 Allocation completed atomically! Orders generated.');
      loadRfqs();
    };

    socket.on('quote:submitted', handleQuoteEvent);
    socket.on('quote:updated', handleQuoteEvent);
    socket.on('quote_request:created', handleQuoteEvent);
    socket.on('allocation:resolved', handleAllocationEvent);

    return () => {
      socket.off('quote:submitted', handleQuoteEvent);
      socket.off('quote:updated', handleQuoteEvent);
      socket.off('quote_request:created', handleQuoteEvent);
      socket.off('allocation:resolved', handleAllocationEvent);
    };
  }, [socket]);

  // Load preview when selected RFQ or Policy changes
  useEffect(() => {
    if (selectedRfq && selectedRfq.status === 'OPEN' && (selectedRfq.quotes?.length || 0) > 0) {
      marketplaceService
        .previewAllocation(selectedRfq.id, selectedPolicy)
        .then((res) => setAllocationPreview(res))
        .catch(() => setAllocationPreview(null));
    } else {
      setAllocationPreview(null);
    }
  }, [selectedRfq, selectedPolicy]);

  const handleExecuteAllocation = async () => {
    if (!selectedRfq) return;
    if (!window.confirm(`Execute atomic allocation for "${selectedRfq.listing.title}" under ${selectedPolicy} policy?`)) {
      return;
    }

    setIsExecutingAllocation(true);
    setMessage(null);
    try {
      const res = await marketplaceService.executeAllocation(selectedRfq.id, selectedPolicy);
      setMessage(`Allocation successful! Created ${res.orders?.length || 1} verified binding orders.`);
      loadRfqs();
    } catch (err: any) {
      setMessage(err.response?.data?.error?.message || 'Failed to execute allocation');
    } finally {
      setIsExecutingAllocation(false);
    }
  };

  // Find user's submitted quote in active RFQ
  const myQuote = selectedRfq?.quotes?.find((q) => q.buyerCompanyId === user?.companyId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
              TransactionStrategy Engine
            </span>
            <span className="flex items-center space-x-1 text-[11px] text-emerald-400">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isConnected ? 'Real-Time Socket Connected' : 'Connecting...'}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3 mt-1">
            <Scale className="w-7 h-7 text-amber-400" />
            <span>Request for Quotation (RFQ) Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Deterministic bidding, real-time quote books, and atomic multi-buyer lot allocation
          </p>
        </div>

        <button
          onClick={loadRfqs}
          className="p-2.5 rounded-xl bg-charcoal-900 border border-emerald-950 text-slate-400 hover:text-white transition-all self-start sm:self-center flex items-center space-x-1 text-xs"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Main Grid: RFQ Selector Sidebar + Active RFQ Workspace */}
      {loading ? (
        <SkeletonTable rows={4} />
      ) : rfqs.length === 0 ? (
        <EmptyState
          title="No Open RFQs"
          description="There are currently no open RFQ bidding rounds active."
          actionText="Browse Marketplace"
          onActionClick={() => window.location.assign('/marketplace')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: RFQs List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Active & Closed RFQ Rounds ({rfqs.length})
            </h3>

            <div className="space-y-2.5">
              {rfqs.map((rfq) => {
                const isSelected = selectedRfq?.id === rfq.id;
                const isClosed = rfq.status === 'ALLOCATED' || rfq.status === 'CLOSED';
                const quoteCount = rfq.quotes?.length || 0;

                return (
                  <div
                    key={rfq.id}
                    onClick={() => {
                      setSelectedRfq(rfq);
                      setSelectedPolicy(rfq.allocationPolicy);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-charcoal-900 border-amber-500/50 shadow-lg shadow-amber-500/10'
                        : 'bg-charcoal-950 border-emerald-950 hover:border-emerald-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                      <span className="px-2 py-0.5 rounded font-bold uppercase bg-charcoal-900 text-amber-300 border border-amber-500/30">
                        {rfq.allocationPolicy}
                      </span>
                      <span
                        className={`font-bold ${
                          isClosed ? 'text-slate-400' : 'text-emerald-400'
                        }`}
                      >
                        {rfq.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white leading-snug line-clamp-1">
                      {rfq.listing?.title}
                    </h4>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
                      <span>{(rfq.listing?.quantityAvailableKg / 1000).toFixed(0)} T available</span>
                      <span className="text-amber-400 font-bold">{quoteCount} Bids</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Selected RFQ Details & Real-Time Bid Book */}
          {selectedRfq && (
            <div className="lg:col-span-2 space-y-6">
              {/* RFQ Stream Summary Card */}
              <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-950/60">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-500/30">
                        RFQ Mode • {selectedRfq.listing?.stateOfMatter}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Deadline: {new Date(selectedRfq.deadline).toLocaleDateString()}</span>
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1">{selectedRfq.listing?.title}</h2>
                    <p className="text-xs text-slate-400">
                      Supplier: <strong className="text-white">{selectedRfq.listing?.supplierCompany?.name}</strong> (
                      {selectedRfq.listing?.supplierCompany?.city})
                    </p>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-[10px] text-slate-500 block">Baseline Rate</span>
                    <span className="text-base font-bold text-brand-400">
                      ₹{selectedRfq.listing?.pricePerKg.toFixed(2)} / kg
                    </span>
                  </div>
                </div>

                {/* RFQ Stream Stats */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-2xl bg-charcoal-950 border border-emerald-950">
                    <span className="text-[10px] text-slate-500 block">Total Lot Supply</span>
                    <span className="font-bold text-white font-mono">
                      {(selectedRfq.listing?.quantityAvailableKg / 1000).toFixed(1)} Tonnes
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-charcoal-950 border border-emerald-950">
                    <span className="text-[10px] text-slate-500 block">Assay Purity</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {selectedRfq.listing?.purityPercentage}%
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-charcoal-950 border border-emerald-950">
                    <span className="text-[10px] text-slate-500 block">Lot Split Allowed</span>
                    <span className="font-bold text-cyan-400">
                      {selectedRfq.listing?.isSplitAllowed ? 'Yes (Multi-Buyer)' : 'No (Single Winner)'}
                    </span>
                  </div>
                </div>

                {/* Buyer Perspective: "Your Offer & Rank" Card */}
                {user?.role === 'BUYER' && (
                  <div className="p-4 rounded-2xl bg-charcoal-950 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Your Submitted Quote Status
                      </span>
                      {myQuote ? (
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="font-mono font-bold text-white text-sm">
                            {(myQuote.offeredQuantityKg / 1000).toFixed(1)} T @ ₹{myQuote.offeredPricePerKg}/kg
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              myQuote.status === 'ACCEPTED'
                                ? 'bg-emerald-950 text-emerald-400'
                                : myQuote.status === 'REJECTED'
                                ? 'bg-rose-950 text-rose-400'
                                : 'bg-amber-950 text-amber-400'
                            }`}
                          >
                            {myQuote.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No bid submitted yet for this RFQ round.</span>
                      )}
                    </div>

                    {selectedRfq.status === 'OPEN' && (
                      <button
                        onClick={() =>
                          setQuoteModalData({
                            isOpen: true,
                            quoteRequestId: selectedRfq.id,
                            listingTitle: selectedRfq.listing?.title,
                            maxAvailableKg: selectedRfq.listing?.quantityAvailableKg,
                            minOrderKg: selectedRfq.listing?.minOrderKg,
                            basePricePerKg: selectedRfq.listing?.pricePerKg,
                          })
                        }
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold text-xs shadow-md shadow-brand-500/20"
                      >
                        {myQuote ? 'Update Offer' : 'Submit Bid Offer'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Live Quote Table & Allocation Engine Control Panel */}
              <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Live Quote Book & Allocation Engine</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Real-time submitted buyer bids ranked by TransactionStrategy
                    </p>
                  </div>

                  {/* Allocation Policy Switcher (Supplier / Admin) */}
                  {(user?.role === 'SUPPLIER' || user?.role === 'ADMIN') && selectedRfq.status === 'OPEN' && (
                    <div className="flex items-center space-x-2 bg-charcoal-950 p-1 rounded-xl border border-emerald-950 text-xs">
                      <span className="text-[10px] text-slate-400 uppercase pl-2 font-semibold">
                        Policy:
                      </span>
                      {(['BEST_VALUE', 'HIGHEST_PRICE', 'FCFS'] as AllocationPolicy[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setSelectedPolicy(p)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            selectedPolicy === p
                              ? 'bg-amber-500 text-charcoal-950 shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quotes Table */}
                {(!selectedRfq.quotes || selectedRfq.quotes.length === 0) ? (
                  <div className="text-center py-8 text-xs text-slate-500 rounded-2xl bg-charcoal-950 border border-emerald-950">
                    No buyer bids submitted yet for this RFQ round.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-emerald-950">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-charcoal-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-emerald-950">
                        <tr>
                          <th className="p-3">Rank</th>
                          <th className="p-3">Buyer Company</th>
                          <th className="p-3">Requested Vol</th>
                          <th className="p-3">Bid Rate</th>
                          <th className="p-3">Total Offer</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-950/60 bg-charcoal-950">
                        {(allocationPreview?.rankedOffers || selectedRfq.quotes).map((q: any, idx: number) => {
                          const isWinner = allocationPreview?.winners?.some((w: any) => w.quoteId === (q.quoteId || q.id));

                          return (
                            <tr
                              key={q.id || q.quoteId}
                              className={`transition-colors ${
                                isWinner
                                  ? 'bg-emerald-950/30'
                                  : 'hover:bg-charcoal-900/50'
                              }`}
                            >
                              <td className="p-3 font-mono">
                                <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center font-bold text-[10px] ${
                                  idx === 0 ? 'bg-amber-500 text-charcoal-950' : 'bg-charcoal-900 text-slate-400'
                                }`}>
                                  #{idx + 1}
                                </span>
                              </td>

                              <td className="p-3">
                                <div className="font-bold text-white">
                                  {q.buyerCompany?.name || 'Buyer Enterprise'}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {q.buyerCompany?.city || 'Gujarat'}
                                </div>
                              </td>

                              <td className="p-3 font-mono">
                                {((q.offeredQuantityKg || q.requestedQuantityKg) / 1000).toFixed(1)} Tonnes
                              </td>

                              <td className="p-3 font-mono font-bold text-brand-400">
                                ₹{(q.offeredPricePerKg || q.pricePerKg)?.toFixed(2)}/kg
                              </td>

                              <td className="p-3 font-mono text-white">
                                ₹{(
                                  (q.offeredQuantityKg || q.requestedQuantityKg) *
                                  (q.offeredPricePerKg || q.pricePerKg)
                                ).toLocaleString()}
                              </td>

                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isWinner
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-charcoal-900 text-slate-400'
                                  }`}
                                >
                                  {isWinner ? 'ALLOCATED WINNER' : q.status || 'EVALUATING'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Dry Run Allocation Simulation Summary */}
                {allocationPreview && (
                  <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-500/30 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Simulated Winners under <strong>{selectedPolicy}</strong>:</span>
                      <strong className="text-emerald-400 font-mono">
                        {allocationPreview.winners.length} Buyer(s) Selected
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Total Allocated Supply:</span>
                      <strong className="text-white font-mono">
                        {(
                          allocationPreview.winners.reduce(
                            (acc: number, w: any) => acc + w.allocatedQuantityKg,
                            0
                          ) / 1000
                        ).toFixed(1)}{' '}
                        / {(allocationPreview.totalAvailableKg / 1000).toFixed(1)} Tonnes
                      </strong>
                    </div>
                  </div>
                )}

                {/* Execution Button (Supplier / Admin) */}
                {(user?.role === 'SUPPLIER' || user?.role === 'ADMIN') &&
                  selectedRfq.status === 'OPEN' &&
                  (selectedRfq.quotes?.length || 0) > 0 && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleExecuteAllocation}
                        disabled={isExecutingAllocation}
                        className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-charcoal-950 font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                      >
                        <Award className="w-4 h-4" />
                        <span>
                          {isExecutingAllocation ? 'Executing Lock & Allocation...' : 'Execute Atomic Allocation & Generate Orders'}
                        </span>
                      </button>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quote Submission Modal */}
      <RFQQuoteModal
        isOpen={quoteModalData.isOpen}
        mode="SUBMIT_QUOTE"
        quoteRequestId={quoteModalData.quoteRequestId}
        listingId={selectedRfq?.listingId}
        listingTitle={quoteModalData.listingTitle}
        maxAvailableKg={quoteModalData.maxAvailableKg}
        minOrderKg={quoteModalData.minOrderKg}
        basePricePerKg={quoteModalData.basePricePerKg}
        onClose={() => setQuoteModalData({ ...quoteModalData, isOpen: false })}
        onSuccess={() => {
          setMessage('Your quote bid was successfully submitted to the RFQ engine!');
          loadRfqs();
        }}
      />
    </div>
  );
};
