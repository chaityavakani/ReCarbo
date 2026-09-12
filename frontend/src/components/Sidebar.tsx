import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Store,
  Layers,
  FileSpreadsheet,
  Calculator,
  Truck,
  Bot,
  Bell,
  Building2,
  ShieldCheck,
  Sliders,
  History,
  Scale,
  PlusCircle,
  X,
  Leaf,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'BUYER';

  // Navigation items structured by role
  const supplierNav = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Marketplace', to: '/marketplace', icon: Store },
    { label: 'My CO2 Listings', to: '/listings', icon: Layers },
    { label: 'RFQ & Quotes', to: '/quote-requests', icon: Scale },
    { label: 'Orders & Dispatch', to: '/orders', icon: FileSpreadsheet },
    { label: 'Logistics Fleet', to: '/logistics', icon: Truck },
    { label: 'Cost Estimator', to: '/calculator', icon: Calculator },
    { label: 'AI Matchmaker', to: '/assistant', icon: Bot },
    { label: 'Sustainability & Flow', to: '/sustainability', icon: Leaf },
    { label: 'Notifications', to: '/notifications', icon: Bell },
    { label: 'Company Profile', to: '/profile', icon: Building2 },
  ];

  const buyerNav = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'CO2 Marketplace', to: '/marketplace', icon: Store },
    { label: 'My Requirements', to: '/requirements', icon: Layers },
    { label: 'Quote Requests / RFQ', to: '/quote-requests', icon: Scale },
    { label: 'Active Orders', to: '/orders', icon: FileSpreadsheet },
    { label: 'Transit & Logistics', to: '/logistics', icon: Truck },
    { label: 'Cost Estimator', to: '/calculator', icon: Calculator },
    { label: 'AI Matchmaker', to: '/assistant', icon: Bot },
    { label: 'Sustainability & Flow', to: '/sustainability', icon: Leaf },
    { label: 'Notifications', to: '/notifications', icon: Bell },
    { label: 'Company Profile', to: '/profile', icon: Building2 },
  ];

  const adminNav = [
    { label: 'Admin Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'All Listings & Market', to: '/marketplace', icon: Store },
    { label: 'Platform Orders', to: '/orders', icon: FileSpreadsheet },
    { label: 'Verify Companies', to: '/admin/companies', icon: ShieldCheck },
    { label: 'Fee & Transport Rates', to: '/admin/settings', icon: Sliders },
    { label: 'Audit Trail Logs', to: '/admin/audit-logs', icon: History },
    { label: 'Sustainability & Flow', to: '/sustainability', icon: Leaf },
    { label: 'Logistics Map', to: '/logistics', icon: Truck },
    { label: 'AI Platform Ops', to: '/assistant', icon: Bot },
    { label: 'System Alerts', to: '/notifications', icon: Bell },
  ];

  const navItems = role === 'ADMIN' ? adminNav : role === 'SUPPLIER' ? supplierNav : buyerNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-charcoal-900 border-r border-emerald-950/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-emerald-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-charcoal-950 shadow-md shadow-brand-500/20">
              <Leaf className="w-5 h-5 text-charcoal-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                Re<span className="text-brand-400">Carbo</span>
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-400/80 block">
                {role} Portal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-charcoal-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end={item.to === '/dashboard'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-950/80 text-brand-300 border border-emerald-500/30 shadow-sm shadow-brand-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-charcoal-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Quick Action Button in Sidebar */}
        <div className="p-3 border-t border-emerald-950/60">
          {role === 'SUPPLIER' && (
            <NavLink
              to="/listings"
              onClick={onClose}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/40 text-brand-300 text-xs font-semibold transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Captured CO2</span>
            </NavLink>
          )}
          {role === 'BUYER' && (
            <NavLink
              to="/requirements"
              onClick={onClose}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/40 text-brand-300 text-xs font-semibold transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post CO2 Requirement</span>
            </NavLink>
          )}
          {role === 'ADMIN' && (
            <NavLink
              to="/admin/settings"
              onClick={onClose}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all"
            >
              <Sliders className="w-4 h-4" />
              <span>Configure System</span>
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
};
