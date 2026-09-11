import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, ArrowRight, LayoutDashboard, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/30 bg-charcoal-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-charcoal-950 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
            <Leaf className="w-6 h-6 text-charcoal-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center">
              Re<span className="text-brand-400">Carbo</span>
            </span>
            <span className="text-[10px] font-medium tracking-widest uppercase text-emerald-400/70 block -mt-1">
              Capture. Connect. Reuse.
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <Link to="/marketplace" className="hover:text-brand-400 transition-colors">
            Marketplace
          </Link>
          <a href="#how-it-works" className="hover:text-brand-400 transition-colors">
            How It Works
          </a>
          <a href="#use-cases" className="hover:text-brand-400 transition-colors">
            Use Cases
          </a>
          <Link to="/calculator" className="hover:text-brand-400 transition-colors">
            Logistics & Cost Estimator
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 text-sm font-medium transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard ({user.role})</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-charcoal-850"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-charcoal-950 font-semibold text-sm shadow-md shadow-brand-500/20 hover:shadow-brand-500/30 transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
