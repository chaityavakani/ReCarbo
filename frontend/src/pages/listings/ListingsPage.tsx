import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService } from '../../services/marketplaceService';
import { CO2Listing } from '../../types';
import { SkeletonTable } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Layers, Plus, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export const ListingsPage: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<CO2Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    quantityAvailableKg: 25000,
    minOrderKg: 1000,
    purityPercentage: 99.5,
    captureMethod: 'Post-Combustion Amine Absorption',
    stateOfMatter: 'Liquid',
    pressureBar: 20,
    temperatureC: -20,
    pricePerKg: 4.2,
    isSplitAllowed: true,
    transactionMode: 'FIXED_PRICE',
  });

  const loadListings = async () => {
    try {
      const data = await marketplaceService.getListings();
      setListings(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    try {
      await marketplaceService.createListing(form);
      setMessage('New CO2 listing published successfully!');
      setShowForm(false);
      loadListings();
    } catch (err: any) {
      setMessage(err.response?.data?.error?.message || 'Failed to create listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Layers className="w-7 h-7 text-brand-400" />
            <span>CO2 Supply Listings</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your industrial captured CO2 inventory and pricing
          </p>
        </div>

        {user?.role === 'SUPPLIER' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-charcoal-950 font-bold text-xs shadow-lg shadow-brand-500/20 transition-all self-start sm:self-center"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showForm ? 'Close Form' : 'List New Captured CO2'}</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Creation Modal / Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-3xl bg-charcoal-900 border border-emerald-500/30 p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        >
          <h2 className="text-base font-bold text-white">Create New CO2 Supply Stream</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Listing Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ultra High Purity Liquid CO2 (99.9%) - Hazira Plant"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Quantity Available (KG)
              </label>
              <input
                type="number"
                required
                value={form.quantityAvailableKg}
                onChange={(e) => setForm({ ...form, quantityAvailableKg: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Purity Percentage (%)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={form.purityPercentage}
                onChange={(e) => setForm({ ...form, purityPercentage: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Price Per KG (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.pricePerKg}
                onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Physical State of Matter
              </label>
              <select
                value={form.stateOfMatter}
                onChange={(e) => setForm({ ...form, stateOfMatter: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white"
              >
                <option value="Liquid">Liquid (Cryogenic Tanker)</option>
                <option value="Compressed Gas">Compressed Gas (Tube Trailer)</option>
                <option value="Solid">Solid (Dry Ice Blocks / Pellets)</option>
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-charcoal-950 font-bold text-xs shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish CO2 Stream'}
            </button>
          </div>
        </form>
      )}

      {/* Listings Table */}
      {loading ? (
        <SkeletonTable rows={3} />
      ) : listings.length === 0 ? (
        <EmptyState
          title="No CO2 Listings Found"
          description="You have not published any captured CO2 inventory yet."
          actionText="Create Listing"
          onActionClick={() => setShowForm(true)}
        />
      ) : (
        <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-charcoal-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-emerald-950/60">
                <tr>
                  <th className="p-4">Title & Facility</th>
                  <th className="p-4">Quantity (kg / Tonnes)</th>
                  <th className="p-4">Purity</th>
                  <th className="p-4">Rate (₹/kg)</th>
                  <th className="p-4">Transaction Mode</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/40">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-charcoal-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{l.title}</div>
                      <div className="text-[11px] text-slate-400">{l.supplierCompany?.name}</div>
                    </td>
                    <td className="p-4 font-mono">
                      {l.quantityAvailableKg.toLocaleString()} kg{' '}
                      <span className="text-slate-400">({(l.quantityAvailableKg / 1000).toFixed(1)} T)</span>
                    </td>
                    <td className="p-4 font-mono text-emerald-400 font-bold">{l.purityPercentage}%</td>
                    <td className="p-4 font-mono font-bold text-white">₹{l.pricePerKg.toFixed(2)}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                        {l.transactionMode.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400">
                        {l.status}
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
