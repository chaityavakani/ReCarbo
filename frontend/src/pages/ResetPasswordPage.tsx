import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Leaf } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const passwordStrength = (pwd: string) => {
    if (pwd.length === 0) return null;
    if (pwd.length < 6) return { label: 'Too Short', color: '#f87171', width: '25%' };
    if (pwd.length < 8) return { label: 'Weak', color: '#fb923c', width: '50%' };
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { label: 'Strong', color: '#34d399', width: '100%' };
    return { label: 'Fair', color: '#fbbf24', width: '75%' };
  };

  const strength = passwordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to reset password. The link may have expired.');
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
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Password Reset!</h2>
              <p className="text-sm text-slate-400">
                Your password has been updated successfully. Redirecting you to login...
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-charcoal-950 font-bold text-sm"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Set New Password</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Choose a strong password for your ReCarbo account.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {!token ? (
                <div className="text-center mt-4">
                  <Link to="/forgot-password" className="text-sm text-brand-400 hover:text-brand-300 font-semibold">
                    Request a new reset link →
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 text-white placeholder:text-slate-600 text-sm focus:border-brand-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Strength Meter */}
                    {strength && (
                      <div className="mt-2 space-y-1">
                        <div className="h-1 rounded-full bg-charcoal-950 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: strength.width, backgroundColor: strength.color }}
                          />
                        </div>
                        <p className="text-[10px] font-semibold" style={{ color: strength.color }}>
                          {strength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal-950 border text-white placeholder:text-slate-600 text-sm focus:outline-none transition-colors ${
                          confirmPassword && confirmPassword !== newPassword
                            ? 'border-rose-500/60 focus:border-rose-400'
                            : confirmPassword && confirmPassword === newPassword
                            ? 'border-emerald-500/60 focus:border-emerald-400'
                            : 'border-emerald-950 focus:border-brand-500'
                        }`}
                      />
                      {confirmPassword && (
                        <div className="absolute right-3.5 top-3">
                          {confirmPassword === newPassword ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                          )}
                        </div>
                      )}
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-[10px] text-rose-400 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold text-sm shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
