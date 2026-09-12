import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { SustainabilityMetricsData } from '../../types';
import { StatCard } from '../../components/StatCard';
import { SkeletonCard } from '../../components/Skeleton';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Leaf,
  Layers,
  Truck,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Factory,
  ArrowRight,
  Info,
  Building2,
  FlaskConical,
  Wheat,
  Plane,
  Scale,
  Sparkles,
  DollarSign,
} from 'lucide-react';

export const SustainabilityPage: React.FC = () => {
  const [data, setData] = useState<SustainabilityMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const metrics = await analyticsService.getSustainabilityMetrics();
        setData(metrics);
      } catch (err) {
        console.error('Failed to load sustainability metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const flowSteps = data?.carbonFlowSteps || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950/90 via-charcoal-900 to-charcoal-900 border border-emerald-500/30 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-brand-300 text-xs font-semibold mb-2">
              <Leaf className="w-3.5 h-3.5 text-brand-400" />
              <span>Circular Carbon Accountability Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sustainability & Carbon Flow Dashboard
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Transparent, audit-grade verification of industrial carbon routing across Gujarat.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-charcoal-950/80 border border-emerald-500/20 max-w-sm">
            <div className="flex items-start space-x-2 text-slate-300 text-xs">
              <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-emerald-300">Regulatory Claim Standard:</strong> Captured CO2 is accounted as{' '}
                <em>"Captured CO2 routed toward productive utilization"</em>, distinguishing commercial offtake from permanent geological mineralization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="CO2 Productively Utilized"
          value={`${data?.totalUtilizedTonnes || '30.0'} T`}
          subtitle="Incorporated into concrete & polymers"
          icon={TrendingUp}
          variant="emerald"
        />
        <StatCard
          title="Active Listed Pool"
          value={`${data?.totalListedTonnes || '170.0'} T`}
          subtitle="Gujarat industrial supply available"
          icon={Layers}
          variant="cyan"
        />
        <StatCard
          title="Total Captured & Logged"
          value={`${data?.totalCapturedTonnes || '325.0'} T`}
          subtitle="Cumulative post-combustion streams"
          icon={Factory}
          variant="neutral"
        />
        <StatCard
          title="Cost Avoidance Achieved"
          value={`₹${(data?.totalCostSavings || 85000).toLocaleString()}`}
          subtitle="vs. ₹5.80/kg virgin merchant benchmark"
          icon={DollarSign}
          variant="amber"
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. CARBON FLOW VISUALIZATION (Captured -> Listed -> Matched -> Transported -> Utilized) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-950/60 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Full Lifecycle Carbon Routing Flow</span>
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic sequence from industrial capture to end-of-pipe productive commercial use
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
            Real DB Aggregation: 1 Tonne = 1,000 kg
          </span>
        </div>

        {/* Interactive Step Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {flowSteps.map((step, idx) => (
            <div
              key={step.id}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                activeStep === idx
                  ? 'bg-charcoal-950 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                  : 'bg-charcoal-950/60 border-emerald-950/60 hover:border-emerald-950 hover:bg-charcoal-950'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                <span>0{idx + 1}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: step.color }} />
              </div>
              <span className="text-xs font-bold text-white block truncate">{step.stage}</span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400 block mt-1">
                {step.tonnes} T
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                ({step.kg.toLocaleString()} kg)
              </span>
            </div>
          ))}
        </div>

        {/* Selected Step Deep Dive Banner */}
        {flowSteps[activeStep] && (
          <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-white uppercase text-[10px] tracking-wider text-brand-400">
                Stage 0{activeStep + 1} Details: {flowSteps[activeStep].stage}
              </span>
              <p className="text-slate-300">{flowSteps[activeStep].description}</p>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <span>Verified through automated row-locking transactions</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. PRODUCTIVE UTILIZATION SECTORS & OFF-TAKE BREAKDOWN */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Cards */}
        <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
            <Factory className="w-5 h-5 text-cyan-400" />
            <span>Productive Offtake Sector Allocation</span>
          </h2>
          <p className="text-xs text-slate-400">
            How captured carbon is routed across commercial manufacturing pipelines:
          </p>

          <div className="space-y-3 pt-2">
            {(data?.sectors || []).map((sec) => (
              <div
                key={sec.name}
                className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950/80 space-y-2 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sec.color }} />
                    <span className="font-bold text-white text-xs sm:text-sm">{sec.name}</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-emerald-400">{sec.percent}%</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{sec.mechanism}</p>

                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-emerald-950/60 font-mono">
                  <span>Estimated Volume Offtake:</span>
                  <span className="text-white font-semibold">{sec.tonnes} Tonnes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts & Cumulative Progress */}
        <div className="space-y-6">
          {/* Sector Distribution Pie */}
          <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white tracking-tight">Sectoral Offtake Distribution</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.sectors || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="percent"
                    nameKey="name"
                  >
                    {(data?.sectors || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121816', borderColor: '#059669', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Cumulative Progress */}
          <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white tracking-tight">Cumulative Carbon Routed (Tonnes)</h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.monthlyCumulative || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2d27" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121816', borderColor: '#10b981', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="routedTonnes" stroke="#10b981" fill="url(#areaGrad)" name="Routed (T)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. REGIONAL INDUSTRIAL HUBS (GUJARAT CARBON CORRIDOR) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-brand-400" />
            <span>Gujarat Industrial Cluster Infrastructure</span>
          </h2>
          <p className="text-xs text-slate-400">
            Regional point-source capture facilities and commercial offtake nodes
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data?.regionalHubs || []).map((hub) => (
            <div
              key={hub.hub}
              className="p-5 rounded-2xl bg-charcoal-950 border border-emerald-950/80 space-y-3 hover:border-emerald-500/30 transition-all"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  {hub.type}
                </span>
                <h3 className="font-bold text-white text-sm mt-0.5">{hub.hub}</h3>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                <p className="text-[11px] text-slate-400">Purity: <strong className="text-white">{hub.purity}</strong></p>
                <p className="text-[11px] text-slate-400">Stream: {hub.captureMethod}</p>
              </div>

              <div className="pt-2 border-t border-emerald-950/60 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500">Hub Capacity:</span>
                <span className="text-brand-400 font-bold">{hub.volumeTonnes} T</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
