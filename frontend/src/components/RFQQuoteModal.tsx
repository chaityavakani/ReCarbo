import React, { useState, useEffect } from 'react';
import { X, Scale, AlertCircle, CheckCircle2 } from 'lucide-react';
import { marketplaceService } from '../services/marketplaceService';
import { AllocationPolicy } from '../types';

interface RFQQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'SUBMIT_QUOTE' | 'CREATE_RFQ';
  quoteRequestId?: string;
  listingId?: string;
  listingTitle?: string;
  maxAvailableKg?: number;
  minOrderKg?: number;
  basePricePerKg?: number;
  onSuccess?: () => void;
}

export const RFQQuoteModal: React.FC<RFQQuoteModalProps> = ({
  isOpen,
  onClose,
  mode,
  quoteRequestId,
  listingId,
  listingTitle,
  maxAvailableKg = 50000,
  minOrderKg = 1000,
  basePricePerKg = 4.5,
  onSuccess,
}) => {
  const [offeredQuantityTonnes, setOfferedQuantityTonnes] = useState<number>(
    Math.min(25, maxAvailableKg / 1000)
  );
  const [offeredPricePerKg, setOfferedPricePerKg] = useState<number>(basePricePerKg);
  const [deadlineDays, setDeadlineDays] = useState<number>(5);
  const [allocationPolicy, setAllocationPolicy] = useState<AllocationPolicy>('BEST_VALUE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOfferedQuantityTonnes(Math.min(25, maxAvailableKg / 1000));
      setOfferedPricePerKg(basePricePerKg);
      setDeadlineDays(5);
      setAllocationPolicy('BEST_VALUE');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, listingId, quoteRequestId]);

  if (!isOpen) return null;

  const offeredQuantityKg = offeredQuantityTonnes * 1000;
  const totalOfferValue = offeredQuantityKg * offeredPricePerKg;

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteRequestId) {
      setError('RFQ identifier is missing');
      return;
    }
    if (offeredQuantityKg < minOrderKg) {
      setError(`Offered quantity (${offeredQuantityKg} kg) cannot be less than min order (${minOrderKg} kg)`);
      return;
    }
    if (offeredQuantityKg > maxAvailableKg) {
      setError(`Offered quantity cannot exceed available supply (${maxAvailableKg} kg)`);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await marketplaceService.submitQuote(quoteRequestId, { offeredQuantityKg, offeredPricePerKg });
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to submit quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingId) {
      setError('Listing ID is missing');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const deadline = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString();
      await marketplaceService.createQuoteRequest({ listingId, deadline, allocationPolicy });
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to open RFQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-charcoal-900 border border-emerald-950/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-emerald-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {mode === 'SUBMIT_QUOTE' ? 'Submit Procurement Bid (RFQ)' : 'Open Request for Quotation (RFQ)'}
              </h2>
              <p className="text-xs text-slate-400">{listingTitle || 'CO2 Supply Stream'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-white font-bold text-sm">
              {mode === 'SUBMIT_QUOTE' ? 'Bid Submitted Successfully!' : 'RFQ Opened for Bidding!'}
            </p>
            <p className="text-xs text-slate-400">
              {mode === 'SUBMIT_QUOTE'
                ? 'Your procurement bid has been recorded. You will be notified when allocation is executed.'
                : 'Buyers can now submit bids. Execute allocation from the Quote Requests page.'}
            </p>
            <div className="flex justify-center pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-charcoal-950 font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'SUBMIT_QUOTE' ? (
              <form onSubmit={handleSubmitQuote} className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1.5 font-semibold uppercase tracking-wider">
                    <span>Requested Quantity</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {offeredQuantityTonnes} Tonnes ({offeredQuantityKg.toLocaleString()} kg)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={minOrderKg / 1000}
                    max={Math.max(maxAvailableKg / 1000, minOrderKg / 1000)}
                    step="0.5"
                    value={offeredQuantityTonnes}
                    onChange={(e) => setOfferedQuantityTonnes(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-charcoal-950 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>Min: {(minOrderKg / 1000).toFixed(1)} T</span>
                    <span>Max Available: {(maxAvailableKg / 1000).toFixed(1)} T</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1.5 font-semibold uppercase tracking-wider">
                    Offered Price (₹ / kg)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="20"
                    required
                    value={offeredPricePerKg}
                    onChange={(e) => setOfferedPricePerKg(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-white font-mono font-bold focus:border-brand-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                    Listed baseline: ₹{basePricePerKg.toFixed(2)}/kg
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950 space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Offered Bid Volume:</span>
                    <strong className="text-white font-mono">{offeredQuantityKg.toLocaleString()} kg</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Offer Value:</span>
                    <strong className="text-brand-400 font-mono text-sm">
                      ₹{totalOfferValue.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold text-xs shadow-md shadow-brand-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Confirm Bid Submission'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateRFQ} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1.5 font-semibold uppercase tracking-wider">
                    Bidding Duration (Days)
                  </label>
                  <select
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value={1}>24 Hours (Express RFQ)</option>
                    <option value={3}>3 Days</option>
                    <option value={5}>5 Days (Standard)</option>
                    <option value={7}>7 Days (1 Week)</option>
                    <option value={14}>14 Days (Extended)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1.5 font-semibold uppercase tracking-wider">
                    Allocation Strategy Policy
                  </label>
                  <select
                    value={allocationPolicy}
                    onChange={(e) => setAllocationPolicy(e.target.value as AllocationPolicy)}
                    className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="BEST_VALUE">Best-Value Score (Price + Qty + Proximity + Trust)</option>
                    <option value="HIGHEST_PRICE">Highest-Price-First (Maximizes Stream Revenue)</option>
                    <option value="FCFS">First-Come-First-Served (Time Priority)</option>
                  </select>
                </div>

                <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950 space-y-1.5 text-slate-400">
                  <span className="font-bold text-white block">Automated Transaction Engine:</span>
                  <p>
                    When the deadline passes, the system evaluates all submitted buyer bids atomically and
                    allocates according to your selected policy.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold text-xs shadow-md shadow-brand-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Opening...' : 'Open RFQ for Bidding'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
