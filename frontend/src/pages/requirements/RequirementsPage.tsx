import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService, CreateRequirementInput } from '../../services/marketplaceService';
import { CO2Requirement, AIMatchResult } from '../../types';
import { SkeletonTable } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { MatchDrawer } from '../../components/MatchDrawer';
import { RFQQuoteModal } from '../../components/RFQQuoteModal';
import {
  Layers,
  PlusCircle,
  CheckCircle2,
  Sparkles,
  Zap,
  Trash2,
  Edit,
  ArrowRight,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const RequirementsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [requirements, setRequirements] = useState<CO2Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<CO2Requirement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form State with Tonne <-> KG handling
  const [unitMode, setUnitMode] = useState<'TONNES' | 'KG'>('TONNES');
  const [quantityInput, setQuantityInput] = useState<number>(30);
  const [form, setForm] = useState<CreateRequirementInput>({
    title: '',
    description: '',
    quantityRequiredKg: 30000,
    minPurityPercentage: 99.0,
    maxPricePerKg: 5.0,
    preferredState: 'Liquid',
    targetDeliveryDate: '',
  });

  // Pre-fill form from calculator URL params
  useEffect(() => {
    const titleParam = searchParams.get('title');
    const quantityParam = searchParams.get('quantity');
    if (titleParam || quantityParam) {
      const qty = quantityParam ? Number(quantityParam) : 30;
      setForm((prev) => ({
        ...prev,
        title: titleParam || prev.title,
        quantityRequiredKg: qty * 1000,
      }));
      setQuantityInput(qty);
      setShowForm(true);
    }
  }, []);

  // AI Matching Drawer State
  const [activeRequirementForMatches, setActiveRequirementForMatches] = useState<CO2Requirement | null>(null);
  const [matchResults, setMatchResults] = useState<{
    isOpen: boolean;
    matches: AIMatchResult[];
    bestDeal: AIMatchResult | null;
  }>({ isOpen: false, matches: [], bestDeal: null });

  // RFQ Modal State
  const [rfqModalData, setRfqModalData] = useState<{
    isOpen: boolean;
    listingId?: string;
    quoteRequestId?: string;
    listingTitle?: string;
    maxAvailableKg?: number;
    minOrderKg?: number;
    basePricePerKg?: number;
  }>({ isOpen: false });

  const loadRequirements = async () => {
    try {
      setLoading(true);
      const data = await marketplaceService.getRequirements();
      setRequirements(data);
    } catch (err) {
      console.error('Failed to load requirements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, []);

  const handleOpenCreate = () => {
    setEditingRequirement(null);
    setForm({
      title: '',
      description: '',
      quantityRequiredKg: 30000,
      minPurityPercentage: 99.0,
      maxPricePerKg: 5.0,
      preferredState: 'Liquid',
      targetDeliveryDate: '',
    });
    setQuantityInput(30);
    setUnitMode('TONNES');
    setShowForm(true);
  };

  const handleOpenEdit = (req: CO2Requirement) => {
    setEditingRequirement(req);
    setForm({
      title: req.title,
      description: req.description || '',
      quantityRequiredKg: req.quantityRequiredKg,
      minPurityPercentage: req.minPurityPercentage,
      maxPricePerKg: req.maxPricePerKg || 5.0,
      preferredState: req.preferredState || 'Liquid',
      targetDeliveryDate: req.targetDeliveryDate ? req.targetDeliveryDate.split('T')[0] : '',
    });
    setQuantityInput(req.quantityRequiredKg / 1000);
    setUnitMode('TONNES');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const finalQuantityKg = unitMode === 'TONNES' ? quantityInput * 1000 : quantityInput;

    try {
      if (editingRequirement) {
        await marketplaceService.updateRequirement(editingRequirement.id, {
          ...form,
          quantityRequiredKg: finalQuantityKg,
        });
        setMessage('CO2 requirement updated successfully!');
      } else {
        await marketplaceService.createRequirement({
          ...form,
          quantityRequiredKg: finalQuantityKg,
        });
        setMessage('CO2 procurement requirement posted to marketplace!');
      }
      setShowForm(false);
      setEditingRequirement(null);
      loadRequirements();
    } catch (err: any) {
      setMessage(err.response?.data?.error?.message || 'Failed to submit requirement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this CO2 requirement?')) return;
    try {
      await marketplaceService.deleteRequirement(id);
      setMessage('Requirement removed.');
      loadRequirements();
    } catch (err: any) {
      setMessage(err.response?.data?.error?.message || 'Failed to delete requirement.');
    }
  };

  const handleTriggerMatching = async (req: CO2Requirement) => {
    try {
      setActiveRequirementForMatches(req);
      const data = await marketplaceService.findMatchesForRequirement(req.id);
      setMatchResults({
        isOpen: true,
        matches: data.matches,
        bestDeal: data.bestDeal,
      });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to run AI Matchmaking Engine');
    }
  };

  const handleSelectListingForRFQ = async (listingId: string) => {
    try {
      setMatchResults({ ...matchResults, isOpen: false });
      const rfqs = await marketplaceService.getQuoteRequests(listingId);
      const openRfq = rfqs.find((r) => r.status === 'OPEN');
      if (openRfq) {
        setRfqModalData({
          isOpen: true,
          listingId,
          quoteRequestId: openRfq.id,
          listingTitle: openRfq.listing?.title,
          maxAvailableKg: openRfq.listing?.quantityAvailableKg,
          minOrderKg: openRfq.listing?.minOrderKg,
          basePricePerKg: openRfq.listing?.pricePerKg,
        });
      } else {
        navigate(`/quote-requests?listingId=${listingId}`);
      }
    } catch (e) {
      navigate(`/quote-requests?listingId=${listingId}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Buyer Offtake Feedstock
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3 mt-1">
            <Layers className="w-7 h-7 text-cyan-400" />
            <span>CO2 Offtake Requirements</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Post buyer demand for polymer synthesis, concrete carbonation curing, or e-fuels with AI Matchmaking
          </p>
        </div>

        {user?.role === 'BUYER' && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-charcoal-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all self-start sm:self-center"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showForm ? 'Close Form' : 'Post New Offtake Demand'}</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Post / Edit Requirement Modal Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-charcoal-900 border border-cyan-500/30 p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-cyan-950/60">
            <h2 className="text-base font-bold text-white">
              {editingRequirement ? 'Edit CO2 Offtake Requirement' : 'Post Industrial CO2 Demand (Buyer Requirement)'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Requirement Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Monthly High-Purity CO2 for Mineral Concrete Carbonation Curing"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-cyan-950 text-xs text-white focus:border-cyan-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Target Quantity
                </label>
                <div className="flex items-center space-x-1 bg-charcoal-950 p-0.5 rounded-lg border border-cyan-950">
                  <button
                    type="button"
                    onClick={() => setUnitMode('TONNES')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      unitMode === 'TONNES'
                        ? 'bg-cyan-500 text-charcoal-950'
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
                        ? 'bg-cyan-500 text-charcoal-950'
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
                className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-cyan-950 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                = {(unitMode === 'TONNES' ? quantityInput * 1000 : quantityInput).toLocaleString()} kg normalized
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Minimum Purity (%) *
              </label>
              <input
                type="number"
                min="50"
                max="100"
                step="0.1"
                required
                value={form.minPurityPercentage}
                onChange={(e) => setForm({ ...form, minPurityPercentage: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-cyan-950 text-xs text-cyan-400 font-mono font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Max Budget (₹/kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="20"
                value={form.maxPricePerKg || ''}
                onChange={(e) => setForm({ ...form, maxPricePerKg: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-cyan-950 text-xs text-brand-400 font-mono font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Preferred Physical State
              </label>
              <select
                value={form.preferredState || 'Liquid'}
                onChange={(e) => setForm({ ...form, preferredState: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-cyan-950 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="Liquid">Liquid (Cryogenic Road Tanker)</option>
                <option value="Compressed Gas">Compressed Gas (Tube Trailer)</option>
                <option value="Solid">Solid (Dry Ice Blocks / Pellets)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Utilization Purpose / Description
              </label>
              <textarea
                rows={2}
                placeholder="Provide details about offtake schedule, end-product synthesis, or precast concrete curing specs..."
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-cyan-950 text-xs text-white focus:border-cyan-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-cyan-950/60">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-charcoal-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : editingRequirement ? 'Save Changes' : 'Post Demand to Marketplace'}
            </button>
          </div>
        </form>
      )}

      {/* Requirements List / Table */}
      {loading ? (
        <SkeletonTable rows={4} />
      ) : requirements.length === 0 ? (
        <EmptyState
          title="No Requirements Posted"
          description="You have not published any CO2 demand requirements yet."
          actionText="Post Requirement"
          onActionClick={handleOpenCreate}
        />
      ) : (
        <div className="rounded-3xl bg-charcoal-900 border border-cyan-950/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-charcoal-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-cyan-950/60">
                <tr>
                  <th className="p-4">Demand Title & Buyer</th>
                  <th className="p-4">Target Volume</th>
                  <th className="p-4">Min Purity</th>
                  <th className="p-4">Max Budget</th>
                  <th className="p-4">State</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">AI Matchmaking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-950/40">
                {requirements.map((r) => (
                  <tr key={r.id} className="hover:bg-charcoal-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{r.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {r.buyerCompany?.name} ({r.buyerCompany?.city || 'Gujarat'})
                      </div>
                    </td>

                    <td className="p-4 font-mono">
                      <div className="font-bold text-white">
                        {(r.quantityRequiredKg / 1000).toFixed(1)} Tonnes
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {r.quantityRequiredKg.toLocaleString()} kg
                      </div>
                    </td>

                    <td className="p-4 font-mono text-cyan-400 font-bold text-sm">
                      {r.minPurityPercentage}%
                    </td>

                    <td className="p-4 font-mono font-bold text-brand-400">
                      ₹{r.maxPricePerKg ? r.maxPricePerKg.toFixed(2) : '5.00'}/kg
                    </td>

                    <td className="p-4 text-slate-300">{r.preferredState || 'Liquid'}</td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                        {r.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Trigger AI Matching Engine */}
                        <button
                          onClick={() => handleTriggerMatching(r)}
                          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Find Matches</span>
                        </button>

                        {user?.companyId === r.buyerCompanyId && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(r)}
                              title="Edit Requirement"
                              className="p-2 rounded-xl bg-charcoal-950 hover:bg-charcoal-800 text-slate-300 border border-cyan-950"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              title="Delete Requirement"
                              className="p-2 rounded-xl bg-charcoal-950 hover:bg-rose-950/60 text-rose-400 border border-cyan-950"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Matchmaker Drawer */}
      <MatchDrawer
        isOpen={matchResults.isOpen}
        matches={matchResults.matches}
        bestDeal={matchResults.bestDeal}
        requirement={activeRequirementForMatches}
        onClose={() => setMatchResults({ ...matchResults, isOpen: false })}
        onSelectListingForRFQ={handleSelectListingForRFQ}
      />

      {/* RFQ Quote Modal */}
      <RFQQuoteModal
        isOpen={rfqModalData.isOpen}
        mode="SUBMIT_QUOTE"
        listingId={rfqModalData.listingId}
        quoteRequestId={rfqModalData.quoteRequestId}
        listingTitle={rfqModalData.listingTitle}
        maxAvailableKg={rfqModalData.maxAvailableKg}
        minOrderKg={rfqModalData.minOrderKg}
        basePricePerKg={rfqModalData.basePricePerKg}
        onClose={() => setRfqModalData({ ...rfqModalData, isOpen: false })}
        onSuccess={() => {
          setMessage('Quote submitted successfully on RFQ!');
          navigate('/quote-requests');
        }}
      />
    </div>
  );
};
