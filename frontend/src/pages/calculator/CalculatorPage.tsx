import React, { useState, useEffect } from 'react';
import { marketplaceService } from '../../services/marketplaceService';
import { CO2Listing } from '../../types';
import {
  Calculator,
  Truck,
  Layers,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Factory,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const CalculatorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'LANDED_COST' | 'PRODUCT_CALCULATOR'>('LANDED_COST');

  // Tab 1: Landed Cost Estimator State
  const [quantityTonnes, setQuantityTonnes] = useState(
    Number(searchParams.get('quantity')) || 25
  );
  const [distanceKm, setDistanceKm] = useState(
    Number(searchParams.get('distance')) || 190
  );
  const [pricePerKg, setPricePerKg] = useState(
    Number(searchParams.get('price')) || 4.5
  );
  const [transportMode, setTransportMode] = useState('CRYOGENIC_TANKER');
  const [corridorPreset, setCorridorPreset] = useState('Dahej_Sanand');

  // Available marketplace streams to pull pricing from
  const [marketplaceListings, setMarketplaceListings] = useState<CO2Listing[]>([]);
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');

  // Tab 2: Buyer CO2 Product Demand State
  const [application, setApplication] = useState<
    'CONCRETE_CURING' | 'POLYMER_SYNTHESIS' | 'METHANOL_E_FUEL' | 'BEVERAGE_CARBONATION' | 'ALGAE_GREENHOUSE'
  >('CONCRETE_CURING');
  const [productionUnits, setProductionUnits] = useState<number>(2000); // e.g. 2,000 m3 concrete

  // Platform defaults (dynamic)
  const platformFeePct = 2.5; // 2.5%
  const baseTransportRatePerKmKg = 0.015; // ₹0.015/km/kg

  useEffect(() => {
    marketplaceService.getListings({ status: 'ACTIVE' }).then((data) => {
      setMarketplaceListings(data);
    });
  }, []);

  // Handle Corridor Preset Selection
  const handleCorridorChange = (preset: string) => {
    setCorridorPreset(preset);
    switch (preset) {
      case 'Dahej_Sanand':
        setDistanceKm(190);
        break;
      case 'Hazira_Vadodara':
        setDistanceKm(145);
        break;
      case 'Dahej_Jamnagar':
        setDistanceKm(360);
        break;
      case 'Hazira_Sanand':
        setDistanceKm(265);
        break;
      case 'Ankleshwar_Vapi':
        setDistanceKm(160);
        break;
    }
  };

  // Pull rate and specs from selected marketplace stream
  const handleSelectStream = (streamId: string) => {
    setSelectedStreamId(streamId);
    const stream = marketplaceListings.find((l) => l.id === streamId);
    if (stream) {
      setPricePerKg(stream.pricePerKg);
      setQuantityTonnes(Math.min(50, stream.quantityAvailableKg / 1000));
      if (stream.stateOfMatter === 'Compressed Gas') setTransportMode('TUBE_TRAILER');
      else if (stream.stateOfMatter === 'Solid') setTransportMode('DRY_ICE_REEFER');
      else setTransportMode('CRYOGENIC_TANKER');
    }
  };

  // Financial Calculations (strictly in KG)
  const quantityKg = quantityTonnes * 1000;
  const co2BaseCost = quantityKg * pricePerKg;
  const transportMultiplier =
    transportMode === 'CRYOGENIC_TANKER' ? 1.0 : transportMode === 'TUBE_TRAILER' ? 0.85 : 1.2;
  const transportCost = quantityKg * distanceKm * baseTransportRatePerKmKg * transportMultiplier;
  const handlingCost = 2500; // Flat cryogenic loading & QA terminal inspection
  const subtotal = co2BaseCost + transportCost + handlingCost;
  const platformFee = (subtotal * platformFeePct) / 100;
  const totalLandedCost = subtotal + platformFee;
  const effectiveCostPerKg = totalLandedCost / (quantityKg || 1);

  // Tab 2 Product Demand Calculations
  const productSpecs = {
    CONCRETE_CURING: {
      factor: 15.0,
      unit: 'm³ Precast Concrete',
      title: 'Precast Concrete Carbonation Curing',
      benefit: 'Permanently mineralizes CO2 as solid calcium carbonate within concrete matrix.',
    },
    POLYMER_SYNTHESIS: {
      factor: 0.25,
      unit: 'kg Polycarbonate Polymer',
      title: 'CO2-Derived Polymers & Polyols',
      benefit: 'Replaces fossil petrochemical building blocks with clean industrial carbon.',
    },
    METHANOL_E_FUEL: {
      factor: 1.37,
      unit: 'Litres E-Methanol',
      title: 'Synthetic E-Methanol Fuel',
      benefit: 'Recycles captured CO2 with green hydrogen for net-zero marine & aviation fuels.',
    },
    BEVERAGE_CARBONATION: {
      factor: 6.0,
      unit: '1,000 Litres Beverage (kL)',
      title: 'Food & Beverage Grade Carbonation',
      benefit: 'Food grade certified high-purity carbonation for bottling & processing.',
    },
    ALGAE_GREENHOUSE: {
      factor: 50.0,
      unit: 'Greenhouse Crop Batches',
      title: 'Controlled Agricultural Enrichment',
      benefit: 'Enriches photosynthesis in closed greenhouses, accelerating crop yields.',
    },
  }[application];

  const requiredCo2Kg = Math.round(productionUnits * productSpecs.factor);
  const requiredCo2Tonnes = Number((requiredCo2Kg / 1000).toFixed(2));
  const rawProductCo2Cost = Math.round(requiredCo2Kg * pricePerKg);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Deterministic Pricing Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3 mt-1">
            <Calculator className="w-7 h-7 text-emerald-400" />
            <span>CO2 & Freight Landed Cost Estimator</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Server-verified logistics rate matrix, fleet equipment multipliers, and buyer product calculator
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 p-1 bg-charcoal-900 border border-emerald-950 rounded-2xl">
          <button
            onClick={() => setActiveTab('LANDED_COST')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'LANDED_COST'
                ? 'bg-emerald-500 text-charcoal-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Landed Freight Estimator
          </button>
          <button
            onClick={() => setActiveTab('PRODUCT_CALCULATOR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PRODUCT_CALCULATOR'
                ? 'bg-cyan-500 text-charcoal-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Buyer Product Demand
          </button>
        </div>
      </div>

      {/* TAB 1: LANDED FREIGHT ESTIMATOR */}
      {activeTab === 'LANDED_COST' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-2 rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Logistics & Supply Parameters</h2>

              {/* 1-Click Pull from Marketplace Stream */}
              {marketplaceListings.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-400">Pull Stream:</span>
                  <select
                    value={selectedStreamId}
                    onChange={(e) => handleSelectStream(e.target.value)}
                    className="px-2.5 py-1 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-brand-300 focus:outline-none"
                  >
                    <option value="">Custom Values</option>
                    {marketplaceListings.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title.slice(0, 30)}... (₹{l.pricePerKg}/kg)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-5">
              {/* Corridor Preset Buttons */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Gujarat Industrial Transit Corridors
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'Dahej_Sanand', name: 'Dahej ↔ Sanand', dist: '190 km' },
                    { id: 'Hazira_Vadodara', name: 'Hazira ↔ Vadodara', dist: '145 km' },
                    { id: 'Dahej_Jamnagar', name: 'Dahej ↔ Jamnagar', dist: '360 km' },
                    { id: 'Hazira_Sanand', name: 'Hazira ↔ Sanand', dist: '265 km' },
                    { id: 'Ankleshwar_Vapi', name: 'Ankleshwar ↔ Vapi', dist: '160 km' },
                  ].map((corridor) => (
                    <button
                      key={corridor.id}
                      type="button"
                      onClick={() => handleCorridorChange(corridor.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        corridorPreset === corridor.id
                          ? 'bg-emerald-950 border-emerald-500 text-brand-300'
                          : 'bg-charcoal-950 border-emerald-950 text-slate-400 hover:border-emerald-800'
                      }`}
                    >
                      <div className="text-xs font-bold text-white leading-tight">{corridor.name}</div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{corridor.dist}</div>
                    </button>
                  ))}
                </div>
              </div>

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
                  max="150"
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
                    {distanceKm} km transit route
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="600"
                  step="5"
                  value={distanceKm}
                  onChange={(e) => {
                    setDistanceKm(Number(e.target.value));
                    setCorridorPreset('Custom');
                  }}
                  className="w-full accent-cyan-500 bg-charcoal-950 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Price Per KG Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span className="uppercase tracking-wider">Base CO2 Price Rate</span>
                  <span className="text-brand-400 font-mono font-bold text-sm">
                    ₹{pricePerKg.toFixed(2)} / kg (₹{(pricePerKg * 1000).toLocaleString()} / Tonne)
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

              {/* Transport Fleet Equipment */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Logistics & Fleet Equipment
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'CRYOGENIC_TANKER', label: 'Liquid Cryogenic', sub: 'Pressurized (-20°C, 20 bar)' },
                    { id: 'TUBE_TRAILER', label: 'Gas Tube Trailer', sub: 'Compressed (200 bar)' },
                    { id: 'DRY_ICE_REEFER', label: 'Insulated Reefer', sub: 'Solid Dry Ice (-78.5°C)' },
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
          <div className="rounded-3xl bg-charcoal-900 border border-emerald-500/40 p-6 sm:p-8 space-y-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-emerald-950/60">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Landed Cost Breakdown
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  Deterministic
                </span>
              </div>

              <div className="space-y-3.5 py-4 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>CO2 Commodity Base:</span>
                  <span className="font-mono font-semibold text-white">
                    ₹{Math.round(co2BaseCost).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>
                    Freight ({distanceKm} km @ ₹{(baseTransportRatePerKmKg * transportMultiplier).toFixed(3)}):
                  </span>
                  <span className="font-mono font-semibold text-cyan-400">
                    ₹{Math.round(transportCost).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Handling & QA Terminal Fee:</span>
                  <span className="font-mono font-semibold text-slate-300">
                    ₹{handlingCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Platform Escrow Fee ({platformFeePct}%):</span>
                  <span className="font-mono font-semibold text-amber-400">
                    ₹{Math.round(platformFee).toLocaleString()}
                  </span>
                </div>

                <div className="pt-4 border-t border-emerald-950/80 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Total Landed Cost:</span>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-brand-400 font-mono">
                      ₹{Math.round(totalLandedCost).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      (₹{effectiveCostPerKg.toFixed(2)} / delivered kg)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate('/marketplace')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold text-xs shadow-md shadow-brand-500/20 transition-all text-center"
              >
                Procure Matching Streams in Marketplace
              </button>

              <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                *Backend recomputes exact binding financials from Admin Settings upon contract creation.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: BUYER CO2 PRODUCT CALCULATOR */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl bg-charcoal-900 border border-cyan-950 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Industrial Product Manufacturing Demand</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                End-Product Conversion
              </span>
            </div>

            <div className="space-y-5 text-xs">
              {/* Application Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2 uppercase tracking-wider">
                  Target Industrial Application
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'CONCRETE_CURING', title: 'Precast Concrete Carbonation', factor: '15 kg CO2 / m³' },
                    { id: 'POLYMER_SYNTHESIS', title: 'Polycarbonate Polymer Synthesis', factor: '0.25 kg CO2 / kg' },
                    { id: 'METHANOL_E_FUEL', title: 'Synthetic E-Methanol Fuel', factor: '1.37 kg CO2 / L' },
                    { id: 'BEVERAGE_CARBONATION', title: 'Beverage Carbonation', factor: '6 kg CO2 / kL' },
                    { id: 'ALGAE_GREENHOUSE', title: 'Agro Greenhouse Enrichment', factor: '50 kg CO2 / batch' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setApplication(item.id as any)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        application === item.id
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                          : 'bg-charcoal-950 border-cyan-950 text-slate-400 hover:border-cyan-800'
                      }`}
                    >
                      <div className="text-xs font-bold text-white leading-tight">{item.title}</div>
                      <div className="text-[10px] text-cyan-400 font-mono mt-1">{item.factor}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Production Units Slider */}
              <div>
                <div className="flex justify-between font-semibold text-slate-300 mb-2">
                  <span className="uppercase tracking-wider">Target Production Volume</span>
                  <span className="text-cyan-400 font-mono font-bold text-sm">
                    {productionUnits.toLocaleString()} {productSpecs.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="20000"
                  step="100"
                  value={productionUnits}
                  onChange={(e) => setProductionUnits(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-charcoal-950 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Climate & Chemistry Benefit Card */}
              <div className="p-4 rounded-2xl bg-charcoal-950 border border-cyan-950 text-xs text-slate-300 space-y-1">
                <div className="flex items-center space-x-1.5 text-cyan-400 font-bold text-[11px]">
                  <Info className="w-3.5 h-3.5" />
                  <span>Circular Carbon Benefit:</span>
                </div>
                <p className="text-slate-400 leading-relaxed">{productSpecs.benefit}</p>
              </div>
            </div>
          </div>

          {/* Product CO2 Demand Output Column */}
          <div className="rounded-3xl bg-charcoal-900 border border-cyan-500/40 p-6 sm:p-8 space-y-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-cyan-950/60">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Required CO2 Volume
                </span>
                <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                  Feedstock Demand
                </span>
              </div>

              <div className="space-y-4 py-4 text-xs">
                <div className="p-4 rounded-2xl bg-charcoal-950 border border-cyan-950 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                    Total Required Captured CO2
                  </span>
                  <div className="text-3xl font-extrabold text-cyan-400 font-mono my-1">
                    {requiredCo2Tonnes} Tonnes
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({requiredCo2Kg.toLocaleString()} kg)
                  </span>
                </div>

                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span>Specific CO2 Factor:</span>
                    <strong className="text-white font-mono">{productSpecs.factor} kg CO2/unit</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Feedstock Cost:</span>
                    <strong className="text-brand-400 font-mono text-sm">
                      ₹{rawProductCo2Cost.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() =>
                  navigate(
                    `/requirements?title=${encodeURIComponent(
                      `${productSpecs.title} (${requiredCo2Tonnes} T)`
                    )}&quantity=${requiredCo2Tonnes}`
                  )
                }
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-charcoal-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all text-center"
              >
                Post This Demand as Requirement
              </button>

              <button
                onClick={() => {
                  setQuantityTonnes(requiredCo2Tonnes);
                  setActiveTab('LANDED_COST');
                }}
                className="w-full py-2 rounded-xl bg-charcoal-950 border border-cyan-950 hover:border-cyan-800 text-cyan-300 text-xs font-semibold text-center"
              >
                Estimate Full Landed Freight for this Lot →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
