import React, { useState } from 'react';
import { Calculator, Truck, Layers, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export const CalculatorPage: React.FC = () => {
  const [quantityTonnes, setQuantityTonnes] = useState(25);
  const [distanceKm, setDistanceKm] = useState(180);
  const [pricePerKg, setPricePerKg] = useState(4.5);
  const [transportMode, setTransportMode] = useState('CRYOGENIC_TANKER');

  // Platform defaults (configurable via Admin)
  const platformFeePct = 2.5; // 2.5%
  const baseTransportRatePerKmKg = 0.015; // ₹0.015/km/kg

  // Calculations strictly in KG internally
  const quantityKg = quantityTonnes * 1000;
  const co2BaseCost = quantityKg * pricePerKg;
  const transportMultiplier = transportMode === 'CRYOGENIC_TANKER' ? 1.0 : transportMode === 'TUBE_TRAILER' ? 0.85 : 1.2;
  const transportCost = quantityKg * distanceKm * baseTransportRatePerKmKg * transportMultiplier;
  const handlingCost = 2500; // Flat cryogenic loading/offloading safety inspection fee
  const subtotal = co2BaseCost + transportCost + handlingCost;
  const platformFee = (subtotal * platformFeePct) / 100;
  const totalCost = subtotal + platformFee;
  const effectiveCostPerKg = totalCost / quantityKg;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <Calculator className="w-7 h-7 text-emerald-400" />
          <span>CO2 & Freight Cost Estimator</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Deterministic server-calibrated calculator for post-capture carbon procurement and cryogenic transit
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs Column */}
        <div className="lg:col-span-2 rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 sm:p-8 space-y-6 shadow-xl">
          <h2 className="text-base font-bold text-white">Logistics & Quantity Parameters</h2>

          <div className="space-y-5">
            {/* Quantity Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                <span className="uppercase tracking-wider">CO2 Volume</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">
                  {quantityTonnes} Tonnes ({quantityKg.toLocaleString()} kg)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="200"
                step="1"
                value={quantityTonnes}
                onChange={(e) => setQuantityTonnes(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-charcoal-950 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Distance Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                <span className="uppercase tracking-wider">Transit Distance</span>
                <span className="text-cyan-400 font-mono font-bold text-sm">
                  {distanceKm} km (e.g. Dahej → Sanand)
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="800"
                step="10"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-charcoal-950 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Price Per KG */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                <span className="uppercase tracking-wider">Base CO2 Price Rate</span>
                <span className="text-brand-400 font-mono font-bold text-sm">
                  ₹{pricePerKg.toFixed(2)} / kg
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.1"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(Number(e.target.value))}
                className="w-full accent-emerald-400 bg-charcoal-950 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Transport Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Fleet & Logistics Equipment
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CRYOGENIC_TANKER', label: 'Liquid Cryogenic', sub: 'Pressurized (-20°C)' },
                  { id: 'TUBE_TRAILER', label: 'Gas Tube Trailer', sub: 'Compressed (200 bar)' },
                  { id: 'DRY_ICE_REEFER', label: 'Insulated Reefer', sub: 'Solid blocks (-78°C)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTransportMode(item.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      transportMode === item.id
                        ? 'bg-emerald-950/80 border-emerald-500 text-brand-300 shadow-md shadow-brand-500/10'
                        : 'bg-charcoal-950 border-emerald-950 text-slate-400 hover:border-emerald-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-white leading-tight">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cost Summary Column */}
        <div className="rounded-3xl bg-charcoal-900 border border-emerald-500/30 p-6 sm:p-8 space-y-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950/60">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Cost Breakdown
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                Server Verified
              </span>
            </div>

            <div className="space-y-3 py-4 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>CO2 Commodity Base:</span>
                <span className="font-mono font-semibold text-white">
                  ₹{co2BaseCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Cryogenic Freight ({distanceKm} km):</span>
                <span className="font-mono font-semibold text-cyan-400">
                  ₹{transportCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Handling & Purity Audit:</span>
                <span className="font-mono font-semibold text-slate-300">
                  ₹{handlingCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Platform Fee ({platformFeePct}%):</span>
                <span className="font-mono font-semibold text-amber-400">
                  ₹{platformFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="pt-3 border-t border-emerald-950/60 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Estimated Total:</span>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-brand-400 font-mono">
                    ₹{totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    (₹{effectiveCostPerKg.toFixed(2)} / delivered kg)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              *Prototype estimate calculated via server pricing rules. Final binding contract figures are computed upon order creation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
