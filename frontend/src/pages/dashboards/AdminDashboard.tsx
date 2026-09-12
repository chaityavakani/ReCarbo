import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService } from '../../services/marketplaceService';
import { companyService } from '../../services/companyService';
import { Company } from '../../types';
import { StatCard } from '../../components/StatCard';
import { TrustBadge } from '../../components/TrustBadge';
import { SkeletonTable } from '../../components/Skeleton';
import {
  ShieldCheck,
  Sliders,
  Layers,
  Building,
  History,
  CheckCircle,
  XCircle,
  Activity,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [overviewStats, allCompanies] = await Promise.all([
          marketplaceService.getOverviewStats(),
          companyService.listCompanies(),
        ]);
        setStats(overviewStats);
        setCompanies(allCompanies);
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleVerify = async (companyId: string, currentStatus: boolean) => {
    try {
      const result = await companyService.verifyCompany(companyId, !currentStatus);
      setCompanies((prev) => prev.map((c) => (c.id === companyId ? result.company : c)));
    } catch (err) {
      console.error('Failed to update verification', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Hero Header */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950/80 via-charcoal-900 to-charcoal-900 border border-amber-500/20 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>ReCarbo Platform Operations Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Platform Administration
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Operator: <span className="text-white font-medium">{user?.name}</span> • Governing Gujarat Carbon Capture-to-Product Infrastructure
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/admin/settings"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-all"
            >
              <Sliders className="w-4 h-4" />
              <span>System Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Industrial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active CO2 Volume"
          value={`${stats?.activeVolumeTonnes || '170.0'} T`}
          subtitle="Gujarat industrial supply pool"
          icon={Layers}
          variant="emerald"
        />
        <StatCard
          title="Verified Entities"
          value={companies.filter((c) => c.isVerified).length.toString()}
          subtitle={`${companies.length} Total organizations onboarded`}
          icon={Building}
          variant="cyan"
        />
        <StatCard
          title="Platform Fee Rate"
          value={`${stats?.platformFeePercentage || 2.5}%`}
          subtitle="Dynamic admin-configured rate"
          icon={Sliders}
          variant="amber"
        />
        <StatCard
          title="Transport Baseline"
          value={`₹${stats?.transportRate || 0.015}`}
          subtitle="Per km per kg standard logistics"
          icon={Activity}
          variant="neutral"
        />
      </div>

      {/* Organization Verification & Moderation Table */}
      <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Industrial Organization Verification Queue
            </h2>
            <p className="text-xs text-slate-400">
              Audit industrial facilities for carbon capture and offtake certification
            </p>
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={4} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-charcoal-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-emerald-950/60">
                <tr>
                  <th className="p-3.5">Company Name</th>
                  <th className="p-3.5">Industry</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Trust Score</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/40">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-charcoal-800/50 transition-colors">
                    <td className="p-3.5 font-bold text-white">{company.name}</td>
                    <td className="p-3.5">{company.industry}</td>
                    <td className="p-3.5">{company.city || 'Gujarat'}, India</td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-emerald-400">
                        {company.trustScore.toFixed(1)}/100
                      </span>
                    </td>
                    <td className="p-3.5">
                      <TrustBadge isVerified={company.isVerified} showScore={false} size="sm" />
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleVerify(company.id, company.isVerified)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          company.isVerified
                            ? 'bg-red-950/60 text-red-300 border border-red-500/30 hover:bg-red-900/50'
                            : 'bg-emerald-950/80 text-brand-300 border border-emerald-500/40 hover:bg-emerald-900/60'
                        }`}
                      >
                        {company.isVerified ? 'Revoke Verification' : 'Approve & Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
