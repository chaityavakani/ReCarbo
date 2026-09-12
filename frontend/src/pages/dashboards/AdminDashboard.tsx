import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import {
  AdminOverviewData,
  Company,
  User,
  CO2Listing,
  QuoteRequest,
  Order,
  AuditLog,
} from '../../types';
import { StatCard } from '../../components/StatCard';
import { TrustBadge } from '../../components/TrustBadge';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonCard, SkeletonTable } from '../../components/Skeleton';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Layers,
  Building,
  Sliders,
  History,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Users,
  FileSpreadsheet,
  Scale,
  DollarSign,
  Search,
  Filter,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
  Ban,
  FileText,
} from 'lucide-react';
import { CO2AnimatedBackground } from '../../components/CO2AnimatedBackground';

type AdminTab = 'overview' | 'users' | 'companies' | 'marketplace' | 'audit-logs';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [listingsList, setListingsList] = useState<CO2Listing[]>([]);
  const [rfqsList, setRfqsList] = useState<QuoteRequest[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [selectedCompanyDocs, setSelectedCompanyDocs] = useState<Company | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewData, users, companies, listings, rfqs, orders, logsRes] =
        await Promise.all([
          adminService.getOverview(),
          adminService.getUsers(),
          adminService.getCompanies(),
          adminService.getListings(),
          adminService.getRfqs(),
          adminService.getOrders(),
          adminService.getAuditLogs({ limit: 50 }),
        ]);

      setData(overviewData);
      setUsersList(users);
      setCompaniesList(companies);
      setListingsList(listings);
      setRfqsList(rfqs);
      setOrdersList(orders);
      setAuditLogs(logsRes.logs || []);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // 1. User Suspension Handler
  const handleToggleUserStatus = async (userId: string, currentSuspended: boolean) => {
    try {
      const updated = await adminService.updateUserStatus(userId, !currentSuspended);
      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, isSuspended: updated.isSuspended } : u)));
      setActionSuccess(`User status updated to ${updated.isSuspended ? 'SUSPENDED' : 'ACTIVE'}`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update user status');
    }
  };

  // 2. Company Verification Handler
  const handleVerifyCompany = async (companyId: string, approve: boolean, notes?: string) => {
    try {
      const res = await adminService.verifyCompany(
        companyId,
        approve,
        approve ? 'VERIFIED' : 'REJECTED',
        notes || (approve ? 'Verified by Admin' : 'Documentation rejected by Admin')
      );
      setCompaniesList((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, ...res.company } : c))
      );
      setActionSuccess(`Company verification ${approve ? 'APPROVED' : 'REJECTED'}`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Verification update failed');
    }
  };

  // 3. Trust Score Update
  const handleUpdateTrust = async (companyId: string, delta: number) => {
    const comp = companiesList.find((c) => c.id === companyId);
    if (!comp) return;
    const newScore = Math.max(0, Math.min(100, comp.trustScore + delta));
    try {
      const res = await adminService.updateCompanyTrustScore(
        companyId,
        newScore,
        `Admin adjusted trust by ${delta > 0 ? '+' : ''}${delta} pts`
      );
      setCompaniesList((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, trustScore: res.company.trustScore } : c))
      );
    } catch (err: any) {
      alert('Failed to update trust score');
    }
  };

  // 4. Listing Moderation Handler
  const handleModerateListing = async (listingId: string, status: string) => {
    try {
      const updated = await adminService.moderateListing(
        listingId,
        status,
        `Admin changed status to ${status}`
      );
      setListingsList((prev) => prev.map((l) => (l.id === listingId ? updated : l)));
      setActionSuccess(`Listing status updated to ${status}`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert('Failed to moderate listing');
    }
  };

  // Filtered views
  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompanies = companiesList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(
    (l) =>
      (!auditActionFilter || l.action.toLowerCase().includes(auditActionFilter.toLowerCase())) &&
      (!searchQuery ||
        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const kpis = data?.kpis;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Admin Hero Header */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950/80 via-charcoal-900 to-charcoal-900 border border-amber-500/30 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <CO2AnimatedBackground variant="amber" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Platform Operations & Regulatory Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Platform Administration
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Operator: <span className="text-white font-semibold">{user?.name}</span> • Governing Gujarat Circular Carbon Infrastructure
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-emerald-950 text-slate-300 hover:text-white font-medium text-xs transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Live Refresh'}</span>
            </button>

            <Link
              to="/admin/settings"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-charcoal-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
            >
              <Sliders className="w-4 h-4" />
              <span>System Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-brand-400" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <span className="text-[10px] text-slate-400">Written to AuditLog</span>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-emerald-950/80 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-charcoal-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Platform Overview & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-charcoal-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Governance ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'companies'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-charcoal-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verification Queue ({companiesList.filter((c) => !c.isVerified).length} Pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('marketplace')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'marketplace'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-charcoal-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Marketplace & RFQ Moderation</span>
        </button>

        <button
          onClick={() => setActiveTab('audit-logs')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'audit-logs'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-charcoal-800/60'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Trail Logs</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & ADVANCED ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Industrial Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active CO2 Pool"
              value={`${kpis?.activeVolumeTonnes || '170.0'} T`}
              subtitle="Current Gujarat liquid & gas pool"
              icon={Layers}
              variant="emerald"
            />
            <StatCard
              title="Platform Gross Volume"
              value={`₹${((kpis?.grossMerchandiseValue || 862000) / 100000).toFixed(1)} Lakhs`}
              subtitle={`${kpis?.totalOrdersCount || 5} Total platform transactions`}
              icon={DollarSign}
              variant="amber"
            />
            <StatCard
              title="Carbon Routed"
              value={`${kpis?.totalVolumeDeliveredTonnes || '80.0'} T`}
              subtitle="Delivered & productively utilized"
              icon={TrendingUp}
              variant="cyan"
            />
            <StatCard
              title="Platform Fee Accrued"
              value={`₹${(kpis?.platformRevenue || 21500).toLocaleString()}`}
              subtitle={`Governed rate: ${kpis?.platformFeePercentage || 2.5}%`}
              icon={Sliders}
              variant="neutral"
            />
          </div>

          {/* Secondary Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-charcoal-900 border border-emerald-950/80">
              <span className="text-[11px] text-slate-400 block uppercase tracking-wider">Suppliers Onboarded</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1 block">
                {kpis?.supplierUsersCount || 1} Organizations
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-charcoal-900 border border-emerald-950/80">
              <span className="text-[11px] text-slate-400 block uppercase tracking-wider">Buyers Onboarded</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1 block">
                {kpis?.buyerUsersCount || 1} Organizations
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-charcoal-900 border border-emerald-950/80">
              <span className="text-[11px] text-slate-400 block uppercase tracking-wider">Active RFQs</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1 block">
                {kpis?.activeRfqsCount || 0} Request Cycles
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-charcoal-900 border border-emerald-950/80">
              <span className="text-[11px] text-slate-400 block uppercase tracking-wider">Avg Trade Price</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                ₹{kpis?.avgCo2PricePerKg || 4.15} / kg
              </span>
            </div>
          </div>

          {/* Charts Row 1: CO2 Flow Funnel & Transaction Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Carbon Flow Stream */}
            <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-brand-400" />
                    <span>Circular Carbon Flow Stream (Tonnes)</span>
                  </h2>
                  <p className="text-xs text-slate-400">Captured → Listed → Matched → Dispatched → Utilized</p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.carbonFlow || []} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2d27" />
                    <XAxis dataKey="stage" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#121816', borderColor: '#059669', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="tonnes" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Transaction Revenue & Volume */}
            <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span>Monthly GMV & Trade Volume Trends</span>
                  </h2>
                  <p className="text-xs text-slate-400">Trading volume and platform throughput</p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.monthlyTrends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2d27" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#121816', borderColor: '#d97706', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="volumeTonnes" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Volume (Tonnes)" />
                    <Area type="monotone" dataKey="gmv" stroke="#f59e0b" fill="url(#gmvGrad)" name="Gross Value (₹)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: User Growth & Price Dynamics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Onboarding Growth */}
            <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4">
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Supplier vs. Buyer Onboarding Cadence</span>
              </h2>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.userGrowth || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2d27" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#121816', borderColor: '#0891b2', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="suppliers" stroke="#10b981" strokeWidth={2} name="Suppliers" />
                    <Line type="monotone" dataKey="buyers" stroke="#06b6d4" strokeWidth={2} name="Buyers" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Average CO2 Price by State */}
            <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4">
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
                <Scale className="w-4 h-4 text-brand-400" />
                <span>Benchmark CO2 Pricing by Physical Stream</span>
              </h2>
              <div className="space-y-3 pt-2">
                {(data?.priceByState || []).map((item) => (
                  <div key={item.state} className="p-3.5 rounded-2xl bg-charcoal-950 border border-emerald-950 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{item.state}</span>
                      <span className="text-[11px] text-slate-400">Purity Benchmark: ~{item.purityAvg}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold font-mono text-emerald-400">₹{item.avgPrice.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500 block">per kg base rate</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: USER GOVERNANCE */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Platform User Directory & Moderation</h2>
              <p className="text-xs text-slate-400">Audit user access, roles, organization ties, and suspension states</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {loading ? (
            <SkeletonTable rows={4} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState title="No Users Found" description="No registered platform users match your search criteria." />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-charcoal-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-emerald-950/60">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Organization</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Registered</th>
                      <th className="p-3.5 text-right">Moderation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/40">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-charcoal-800/40 transition-colors">
                        <td className="p-3.5">
                          <span className="font-bold text-white block">{u.name}</span>
                          <span className="text-[11px] text-slate-400">{u.email}</span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                              u.role === 'ADMIN'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                                : u.role === 'SUPPLIER'
                                ? 'bg-emerald-950/80 text-brand-300 border border-emerald-500/30'
                                : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-slate-200 block">{u.company?.name || 'Individual'}</span>
                          <span className="text-[10px] text-slate-500">{u.company?.city || 'Gujarat'}, India</span>
                        </td>
                        <td className="p-3.5">
                          {u.isSuspended ? (
                            <span className="inline-flex items-center space-x-1 text-red-400 font-semibold text-[11px]">
                              <Ban className="w-3 h-3" />
                              <span>Suspended</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold text-[11px]">
                              <CheckCircle className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="p-3.5 text-right">
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleToggleUserStatus(u.id, Boolean(u.isSuspended))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                u.isSuspended
                                  ? 'bg-emerald-950/80 text-brand-300 border border-emerald-500/40 hover:bg-emerald-900/60'
                                  : 'bg-red-950/60 text-red-300 border border-red-500/30 hover:bg-red-900/50'
                              }`}
                            >
                              {u.isSuspended ? 'Reinstate User' : 'Suspend User'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Stack */}
              <div className="block sm:hidden space-y-3">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white block text-sm">{u.name}</span>
                        <span className="text-xs text-slate-400">{u.email}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'ADMIN' ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-brand-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 flex justify-between border-t border-emerald-950/60 pt-2">
                      <span>Org: {u.company?.name || 'Individual'}</span>
                      <span>Status: {u.isSuspended ? 'Suspended' : 'Active'}</span>
                    </div>
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleToggleUserStatus(u.id, Boolean(u.isSuspended))}
                        className="w-full py-2 rounded-lg text-xs font-semibold bg-charcoal-800 text-slate-200 border border-emerald-950"
                      >
                        {u.isSuspended ? 'Reinstate User' : 'Suspend User'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VERIFICATION QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'companies' && (
        <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Organization Verification & Trust Center</h2>
              <p className="text-xs text-slate-400">Validate industrial carbon capture certificates and adjust trust scores</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search company or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCompanies.map((c) => (
              <div
                key={c.id}
                className={`p-5 rounded-3xl bg-charcoal-950 border transition-all space-y-4 ${
                  c.isVerified ? 'border-emerald-950/80' : 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-white">{c.name}</h3>
                      <TrustBadge isVerified={c.isVerified} showScore={false} size="sm" />
                    </div>
                    <span className="text-[11px] text-slate-400">{c.industry} • {c.city || 'Gujarat'}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-brand-400">
                      Trust: {c.trustScore.toFixed(1)}/100
                    </span>
                    <div className="flex items-center space-x-1 mt-1 justify-end">
                      <button
                        onClick={() => handleUpdateTrust(c.id, -2.5)}
                        title="Decrease trust score"
                        className="px-1.5 py-0.5 rounded bg-charcoal-800 text-[10px] text-red-300 hover:bg-charcoal-700"
                      >
                        -2.5
                      </button>
                      <button
                        onClick={() => handleUpdateTrust(c.id, 2.5)}
                        title="Increase trust score"
                        className="px-1.5 py-0.5 rounded bg-charcoal-800 text-[10px] text-emerald-300 hover:bg-charcoal-700"
                      >
                        +2.5
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {c.description || 'Industrial organization active on ReCarbo carbon exchange network.'}
                </p>

                {/* Verification Document Info */}
                <div className="p-3 rounded-2xl bg-charcoal-900 border border-emerald-950/60 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Compliance Credentials</span>
                  </div>
                  <button
                    onClick={() => setSelectedCompanyDocs(c)}
                    className="text-xs text-brand-400 hover:underline flex items-center space-x-1 font-medium"
                  >
                    <span>Inspect Docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-emerald-950/60">
                  {c.isVerified ? (
                    <button
                      onClick={() => handleVerifyCompany(c.id, false, 'Revoked by administrator')}
                      className="px-3.5 py-1.5 rounded-xl bg-red-950/60 text-red-300 border border-red-500/30 hover:bg-red-900/50 text-xs font-semibold transition-all"
                    >
                      Revoke Verification
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleVerifyCompany(c.id, false, 'Rejected due to incomplete QA documentation')}
                        className="px-3 py-1.5 rounded-xl bg-charcoal-800 text-slate-300 hover:text-white text-xs font-semibold transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleVerifyCompany(c.id, true, 'ISO & GST credentials verified by admin')}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-charcoal-950 text-xs font-bold shadow-md shadow-brand-500/20 hover:from-emerald-500 transition-all"
                      >
                        Approve & Verify
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MARKETPLACE & RFQ GOVERNANCE */}
      {/* ========================================================================= */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          {/* Active Listings Oversight */}
          <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight">Active CO2 Listings Moderation</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-charcoal-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-emerald-950/60">
                  <tr>
                    <th className="p-3.5">Listing Title</th>
                    <th className="p-3.5">Supplier</th>
                    <th className="p-3.5">Purity</th>
                    <th className="p-3.5">Available (Kg)</th>
                    <th className="p-3.5">Unit Price</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Moderation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/40">
                  {listingsList.map((l) => (
                    <tr key={l.id} className="hover:bg-charcoal-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-white">{l.title}</td>
                      <td className="p-3.5">{l.supplierCompany?.name}</td>
                      <td className="p-3.5 font-mono text-emerald-400">{l.purityPercentage}%</td>
                      <td className="p-3.5 font-mono">{(l.quantityAvailableKg / 1000).toFixed(1)} T</td>
                      <td className="p-3.5 font-mono">₹{l.pricePerKg.toFixed(2)}/kg</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            l.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-brand-300 border border-emerald-500/30'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {l.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleModerateListing(l.id, 'PAUSED')}
                            className="px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/30 text-[11px] font-semibold"
                          >
                            Pause Listing
                          </button>
                        ) : (
                          <button
                            onClick={() => handleModerateListing(l.id, 'ACTIVE')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-brand-300 border border-emerald-500/30 text-[11px] font-semibold"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Orders & Escrow Oversight */}
          <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight">Platform Orders & Escrow Ledger</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-charcoal-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-emerald-950/60">
                  <tr>
                    <th className="p-3.5">Order Number</th>
                    <th className="p-3.5">Buyer</th>
                    <th className="p-3.5">Supplier</th>
                    <th className="p-3.5">Volume</th>
                    <th className="p-3.5">Gross Amount</th>
                    <th className="p-3.5">Order Status</th>
                    <th className="p-3.5 text-right">Escrow Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/40">
                  {ordersList.map((ord) => (
                    <tr key={ord.id} className="hover:bg-charcoal-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-white">{ord.orderNumber}</td>
                      <td className="p-3.5">{ord.buyerCompany?.name}</td>
                      <td className="p-3.5">{ord.supplierCompany?.name}</td>
                      <td className="p-3.5 font-mono">{(ord.quantityKg / 1000).toFixed(1)} Tonnes</td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400">₹{ord.totalAmount.toLocaleString()}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-charcoal-950 border border-emerald-950">
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono text-[11px] text-amber-400 font-semibold">
                        {ord.paymentStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUDIT TRAIL LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'audit-logs' && (
        <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Audit Trail & Accountability Logs</h2>
              <p className="text-xs text-slate-400">Immutable record of every administrative and transactional action</p>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Actions</option>
                <option value="VERIFIED">Verification Actions</option>
                <option value="FEE">Fee Updates</option>
                <option value="ORDER">Order Actions</option>
                <option value="USER">User Status Actions</option>
              </select>

              <div className="relative w-48">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-charcoal-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-emerald-950/60">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Entity</th>
                  <th className="p-3.5">Operator</th>
                  <th className="p-3.5">Details Summary</th>
                  <th className="p-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/40">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-charcoal-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-amber-400">{log.action}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-charcoal-950 border border-emerald-950">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">{log.user?.email || 'System'}</td>
                    <td className="p-3.5 max-w-xs truncate text-slate-400">{log.details || 'N/A'}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedAuditLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 text-[11px]"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Log Inspection Modal */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl bg-charcoal-900 border border-amber-500/30 p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>Audit Log Entry: {selectedAuditLog.action}</span>
              </h3>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <p><strong>Entity Type:</strong> {selectedAuditLog.entityType}</p>
              <p><strong>Entity ID:</strong> {selectedAuditLog.entityId || 'N/A'}</p>
              <p><strong>Operator:</strong> {selectedAuditLog.user?.name} ({selectedAuditLog.user?.email})</p>
              <p><strong>Timestamp:</strong> {new Date(selectedAuditLog.createdAt).toISOString()}</p>
              <div className="mt-3">
                <span className="text-[11px] text-slate-400 block mb-1">Payload Details:</span>
                <pre className="p-3 rounded-xl bg-charcoal-950 border border-emerald-950 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                  {selectedAuditLog.details || 'No payload recorded'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Docs Inspection Modal */}
      {selectedCompanyDocs && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl bg-charcoal-900 border border-emerald-500/30 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-brand-400" />
                <span>Compliance Docs: {selectedCompanyDocs.name}</span>
              </h3>
              <button
                onClick={() => setSelectedCompanyDocs(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-charcoal-950 border border-emerald-950/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Submitted Certificates</span>
                <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto">
                  {selectedCompanyDocs.verificationDocs || JSON.stringify({ gstin: '24AAACG1234F1Z5', isoCert: 'ISO-14064-GHG-2024', purityReport: 'GC-MS-99.8-CERT' }, null, 2)}
                </pre>
              </div>
              <p className="text-[11px] text-slate-400">
                Note: In this production prototype, verification documents are simulated for Gujarat industrial clusters.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
