import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Menu,
  Bell,
  User as UserIcon,
  LogOut,
  Building,
  ShieldCheck,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { user, company, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  const roleColor =
    user?.role === 'ADMIN'
      ? 'bg-amber-950/70 text-amber-300 border-amber-500/40'
      : user?.role === 'SUPPLIER'
      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
      : 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40';

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-charcoal-900/90 backdrop-blur-md border-b border-emerald-950/60 px-4 sm:px-6 flex items-center justify-between">
      {/* Left side: Mobile Toggle & Page Context */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-charcoal-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Organization:</span>
          <span className="text-sm font-semibold text-white truncate max-w-[200px]">
            {company?.name || 'ReCarbo Ecosystem'}
          </span>
          {company?.isVerified && (
            <span
              title="Verified Industrial Partner"
              className="inline-flex items-center text-xs text-emerald-400"
            >
              <ShieldCheck className="w-3.5 h-3.5 ml-1" />
            </span>
          )}
        </div>
      </div>

      {/* Right side: Realtime Status, Role Badge, Notifications, User Menu */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Real-time Socket Indicator */}
        <div
          className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-charcoal-950 border border-emerald-950/80 text-slate-400"
          title={isConnected ? 'Real-time WebSocket connected' : 'Connecting to real-time events...'}
        >
          <Radio
            className={`w-3 h-3 ${
              isConnected ? 'text-brand-400 animate-pulse' : 'text-amber-400'
            }`}
          />
          <span>{isConnected ? 'Real-time sync' : 'Syncing'}</span>
        </div>

        {/* Role Badge */}
        <span
          className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${roleColor}`}
        >
          {user?.role}
        </span>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {(user?.unreadNotificationsCount || 0) > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500 animate-ping" />
            )}
            {(user?.unreadNotificationsCount || 0) > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotificationsMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-charcoal-900 border border-emerald-900/40 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-950/60">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Notifications
                </span>
                <Link
                  to="/notifications"
                  onClick={() => setShowNotificationsMenu(false)}
                  className="text-xs text-brand-400 hover:underline flex items-center space-x-1"
                >
                  <span>View all</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-charcoal-800/80 border border-emerald-500/20">
                  <p className="font-semibold text-emerald-300">Dahej Liquid CO2 Stream Match</p>
                  <p className="text-slate-400 mt-0.5">High purity 99.8% listing with 92.5% AI match score.</p>
                </div>
                <div className="p-2 rounded-lg bg-charcoal-800/40">
                  <p className="font-semibold text-slate-300">Welcome to ReCarbo</p>
                  <p className="text-slate-400 mt-0.5">Your organization is active on the Gujarat Carbon Hub.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-charcoal-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-charcoal-950 font-bold text-xs shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                {user?.name}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {company?.city || 'Gujarat'}
              </div>
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-charcoal-900 border border-emerald-900/40 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-emerald-950/60">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-charcoal-800 transition-colors"
              >
                <Building className="w-4 h-4 text-brand-400" />
                <span>Company Profile</span>
              </Link>

              <Link
                to="/marketplace"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-charcoal-800 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-emerald-400" />
                <span>Explore Marketplace</span>
              </Link>

              <div className="border-t border-emerald-950/60 my-1" />

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
