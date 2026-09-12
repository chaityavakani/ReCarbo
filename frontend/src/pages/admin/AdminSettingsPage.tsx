import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Truck,
  DollarSign,
  Scale,
  Clock,
  Radio,
  FileCheck,
  Calculator,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [feePercentage, setFeePercentage] = useState(2.5);
  const [transportRatePerKmKg, setTransportRatePerKmKg] = useState(0.015);
  const [minQuoteIncrement, setMinQuoteIncrement] = useState(0.10);
  const [defaultRfqHours, setDefaultRfqHours] = useState(48);
  const [requireDocsForVerify, setRequireDocsForVerify] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data?.settings) {
          setFeePercentage(data.settings.feePercentage);
          setTransportRatePerKmKg(data.settings.transportRatePerKmKg);
          if (data.settings.minQuoteIncrement !== undefined) {
            setMinQuoteIncrement(data.settings.minQuoteIncrement);
          }
          if (data.settings.defaultRfqHours !== undefined) {
            setDefaultRfqHours(data.settings.defaultRfqHours);
          }
          if (data.settings.requireDocsForVerify !== undefined) {
            setRequireDocsForVerify(data.settings.requireDocsForVerify);
          }
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
      const res = await api.put('/settings', {
        feePercentage: Number(feePercentage),
        transportRatePerKmKg: Number(transportRatePerKmKg),
        minQuoteIncrement: Number(minQuoteIncrement),
        defaultRfqHours: Number(defaultRfqHours),
        requireDocsForVerify: Boolean(requireDocsForVerify),
      });

      setMessage({
        type: 'success',
        text: 'Platform financial and transport rates updated successfully! Real-time settings broadcasted to all active calculators and RFQs.',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to save settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Live simulation of an example 30 Tonne liquid shipment (Dahej -> Sanand, ~190km at ₹4.50/kg)
  const simQty = 30000;
  const simDistance = 190;
  const simCo2Cost = simQty * 4.50;
  const simTransportCost = simQty * simDistance * transportRatePerKmKg;
  const simHandlingCost = 2500;
  const simSubtotal = simCo2Cost + simTransportCost + simHandlingCost;
  const simPlatformFee = (simSubtotal * feePercentage) / 100;
  const simTotal = simSubtotal + simPlatformFee;
  const simCostPerKg = (simTotal / simQty).toFixed(2);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950/80 via-charcoal-900 to-charcoal-900 border border-amber-500/30 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Platform Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
              <Sliders className="w-7 h-7 text-amber-400" />
              <span>Platform Financial & Logistics Settings</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Dynamically govern marketplace fee percentages, freight calculation benchmarks, and RFQ allocation policies. Never hard-coded.
            </p>
          </div>

          <div className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-xl bg-charcoal-950 border border-amber-500/20 text-[11px] text-amber-300">
            <Radio className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
            <span>Live Socket Broadcast</span>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center space-x-2.5 shadow-lg ${
            message.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/90 border-red-500/40 text-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-brand-400 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="leading-relaxed">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-6 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2 border-b border-emerald-950/60 pb-3">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>1. Marketplace Financial Parameters</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Platform Fee Percentage (%)
                </label>
                <div className="relative">
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
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">%</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Read dynamically by backend order creation & cost calculator. Accrued on settled orders.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Minimum Quote / Bid Increment (₹ / kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="5"
                    required
                    value={minQuoteIncrement}
                    onChange={(e) => setMinQuoteIncrement(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-sm font-mono text-white focus:border-amber-500 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">₹/kg</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enforces meaningful price improvements in competitive RFQ Request-Quote cycles.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-6 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-2 border-b border-emerald-950/60 pb-3">
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>2. Cryogenic Freight & Operations</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Baseline Cryogenic Transport Rate (₹ / km / kg)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  value={transportRatePerKmKg}
                  onChange={(e) => setTransportRatePerKmKg(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-sm font-mono text-white focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Baseline rate for road tankers across Gujarat (Dahej, Hazira, Vadodara, Ahmedabad).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Default RFQ Bidding Window (Hours)
                </label>
                <input
                  type="number"
                  step="1"
                  min="6"
                  max="168"
                  required
                  value={defaultRfqHours}
                  onChange={(e) => setDefaultRfqHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-sm font-mono text-white focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default deadline duration populated when suppliers launch Request-Quote auctions.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-emerald-950/60">
                <div>
                  <span className="text-xs font-bold text-white block">Require Verification Documents</span>
                  <span className="text-[11px] text-slate-400">Strictly enforce GSTIN and ISO certificates before trading</span>
                </div>
                <input
                  type="checkbox"
                  checked={requireDocsForVerify}
                  onChange={(e) => setRequireDocsForVerify(e.target.checked)}
                  className="w-5 h-5 rounded border-emerald-950 text-amber-500 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-charcoal-950 font-bold text-sm shadow-xl shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Updating Settings...' : 'Save & Broadcast Configuration'}</span>
            </button>
          </div>
        </form>

        {/* Live Simulation Sidebar */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-charcoal-900 border border-amber-500/30 p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-amber-400">
              <Calculator className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Live Rate Impact Simulation</h3>
            </div>
            <p className="text-xs text-slate-400">
              Real-time preview of how current settings affect an example 30-Tonne Liquid CO2 order:
            </p>

            <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Base CO2 (30T @ ₹4.50):</span>
                <span>₹{simCo2Cost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-cyan-400">
                <span>Freight (190km @ ₹{transportRatePerKmKg}):</span>
                <span>₹{Math.round(simTransportCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>QA & Handling Fee:</span>
                <span>₹{simHandlingCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold border-t border-emerald-950 pt-2">
                <span>Platform Fee ({feePercentage}%):</span>
                <span>₹{Math.round(simPlatformFee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white text-sm font-bold border-t border-emerald-950 pt-2">
                <span>Estimated Landed Total:</span>
                <span className="text-emerald-400">₹{Math.round(simTotal).toLocaleString()}</span>
              </div>
              <div className="text-[10px] text-slate-500 text-right">
                = ₹{simCostPerKg} / kg landed cost
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
              <strong>Rule Verification:</strong> Changing these values writes to <code className="font-mono text-amber-400">AuditLog</code>, updates the database, and immediately adjusts cost calculations across all buyer dashboards.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
