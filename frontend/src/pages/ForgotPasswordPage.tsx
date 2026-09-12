import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, ArrowLeft, CheckCircle2, Leaf } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 mb-4">
            <Leaf className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300 font-extrabold text-lg tracking-tight">ReCarbo</span>
          </div>
          <p className="text-slate-500 text-xs tracking-widest uppercase">Circular Carbon Marketplace</p>
        </div>

        <div className="bg-charcoal-900 border border-emerald-950/80 rounded-3xl p-8 shadow-2xl">
          {sent ? (
            /* Success State */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Check Your Email</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                If <strong className="text-white">{email}</strong> is registered on ReCarbo, you'll receive a password reset link shortly.
              </p>
              <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950 text-xs text-slate-400 text-left space-y-1">
                <p>• The link expires in <strong className="text-amber-400">15 minutes</strong></p>
                <p>• Check your spam/junk folder if it doesn't arrive</p>
                <p>• You can request another link after 15 minutes</p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold mt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Forgot Password?</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Enter your registered email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-white placeholder:text-slate-600 text-sm focus:border-brand-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold text-sm shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
