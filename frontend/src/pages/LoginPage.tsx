import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, ArrowRight, ShieldCheck, Factory, ShoppingCart, UserCheck, AlertCircle } from 'lucide-react';

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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg space-y-7">
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
