import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Leaf, ArrowRight, Factory, ShoppingCart, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('SUPPLIER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Chemicals & Refining');
  const [city, setCity] = useState('Surat');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register({
        name,
        email,
        password,
        role,
        companyName,
        industry,
        city,
        address,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 items-center justify-center text-charcoal-950 shadow-lg shadow-brand-500/20 mb-2">
            <Leaf className="w-7 h-7 text-charcoal-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Register Industrial Organization
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Join the ReCarbo circular carbon network as a CO2 Supplier or Buyer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-charcoal-900 border border-emerald-950/80 space-y-5 shadow-2xl">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Select Organization Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('SUPPLIER')}
                className={`p-3.5 rounded-xl border flex items-center space-x-3 text-left transition-all ${
                  role === 'SUPPLIER'
                    ? 'bg-emerald-950/80 border-emerald-500 text-brand-300 shadow-md shadow-brand-500/10'
                    : 'bg-charcoal-950 border-emerald-950 text-slate-400 hover:border-emerald-800'
                }`}
              >
                <Factory className={`w-5 h-5 ${role === 'SUPPLIER' ? 'text-brand-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold text-white">CO2 Supplier</div>
                  <div className="text-[10px] text-slate-400">Has captured CO2 to monetize</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('BUYER')}
                className={`p-3.5 rounded-xl border flex items-center space-x-3 text-left transition-all ${
                  role === 'BUYER'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'bg-charcoal-950 border-emerald-950 text-slate-400 hover:border-cyan-800'
                }`}
              >
                <ShoppingCart className={`w-5 h-5 ${role === 'BUYER' ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold text-white">CO2 Buyer / Offtaker</div>
                  <div className="text-[10px] text-slate-400">Needs CO2 for production</div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Full Representative Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Smit Bhalani"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 focus:border-brand-500 focus:outline-none text-sm text-white placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 focus:border-brand-500 focus:outline-none text-sm text-white placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Password (Min 6 Characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 focus:border-brand-500 focus:outline-none text-sm text-white placeholder:text-slate-600"
            />
          </div>

          <div className="pt-2 border-t border-emerald-950/60">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
              Company & Industrial Facility
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Company Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Dahej Eco Materials Ltd"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 focus:border-brand-500 focus:outline-none text-sm text-white placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Industrial Sector
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 focus:border-brand-500 focus:outline-none text-sm text-white"
                >
                  <option value="Chemicals & Refining">Chemicals & Refining</option>
                  <option value="Cement & Building Materials">Cement & Concrete Curing</option>
                  <option value="Polymer Manufacturing">Polymer & Plastics Synthesis</option>
                  <option value="Fertilizer & Ammonia">Fertilizer & Ammonia</option>
                  <option value="Sustainable Aviation Fuels">Sustainable Aviation Fuels (SAF)</option>
                  <option value="Commercial Agriculture & Greenhouses">Agriculture & Greenhouses</option>
                  <option value="Other">Other Industrial Sector</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  City / Industrial Hub
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bharuch, Surat, Ahmedabad"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 focus:border-brand-500 focus:outline-none text-sm text-white placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Plant / Facility Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. GIDC Industrial Estate"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950 focus:border-brand-500 focus:outline-none text-sm text-white placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-charcoal-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Complete Onboarding & Access Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
