import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Leaf, Globe, Shield, Sparkles, Heart } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-charcoal-950 text-slate-100 flex flex-col antialiased selection:bg-brand-500/30 selection:text-brand-200">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-950/60 bg-charcoal-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand column */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-charcoal-950 font-bold">
                  <Leaf className="w-5 h-5 text-charcoal-950 stroke-[2.5]" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Re<span className="text-brand-400">Carbo</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Empowering industrial decarbonization with deterministic carbon matchmaking, RFQ allocation, and transparent logistics.
              </p>
              <div className="flex items-center space-x-2 text-xs text-emerald-400/80">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Gujarat Industrial Hub Node Active</span>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link to="/marketplace" className="hover:text-brand-400 transition-colors">
                    CO2 Marketplace
                  </Link>
                </li>
                <li>
                  <Link to="/calculator" className="hover:text-brand-400 transition-colors">
                    Logistics & Cost Estimator
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-brand-400 transition-colors">
                    Supplier & Buyer Onboarding
                  </Link>
                </li>
                <li>
                  <Link to="/assistant" className="hover:text-brand-400 transition-colors">
                    AI Matchmaker Assistant
                  </Link>
                </li>
              </ul>
            </div>

            {/* Industrial Segments */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Industry Solutions
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="hover:text-slate-300">Concrete & Mineral Curing</li>
                <li className="hover:text-slate-300">Chemical & Polymer Synthesis</li>
                <li className="hover:text-slate-300">Sustainable Aviation Fuels (SAF)</li>
                <li className="hover:text-slate-300">Commercial Greenhouses</li>
              </ul>
            </div>

            {/* Demo & Architecture */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Project Information
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Built by <strong>The Outliers</strong> (Smit Bhalani, Chaitya Vakani, Dhruvi Raval, Diya Joshi).
              </p>
              <div className="p-3 rounded-xl bg-charcoal-800/60 border border-emerald-950/60 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-emerald-300">Demo Accounts:</div>
                <div>Supplier: supplier@recarbo.demo</div>
                <div>Buyer: buyer@recarbo.demo</div>
                <div>Admin: admin@recarbo.demo</div>
                <div className="text-slate-300 text-[10px] mt-1 font-mono">Password: password123</div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-emerald-950/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
            <div>© {new Date().getFullYear()} ReCarbo. Capture. Connect. Reuse. All rights reserved.</div>
            <div className="mt-2 sm:mt-0 flex items-center space-x-4">
              <span>Post-Capture Carbon Matchmaking</span>
              <span>•</span>
              <span>Deterministic RFQ Engine</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
