import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, ArrowRight, ShieldCheck, Factory, ShoppingCart, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">

      {/* ── Animated Globe Background ── */}
      <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center">

        {/* deep glow behind globe */}
        <div className="absolute w-[520px] h-[520px] rounded-full bg-brand-500/5 blur-3xl animate-pulse-slow" />

        {/* half-world SVG globe */}
        <div
          className="absolute w-[420px] h-[420px] opacity-[0.13]"
          style={{ animation: 'spinGlobe 28s linear infinite' }}
        >
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="96" stroke="#10b981" strokeWidth="1.2" />
            {/* latitude lines */}
            {[20,40,60,80,100,120,140,160,180].map((y) => {
              const r = Math.sqrt(96*96 - (y-100)*(y-100));
              return r > 0 ? (
                <ellipse key={y} cx="100" cy={y} rx={r} ry={r*0.35} stroke="#10b981" strokeWidth="0.7" />
              ) : null;
            })}
            {/* longitude lines */}
            {[0,20,40,60,80,100,120,140,160].map((angle) => (
              <ellipse key={angle} cx="100" cy="100" rx="96" ry="96" stroke="#10b981" strokeWidth="0.7"
                transform={`rotate(${angle} 100 100)`} />
            ))}
          </svg>
        </div>

        {/* orbit ring 1 */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full border border-brand-500/20"
          style={{ animation: 'orbitRing1 18s linear infinite' }}
        >
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-brand-400 shadow-[0_0_12px_4px_rgba(16,185,129,0.7)]" />
        </div>

        {/* orbit ring 2 — tilted */}
        <div
          className="absolute w-[600px] h-[240px] rounded-full border border-cyan-500/15"
          style={{ animation: 'orbitRing2 26s linear infinite reverse' }}
        >
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_3px_rgba(34,211,238,0.6)]" />
        </div>

        {/* orbit ring 3 — tilted other way */}
        <div
          className="absolute w-[340px] h-[600px] rounded-full border border-emerald-400/10"
          style={{ animation: 'orbitRing3 22s linear infinite' }}
        >
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-emerald-300 shadow-[0_0_8px_3px_rgba(52,211,153,0.5)]" />
        </div>

        {/* floating particles */}
        {[
          { size: 'w-1.5 h-1.5', color: 'bg-brand-400', top: '18%', left: '22%', delay: '0s', dur: '6s' },
          { size: 'w-1 h-1',   color: 'bg-cyan-400',  top: '72%', left: '75%', delay: '1s', dur: '8s' },
          { size: 'w-2 h-2',   color: 'bg-emerald-300', top: '55%', left: '15%', delay: '2s', dur: '7s' },
          { size: 'w-1 h-1',   color: 'bg-brand-300', top: '30%', left: '80%', delay: '0.5s', dur: '9s' },
          { size: 'w-1.5 h-1.5', color: 'bg-teal-400', top: '80%', left: '30%', delay: '3s', dur: '5s' },
          { size: 'w-1 h-1',   color: 'bg-cyan-300',  top: '12%', left: '60%', delay: '1.5s', dur: '10s' },
        ].map((p, i) => (
          <span
            key={i}
            className={`absolute ${p.size} ${p.color} rounded-full opacity-70`}
            style={{
              top: p.top, left: p.left,
              animation: `floatParticle ${p.dur} ease-in-out infinite`,
              animationDelay: p.delay,
              boxShadow: '0 0 6px 2px currentColor',
            }}
          />
        ))}
      </div>

      {/* keyframes injected via style tag */}
      <style>{`
        @keyframes spinGlobe {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbitRing1 {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbitRing2 {
          from { transform: rotate(0deg) rotateX(70deg); }
          to   { transform: rotate(360deg) rotateX(70deg); }
        }
        @keyframes orbitRing3 {
          from { transform: rotate(0deg) rotateY(65deg); }
          to   { transform: rotate(360deg) rotateY(65deg); }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.7; }
          50%       { transform: translateY(-18px) scale(1.3); opacity: 1; }
        }
      `}</style>
      <div className="w-full max-w-lg space-y-7 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 items-center justify-center text-charcoal-950 shadow-lg shadow-brand-500/20 mb-2">
            <Leaf className="w-9 h-9 text-charcoal-950 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Sign In to ReCarbo
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Access your circular carbon marketplace dashboard
          </p>
        </div>

        {/* Quick Demo Login Cards */}
        <div className="p-5 rounded-2xl bg-charcoal-900/90 border border-emerald-950/80 space-y-3">
          <div className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>Quick Demo Accounts</span>
            <span className="text-xs text-slate-300 font-normal">Click to prefill</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => fillDemoAccount('supplier@recarbo.demo')}
              className="p-3.5 rounded-xl bg-charcoal-800/80 hover:bg-emerald-950/80 border border-emerald-500/20 hover:border-emerald-500/50 text-left transition-all group"
            >
              <Factory className="w-5 h-5 text-brand-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-semibold text-slate-200">Supplier</div>
              <div className="text-[11px] text-slate-300 truncate">Dahej Plant</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('buyer@recarbo.demo')}
              className="p-3.5 rounded-xl bg-charcoal-800/80 hover:bg-cyan-950/80 border border-cyan-500/20 hover:border-cyan-500/50 text-left transition-all group"
            >
              <ShoppingCart className="w-5 h-5 text-cyan-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-semibold text-slate-200">Buyer</div>
              <div className="text-[11px] text-slate-300 truncate">Aura Polymer</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('admin@recarbo.demo')}
              className="p-3.5 rounded-xl bg-charcoal-800/80 hover:bg-amber-950/80 border border-amber-500/20 hover:border-amber-500/50 text-left transition-all group"
            >
              <ShieldCheck className="w-5 h-5 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-semibold text-slate-200">Admin</div>
              <div className="text-[11px] text-slate-300 truncate">Platform Ops</div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-charcoal-900 border border-emerald-950/80 space-y-5 shadow-xl">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. supplier@recarbo.demo"
              className="w-full px-4 py-3 rounded-xl bg-charcoal-950 border border-emerald-950 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-base text-white placeholder:text-slate-600 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <span className="text-xs text-slate-300">Demo: password123</span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-charcoal-950 border border-emerald-950 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-base text-white placeholder:text-slate-600 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-4 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-charcoal-950 font-bold text-base flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Platform</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center text-sm text-slate-400">
            Don't have an enterprise account?{' '}
            <Link to="/register" className="text-brand-400 hover:underline font-semibold">
              Register Company
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
