import React, { useState } from 'react';
import {
  X,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Thermometer,
  Gauge,
  Scale,
  DollarSign,
} from 'lucide-react';
import { CreateListingInput } from '../services/marketplaceService';

interface ListingCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateListingInput) => Promise<void>;
  initialData?: Partial<CreateListingInput>;
  isEditMode?: boolean;
}

export const ListingCreateModal: React.FC<ListingCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
}) => {
  const [step, setStep] = useState<'FORM' | 'PREVIEW'>('FORM');
  const [unitMode, setUnitMode] = useState<'TONNES' | 'KG'>('TONNES');
  const [quantityInput, setQuantityInput] = useState<number>(
    initialData?.quantityAvailableKg ? initialData.quantityAvailableKg / 1000 : 25
  );
  const [minOrderInput, setMinOrderInput] = useState<number>(
    initialData?.minOrderKg ? initialData.minOrderKg / 1000 : 2
  );

  const [form, setForm] = useState<CreateListingInput>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    quantityAvailableKg: initialData?.quantityAvailableKg || 25000,
    minOrderKg: initialData?.minOrderKg || 2000,
    purityPercentage: initialData?.purityPercentage || 99.5,
    captureMethod: initialData?.captureMethod || 'Post-Combustion Amine Absorption',
    stateOfMatter: initialData?.stateOfMatter || 'Liquid',
    pressureBar: initialData?.pressureBar ?? 20,
    temperatureC: initialData?.temperatureC ?? -20,
    pricePerKg: initialData?.pricePerKg || 4.5,
    isSplitAllowed: initialData?.isSplitAllowed ?? true,
    transactionMode: initialData?.transactionMode || 'FIXED_PRICE',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute normalized values in KG
  const finalQuantityKg = unitMode === 'TONNES' ? quantityInput * 1000 : quantityInput;
  const finalMinOrderKg = unitMode === 'TONNES' ? minOrderInput * 1000 : minOrderInput;
  const totalStreamValue = finalQuantityKg * form.pricePerKg;

  const handleProceedToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Listing title is required');
      return;
    }
    if (finalQuantityKg <= 0) {
      setError('Available quantity must be greater than 0');
      return;
    }
    if (finalMinOrderKg > finalQuantityKg) {
      setError('Minimum order size cannot exceed total available supply');
      return;
    }
    setError(null);
    setForm({
      ...form,
      quantityAvailableKg: finalQuantityKg,
      minOrderKg: finalMinOrderKg,
    });
    setStep('PREVIEW');
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        ...form,
        quantityAvailableKg: finalQuantityKg,
        minOrderKg: finalMinOrderKg,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to submit listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-charcoal-900 border border-emerald-950/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditMode ? 'Edit CO2 Supply Stream' : 'List New Captured CO2 Stream'}
              </h2>
              <p className="text-xs text-slate-400">
                {step === 'FORM'
                  ? 'Enter physical parameters and supply inventory'
                  : 'Review normalized parameters before publishing to the marketplace'}
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

        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: FORM */}
        {step === 'FORM' ? (
          <form onSubmit={handleProceedToPreview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Listing Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ultra High-Purity Liquid CO2 (99.8%) - Dahej Facility"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white focus:border-brand-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>

            {/* Quantity & Unit Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Total Quantity
                  </label>
                  <div className="flex items-center space-x-1 bg-charcoal-950 p-0.5 rounded-lg border border-emerald-950">
                    <button
                      type="button"
                      onClick={() => setUnitMode('TONNES')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        unitMode === 'TONNES'
                          ? 'bg-emerald-500 text-charcoal-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Tonnes
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnitMode('KG')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        unitMode === 'KG'
                          ? 'bg-emerald-500 text-charcoal-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      KG
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                  = {finalQuantityKg.toLocaleString()} kg normalized
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Min Order ({unitMode})
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={minOrderInput}
                  onChange={(e) => setMinOrderInput(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                  = {finalMinOrderKg.toLocaleString()} kg minimum lot
                </span>
              </div>
            </div>

            {/* Purity & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Purity Percentage (%) *
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  step="0.1"
                  required
                  value={form.purityPercentage}
                  onChange={(e) => setForm({ ...form, purityPercentage: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-emerald-400 font-mono font-bold focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Price Per KG (₹) *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.01"
                  required
                  value={form.pricePerKg}
                  onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-brand-400 font-mono font-bold focus:border-brand-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                  = ₹{(form.pricePerKg * 1000).toFixed(0)} / Tonne
                </span>
              </div>
            </div>

            {/* Physical State & Capture Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Physical Form *
                </label>
                <select
                  value={form.stateOfMatter}
                  onChange={(e) => setForm({ ...form, stateOfMatter: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="Liquid">Liquid (Cryogenic Tanker)</option>
                  <option value="Compressed Gas">Compressed Gas (Tube Trailer)</option>
                  <option value="Solid">Solid (Dry Ice Blocks)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Capture Technology
                </label>
                <select
                  value={form.captureMethod}
                  onChange={(e) => setForm({ ...form, captureMethod: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="Post-Combustion Amine Absorption">Post-Combustion Amine Absorption</option>
                  <option value="Direct Air Capture (DAC)">Direct Air Capture (DAC)</option>
                  <option value="Syngas / Ammonia Byproduct">Syngas / Ammonia Byproduct</option>
                  <option value="Biogenic Fermentation">Biogenic Fermentation</option>
                  <option value="Oxy-Fuel Combustion">Oxy-Fuel Combustion</option>
                </select>
              </div>
            </div>

            {/* Physical Specs: Pressure & Temp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Pressure (Bar)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.pressureBar ?? ''}
                  onChange={(e) => setForm({ ...form, pressureBar: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.temperatureC ?? ''}
                  onChange={(e) => setForm({ ...form, temperatureC: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Transaction Mode & Split Allowed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-charcoal-950 border border-emerald-950/60">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Transaction Model
                </label>
                <select
                  value={form.transactionMode}
                  onChange={(e) => setForm({ ...form, transactionMode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-900 border border-emerald-950 text-xs text-white"
                >
                  <option value="FIXED_PRICE">Fixed-Price (First-Come)</option>
                  <option value="REQUEST_QUOTE">Request for Quotation (RFQ)</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-4 sm:pt-6">
                <input
                  type="checkbox"
                  id="splitAllowed"
                  checked={form.isSplitAllowed}
                  onChange={(e) => setForm({ ...form, isSplitAllowed: e.target.checked })}
                  className="w-4 h-4 rounded accent-brand-500 bg-charcoal-900 border-emerald-950"
                />
                <label htmlFor="splitAllowed" className="text-xs text-slate-300 cursor-pointer">
                  Allow Multi-Buyer Lot Splitting
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Stream Description & Utilization Guidelines
              </label>
              <textarea
                rows={2}
                placeholder="Continuous liquid CO2 stream with COA certified food/pharma grade purity..."
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white focus:border-brand-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-emerald-950/60">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-charcoal-950 font-bold text-xs shadow-md shadow-brand-500/20"
              >
                <span>Preview Before Publishing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: PREVIEW-BEFORE-PUBLISH */
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span>
                Please verify your stream specifications. All values have been normalized to standard base units (KG).
              </span>
            </div>

            {/* Industrial Stream Card Preview */}
            <div className="rounded-3xl bg-charcoal-950 border border-emerald-500/40 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  {form.stateOfMatter} • {form.transactionMode?.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400">
                  Split: <strong className="text-emerald-400">{form.isSplitAllowed ? 'Allowed' : 'Single Buyer Only'}</strong>
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{form.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{form.captureMethod}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-3 rounded-2xl bg-charcoal-900 border border-emerald-950">
                  <span className="text-[10px] text-slate-500 block">Total Volume</span>
                  <span className="font-bold text-white font-mono text-sm">
                    {(finalQuantityKg / 1000).toFixed(1)} Tonnes
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    ({finalQuantityKg.toLocaleString()} kg)
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-charcoal-900 border border-emerald-950">
                  <span className="text-[10px] text-slate-500 block">Stream Purity</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    {form.purityPercentage}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Certified COA</span>
                </div>

                <div className="p-3 rounded-2xl bg-charcoal-900 border border-emerald-950">
                  <span className="text-[10px] text-slate-500 block">Base Rate</span>
                  <span className="font-bold text-brand-400 font-mono text-sm">
                    ₹{form.pricePerKg.toFixed(2)}/kg
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    ₹{(form.pricePerKg * 1000).toLocaleString()}/T
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-charcoal-900 border border-emerald-950">
                  <span className="text-[10px] text-slate-500 block">Total Valuation</span>
                  <span className="font-bold text-cyan-400 font-mono text-sm">
                    ₹{totalStreamValue.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Total Supply Value</span>
                </div>
              </div>

              {/* Physical Parameters Audit */}
              <div className="p-4 rounded-2xl bg-charcoal-900 border border-emerald-950 text-xs space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <Gauge className="w-3.5 h-3.5 text-slate-500" />
                    <span>Operating Pressure:</span>
                  </span>
                  <strong className="text-white font-mono">
                    {form.pressureBar ? `${form.pressureBar} bar` : 'Standard / Ambient'}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Storage Temperature:</span>
                  </span>
                  <strong className="text-white font-mono">
                    {form.temperatureC !== null && form.temperatureC !== undefined
                      ? `${form.temperatureC}°C`
                      : 'Ambient'}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <Scale className="w-3.5 h-3.5 text-slate-500" />
                    <span>Minimum Order Quantity:</span>
                  </span>
                  <strong className="text-white font-mono">
                    {finalMinOrderKg.toLocaleString()} kg ({(finalMinOrderKg / 1000).toFixed(1)} Tonnes)
                  </strong>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-emerald-950/60">
              <button
                type="button"
                onClick={() => setStep('FORM')}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Edit</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold text-xs shadow-lg shadow-brand-500/20 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Publishing...' : isEditMode ? 'Save Changes' : 'Confirm & Publish Stream'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
