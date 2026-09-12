import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Leaf,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingDown,
  Layers,
  Scale,
  Truck,
  Bot,
  Factory,
  Building2,
  CheckCircle2,
  Sparkles,
  Flame,
  Wheat,
  FlaskConical,
  Plane,
  RefreshCw,
  Database,
  Lock,
  ChevronRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activeCycleStep, setActiveCycleStep] = useState(1);

  const cycleSteps = [
    {
      id: 1,
      title: 'CO2 Supplier',
      tag: 'Point-Source Capture',
      desc: 'Amine absorption and byproduct syngas facilities list verified liquid and compressed gas inventory.',
      specs: 'Bharuch & Hazira Hubs • 98.5% - 99.8% Purity',
      icon: Factory,
      color: '#10b981',
    },
    {
      id: 2,
      title: 'ReCarbo AI Engine',
      tag: '5-Factor Matchmaking',
      desc: '30% Quantity + 25% Purity + 20% Distance + 15% Price + 10% Reliability evaluated deterministically.',
      specs: 'Zero Hallucinations • Hard Constraints Verified',
      icon: Bot,
      color: '#06b6d4',
    },
    {
      id: 3,
      title: 'Optimal Match Fit',
      tag: 'RFQ & Price Discovery',
      desc: 'Automated RFQ allocation with FCFS, Highest-Price, or Best-Value policy. Multi-buyer split allocation.',
      specs: 'Transparent Landed Cost • Dynamic Platform Fee',
      icon: Scale,
      color: '#f59e0b',
    },
    {
      id: 4,
      title: 'Buyer Procurement',
      tag: 'Cryogenic Dispatch',
      desc: 'High-pressure tube trailers and cryogenic road tankers dispatched with live route telemetry.',
      specs: 'Escrow Settlement • NH48 Industrial Corridors',
      icon: Truck,
      color: '#3b82f6',
    },
    {
      id: 5,
      title: 'Productive Utilization',
      tag: 'Circular Offtake',
      desc: 'Captured CO2 is mineralized in precast concrete or synthesized into sustainable polycarbonates.',
      specs: 'Productive Utilization • Displacing Virgin Fossil Feed',
      icon: Leaf,
      color: '#8b5cf6',
    },
  ];

  const useCases = [
    {
      title: 'Mineral Carbonation in Concrete',
      icon: Building2,
      industry: 'Cement & Precast',
      description:
        'Permanently mineralize captured CO2 during curing to increase compressive strength while reducing cement binder usage.',
      purityNeeded: '95%+ Industrial Grade',
      potentialAvoidance: 'Up to 25 kg CO2 / m³ concrete',
      suitableStream: 'Hazira Compressed Gas Stream',
    },
    {
      title: 'Synthetic & Polymer Materials',
      icon: FlaskConical,
      industry: 'Plastics & Chemistry',
      description:
        'Utilize high-purity liquid CO2 as a carbon building block for polycarbonates, polyols, and circular chemical synthesis.',
      purityNeeded: '99.5%+ High Purity',
      potentialAvoidance: 'Replaces virgin petrochemical feed',
      suitableStream: 'Dahej Liquid Amine Stream',
    },
    {
      title: 'Sustainable Aviation Fuels (SAF)',
      icon: Plane,
      industry: 'Clean Energy & Aviation',
      description:
        'Combine captured CO2 with green hydrogen via Fischer-Tropsch to synthesize drop-in low-carbon aviation kerosene.',
      purityNeeded: '99.8%+ Ultra Pure',
      potentialAvoidance: 'Up to 80% lifecycle emission drop',
      suitableStream: 'Ultra-Pure Dahej Stream',
    },
    {
      title: 'Commercial Greenhouse Enrichment',
      icon: Wheat,
      industry: 'Agri-Tech & Horticulture',
      description:
        'Enrich greenhouse atmospheres up to 1000 ppm CO2 to accelerate crop growth cycles and photosynthesis yields.',
      purityNeeded: '99.0%+ Food / Agri Grade',
      potentialAvoidance: '30-40% faster crop yields',
      suitableStream: 'Food-Grade Gujarat Streams',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-brand-600/15 to-emerald-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-lg shadow-emerald-950/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>AI-Powered B2B Circular Carbon Marketplace</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]"
          >
            Turn Captured Carbon Into{' '}
            <span className="gradient-text-emerald block sm:inline">
              Valuable Resources.
            </span>
          </motion.h1>

          {/* Tagline & Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
          >
            <strong className="text-white">Capture. Connect. Reuse.</strong> ReCarbo connects industrial capture facilities with commercial buyers through deterministic 5-factor matchmaking, RFQ allocation, and transparent logistics.
          </motion.p>

          {/* Primary CTA Group */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/marketplace"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-400 hover:from-brand-500 hover:to-emerald-300 text-charcoal-950 font-bold text-base shadow-xl shadow-brand-500/25 hover:shadow-brand-500/35 transition-all flex items-center justify-center space-x-2"
            >
              <span>Explore Live Marketplace</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/assistant"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-charcoal-900 hover:bg-charcoal-800 border border-emerald-500/30 text-emerald-300 font-bold text-base transition-all flex items-center justify-center space-x-2"
            >
              <Bot className="w-5 h-5 text-brand-400" />
              <span>Ask ReCarbo AI</span>
            </Link>
          </motion.div>

          {/* Live Ecosystem Stats Strip */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-emerald-950/80 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">170.0 T</div>
              <div className="text-xs text-slate-400 mt-1">Gujarat Carbon Supply</div>
            </div>
            <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-emerald-950/80 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">92.5%</div>
              <div className="text-xs text-slate-400 mt-1">Avg Match Fit Score</div>
            </div>
            <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-emerald-950/80 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">₹3.20</div>
              <div className="text-xs text-slate-400 mt-1">Starting Price / kg</div>
            </div>
            <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-emerald-950/80 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 mt-1">Deterministic RFQ</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ANIMATED LIFECYCLE FLOW: Supplier → AI → Best Match → Buyer → Utilization */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-400 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Circular Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              CO2 Supplier ➔ ReCarbo AI ➔ Match ➔ Buyer ➔ Utilization
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Click any stage to inspect how ReCarbo orchestrates physical and digital carbon exchange
            </p>
          </div>

          {/* Interactive Flow Nodes */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
            {cycleSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeCycleStep === step.id;
              return (
                <motion.div
                  key={step.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setActiveCycleStep(step.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-charcoal-950 border-emerald-500/70 shadow-xl shadow-emerald-950/60 ring-1 ring-emerald-500/50'
                      : 'bg-charcoal-950/50 border-emerald-950/80 hover:border-emerald-800'
                  }`}
                >
                  {/* Step Sequence Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-6 h-6 rounded-full bg-charcoal-900 border border-emerald-950 flex items-center justify-center text-[11px] font-mono font-bold text-slate-400">
                      0{step.id}
                    </span>
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: step.color }}
                    />
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-charcoal-900 border border-emerald-950/80 flex items-center justify-center text-brand-400 mb-3">
                    <Icon className="w-5 h-5" style={{ color: step.color }} />
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    {step.tag}
                  </span>
                  <h3 className="font-bold text-white text-sm mt-0.5">{step.title}</h3>

                  {isActive && (
                    <motion.div
                      layoutId="activeFlowIndicator"
                      className="absolute -bottom-1 left-4 right-4 h-1 rounded-full bg-gradient-to-r from-brand-500 to-emerald-400"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Active Step Explainer Drawer */}
          {cycleSteps.find((s) => s.id === activeCycleStep) && (
            <motion.div
              key={activeCycleStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 rounded-2xl bg-charcoal-950 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                    Stage 0{activeCycleStep}: {cycleSteps[activeCycleStep - 1].title}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-mono text-emerald-300">
                    {cycleSteps[activeCycleStep - 1].specs}
                  </span>
                </div>
                <p className="text-sm text-slate-200 max-w-3xl leading-relaxed">
                  {cycleSteps[activeCycleStep - 1].desc}
                </p>
              </div>

              <Link
                to={activeCycleStep === 2 ? '/assistant' : '/marketplace'}
                className="px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-brand-300 border border-emerald-500/40 text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 self-start md:self-auto"
              >
                <span>{activeCycleStep === 2 ? 'Launch Assistant' : 'View in Marketplace'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* 3. PROBLEM VS SOLUTION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
            Market Transformation
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            Transforming Carbon from an Industrial Liability into a Tradeable Commodity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Before ReCarbo */}
          <div className="rounded-3xl bg-charcoal-900/70 border border-red-950/60 p-8 space-y-5">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Traditional Friction</h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
              <li className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong>High Discovery Costs:</strong> Suppliers struggle to find buyers with matching purity and pressure specifications.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong>Opaque Logistics:</strong> Transportation fees and cryogenic tanker routing are unpredictable and fragmented.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong>Uncertain Procurement:</strong> Buyers lack deterministic allocation and reliable quality guarantees.</span>
              </li>
            </ul>
          </div>

          {/* With ReCarbo */}
          <div className="rounded-3xl bg-charcoal-900/70 border border-emerald-500/30 p-8 space-y-5 shadow-xl shadow-emerald-950/20">
            <div className="flex items-center space-x-3 text-emerald-400">
              <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">The ReCarbo Advantage</h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Deterministic 5-Factor Matching:</strong> Scores quantity, purity, distance, price, and availability with zero LLM hallucination.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Server-Verified Logistics:</strong> Real-time distance and transit cost recalculations before any order commitment.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>RFQ & Split Allocation:</strong> Flexible Fixed-Price or Request-Quote models with multi-buyer split allocation.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. USE CASES & PRODUCTIVE UTILIZATION */}
      <section id="use-cases" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
            Target Industries
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            Commercial Offtake & Carbon Utilization Sectors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((uc) => {
            const Icon = uc.icon;
            return (
              <div
                key={uc.title}
                className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-brand-400">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      {uc.industry}
                    </span>
                    <h3 className="text-base font-bold text-white">{uc.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{uc.description}</p>

                <div className="pt-3 border-t border-emerald-950/60 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-charcoal-950 border border-emerald-950/40">
                    <span className="text-[10px] text-slate-500 block">Spec Purity</span>
                    <span className="font-semibold text-slate-300">{uc.purityNeeded}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-charcoal-950 border border-emerald-950/40">
                    <span className="text-[10px] text-slate-500 block">Productive Offtake</span>
                    <span className="font-semibold text-brand-400">{uc.potentialAvoidance}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-charcoal-900 to-charcoal-950 border border-emerald-500/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-charcoal-950 mx-auto shadow-lg shadow-brand-500/30">
            <Leaf className="w-8 h-8 stroke-[2.5]" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Build the Circular Carbon Economy?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Connect your industrial carbon capture facility or secure sustainable CO2 feedstock today.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 text-charcoal-950 font-bold text-sm shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <span>Onboard Organization</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-charcoal-800 hover:bg-charcoal-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              <span>Sign In with Demo Account</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
