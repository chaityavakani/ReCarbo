import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService } from '../../services/marketplaceService';
import { CO2Requirement } from '../../types';
import { SkeletonTable } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Layers, PlusCircle, CheckCircle2 } from 'lucide-react';

export const RequirementsPage: React.FC = () => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<CO2Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    quantityRequiredKg: 20000,
    minPurityPercentage: 99.0,
    maxPricePerKg: 4.8,
    preferredState: 'Liquid',
    targetDeliveryDate: '',
  });

  const loadRequirements = async () => {
    try {
      const data = await marketplaceService.getRequirements();
      setRequirements(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    try {
      await marketplaceService.createRequirement(form);
      setMessage('Procurement requirement submitted successfully!');
      setShowForm(false);
      loadRequirements();
    } catch (err: any) {
      setMessage(err.response?.data?.error?.message || 'Failed to post requirement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Layers className="w-7 h-7 text-cyan-400" />
            <span>CO2 Offtake Requirements</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Buyer procurement demand for polymer, chemical, or concrete curing feedstock
          </p>
        </div>

        {user?.role === 'BUYER' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-charcoal-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all self-start sm:self-center"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showForm ? 'Close Form' : 'Post New Requirement'}</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Creation Modal / Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-3xl bg-charcoal-900 border border-cyan-500/30 p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        >
          <h2 className="text-base font-bold text-white">Post Buyer CO2 Demand</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Requirement Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Monthly High-Purity CO2 for Mineral Precast Concrete"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-cyan-950 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Required Quantity (KG)
              </label>
              <input
                type="number"
                required
                value={form.quantityRequiredKg}
                onChange={(e) => setForm({ ...form, quantityRequiredKg: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-cyan-950 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Minimum Purity (%)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={form.minPurityPercentage}
                onChange={(e) => setForm({ ...form, minPurityPercentage: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-cyan-950 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Max Budget (₹/kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.maxPricePerKg}
                onChange={(e) => setForm({ ...form, maxPricePerKg: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-cyan-950 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Preferred Physical State
              </label>
              <select
                value={form.preferredState}
                onChange={(e) => setForm({ ...form, preferredState: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-cyan-950 text-xs text-white"
              >
                <option value="Liquid">Liquid (Cryogenic Tanker)</option>
                <option value="Compressed Gas">Compressed Gas</option>
                <option value="Solid">Solid Dry Ice</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-charcoal-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Post Requirement'}
            </button>
          </div>
        </form>
      )}

      {/* Requirements Table */}
      {loading ? (
        <SkeletonTable rows={3} />
      ) : requirements.length === 0 ? (
        <EmptyState
          title="No Requirements Posted"
          description="You have not published any CO2 demand requirements yet."
          actionText="Post Requirement"
          onActionClick={() => setShowForm(true)}
        />
      ) : (
        <div className="rounded-3xl bg-charcoal-900 border border-cyan-950/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-charcoal-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-cyan-950/60">
                <tr>
                  <th className="p-4">Demand Title & Buyer</th>
                  <th className="p-4">Target Quantity</th>
                  <th className="p-4">Min Purity</th>
                  <th className="p-4">Max Budget</th>
                  <th className="p-4">State</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-950/40">
                {requirements.map((r) => (
                  <tr key={r.id} className="hover:bg-charcoal-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{r.title}</div>
                      <div className="text-[11px] text-slate-400">{r.buyerCompany?.name}</div>
                    </td>
                    <td className="p-4 font-mono font-bold text-white">
                      {(r.quantityRequiredKg / 1000).toFixed(1)} Tonnes
                    </td>
                    <td className="p-4 font-mono text-cyan-400 font-bold">{r.minPurityPercentage}%</td>
                    <td className="p-4 font-mono font-bold text-brand-400">
                      ₹{r.maxPricePerKg ? r.maxPricePerKg.toFixed(2) : '5.00'}/kg
                    </td>
                    <td className="p-4 text-slate-300">{r.preferredState || 'Liquid'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
