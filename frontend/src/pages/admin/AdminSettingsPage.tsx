import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Sliders, Save, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [feePercentage, setFeePercentage] = useState(2.5);
  const [transportRatePerKmKg, setTransportRatePerKmKg] = useState(0.015);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data?.settings) {
          setFeePercentage(data.settings.feePercentage);
          setTransportRatePerKmKg(data.settings.transportRatePerKmKg);
        }
      } catch (err) {
        console.error('Failed to load platform settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      await api.put('/settings', {
        feePercentage: Number(feePercentage),
        transportRatePerKmKg: Number(transportRatePerKmKg),
      });
      setMessage({ type: 'success', text: 'Platform financial and transport rates updated successfully!' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to save settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <Sliders className="w-7 h-7 text-amber-400" />
          <span>Platform Financial & Logistics Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Dynamically govern marketplace fee percentages and baseline cryogenic freight calculation rates
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/80 border-red-500/40 text-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="rounded-3xl bg-charcoal-900 border border-amber-500/30 p-6 sm:p-8 space-y-6 shadow-2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Marketplace Platform Fee Percentage (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              required
              value={feePercentage}
              onChange={(e) => setFeePercentage(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-sm font-mono text-white focus:border-amber-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Applied automatically to all settled orders and RFQ clearing transactions.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Baseline Cryogenic Transport Rate (₹ / km / kg)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              required
              value={transportRatePerKmKg}
              onChange={(e) => setTransportRatePerKmKg(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-sm font-mono text-white focus:border-amber-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Used across the logistics engine and cost estimator for road tanker freight calculations.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-emerald-950/60 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-charcoal-950 font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Updating Settings...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
