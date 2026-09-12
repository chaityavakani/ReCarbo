import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { companyService } from '../../services/companyService';
import { TrustScoreBreakdown } from '../../types';
import { TrustBadge } from '../../components/TrustBadge';
import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Edit3,
  Save,
  CheckCircle,
  AlertCircle,
  Compass,
  Award,
  FileCheck,
  UploadCloud,
  Layers,
  Sparkles,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

export const CompanyProfilePage: React.FC = () => {
  const { company, updateCompanyProfile, user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [trustBreakdown, setTrustBreakdown] = useState<TrustScoreBreakdown | null>(null);
  const [loadingTrust, setLoadingTrust] = useState(true);

  // Verification modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyDocs, setVerifyDocs] = useState({
    gstin: '24AAACG1234F1Z5',
    isoCert: 'ISO-14064-GHG-2024',
    clearanceId: 'GPCB-CTE-GUJARAT-2024',
    purityCalibrationReport: 'GCMS-ANALYSIS-99.8.PDF',
    notes: 'Official industrial plant emissions and purity test certificates.',
  });
  const [submittingVerify, setSubmittingVerify] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    latitude: 21.7051,
    longitude: 72.9959,
    website: '',
    contactEmail: '',
    contactPhone: '',
  });

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        industry: company.industry || '',
        description: company.description || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || 'Gujarat',
        pincode: company.pincode || '',
        country: company.country || 'India',
        latitude: company.latitude || 21.7051,
        longitude: company.longitude || 72.9959,
        website: company.website || '',
        contactEmail: company.contactEmail || '',
        contactPhone: company.contactPhone || '',
      });

      loadTrustBreakdown(company.id);
    }
  }, [company]);

  const loadTrustBreakdown = async (companyId: string) => {
    try {
      setLoadingTrust(true);
      const data = await companyService.getTrustBreakdown(companyId);
      setTrustBreakdown(data);
    } catch (err) {
      console.error('Failed to load trust breakdown', err);
    } finally {
      setLoadingTrust(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      await updateCompanyProfile({
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
      });
      setStatusMessage({ type: 'success', text: 'Company profile updated successfully!' });
      setIsEditing(false);
      if (company?.id) {
        loadTrustBreakdown(company.id);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to save changes.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingVerify(true);
    setStatusMessage(null);
    try {
      await companyService.submitVerificationRequest(verifyDocs, verifyDocs.notes);
      setStatusMessage({
        type: 'success',
        text: 'Verification documents submitted successfully! Admin review in progress.',
      });
      setShowVerifyModal(false);
      if (company?.id) {
        loadTrustBreakdown(company.id);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to submit verification.',
      });
    } finally {
      setSubmittingVerify(false);
    }
  };

  const getFactorColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
      case 'GOOD':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40';
      case 'FAIR':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
      default:
        return 'text-slate-400 bg-charcoal-800 border-slate-700';
    }
  };

  const verificationStatus =
    trustBreakdown?.verificationStatus || company?.verificationStatus || (company?.isVerified ? 'VERIFIED' : 'UNVERIFIED');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-charcoal-900 via-charcoal-900 to-emerald-950/40 border border-emerald-950/80 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-400 flex items-center justify-center text-charcoal-950 font-extrabold text-2xl shadow-lg">
              {company?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {company?.name || 'Organization Profile'}
                </h1>
                <TrustBadge
                  score={trustBreakdown?.overallScore || company?.trustScore || 85.0}
                  isVerified={company?.isVerified ?? false}
                  size="sm"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {company?.industry} • Registered Node in {company?.city || 'Gujarat'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-center">
            {!company?.isVerified && (
              <button
                onClick={() => setShowVerifyModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-charcoal-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                <FileCheck className="w-4 h-4" />
                <span>
                  {verificationStatus === 'PENDING_REVIEW'
                    ? 'Review In Progress'
                    : 'Submit Verification'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center space-x-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/60 border-red-500/40 text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Verification Lifecycle Stepper */}
      <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Trust & Regulatory Verification Lifecycle</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Protocol: Registration $\rightarrow$ Facility Profile $\rightarrow$ Carbon Data Submission $\rightarrow$ Admin Review $\rightarrow$ Verified Badge
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              company?.isVerified
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                : verificationStatus === 'PENDING_REVIEW'
                ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                : 'bg-charcoal-950 text-slate-400 border-slate-700'
            }`}
          >
            Status: {verificationStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {[
            { step: '1', title: 'Registration', desc: 'Account created', completed: true },
            { step: '2', title: 'Company Details', desc: 'Node coordinates set', completed: true },
            {
              step: '3',
              title: 'Data Submission',
              desc: 'Purity & ISO certificates',
              completed: verificationStatus === 'PENDING_REVIEW' || company?.isVerified,
            },
            {
              step: '4',
              title: 'Admin Review',
              desc: 'Compliance clearing',
              completed: company?.isVerified,
            },
            {
              step: '5',
              title: 'Verified Partner',
              desc: '90+ Trust Score badge',
              completed: company?.isVerified,
            },
          ].map((s, idx) => (
            <div
              key={s.step}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                s.completed
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-charcoal-950 border-emerald-950/40 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold">Step {s.step}</span>
                {s.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{s.title}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Score Breakdown Section */}
      <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/60 pb-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2.5">
              <Award className="w-5 h-5 text-emerald-400" />
              <span>Explainable Trust Score Breakdown</span>
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic 6-factor algorithmic reliability scoring for B2B procurement confidence
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-center">
            <div className="px-4 py-2 rounded-2xl bg-charcoal-950 border border-emerald-500/30 text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                Overall Index
              </span>
              <span className="text-xl font-black font-mono text-emerald-400">
                {trustBreakdown ? trustBreakdown.overallScore.toFixed(1) : (company?.trustScore || 85.0).toFixed(1)}
                <span className="text-xs text-slate-500 font-normal"> / 100</span>
              </span>
            </div>
            <div className="px-3 py-2 rounded-2xl bg-emerald-950 border border-emerald-400 text-center">
              <span className="text-[10px] text-emerald-400 block font-bold">Grade</span>
              <span className="text-lg font-black font-mono text-white">
                {trustBreakdown?.grade || 'AA'}
              </span>
            </div>
          </div>
        </div>

        {/* Plain Language Summary */}
        {trustBreakdown?.summary && (
          <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950 flex items-start space-x-3 text-xs">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-slate-300 leading-relaxed">
              <strong className="text-emerald-300">Algorithmic Assessment: </strong>
              {trustBreakdown.summary}
            </div>
          </div>
        )}

        {/* 6 Explainable Factors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(trustBreakdown?.factors || []).map((factor) => (
            <div
              key={factor.id}
              className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950/80 space-y-3 flex flex-col justify-between hover:border-emerald-500/30 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-white leading-snug">{factor.name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex-shrink-0 ${getFactorColor(
                      factor.status
                    )}`}
                  >
                    {factor.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {factor.description}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-emerald-950/60">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Score ({factor.weight}% wt):</span>
                  <span className="font-bold text-emerald-400">{factor.score.toFixed(1)} / 100</span>
                </div>
                <div className="w-full bg-charcoal-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Net Platform Contribution</span>
                  <span className="font-mono font-semibold text-slate-300">
                    +{factor.contribution.toFixed(1)} pts
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Organization Details Form & Coordinates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Summary & Facility Node */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Facility Coordinates</span>
            </h3>
            <p className="text-xs text-slate-400">
              Latitude & longitude are used for deterministic freight distance and transport pricing algorithms.
            </p>
            <div className="p-3 rounded-2xl bg-charcoal-950 border border-emerald-950/60 font-mono text-xs text-slate-300 space-y-1">
              <div>Lat: <strong className="text-emerald-400">{formData.latitude}</strong></div>
              <div>Lng: <strong className="text-emerald-400">{formData.longitude}</strong></div>
            </div>
          </div>

          <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Organization Role:</span>
              <strong className="text-white">{user?.role}</strong>
            </div>
            <div className="flex justify-between">
              <span>Primary Admin:</span>
              <strong className="text-white">{user?.email}</strong>
            </div>
            <div className="flex justify-between">
              <span>Registered Node:</span>
              <strong className="text-white">{company?.city || 'Gujarat'}</strong>
            </div>
          </div>
        </div>

        {/* Right Form: Editable Profile Details */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSave}
            className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-emerald-950/60">
              <h2 className="text-base font-bold text-white">Facility & Organization Profile</h2>
              {isEditing && (
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Editing Mode Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Company Legal Entity
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950/60 disabled:bg-charcoal-950/50 disabled:text-slate-400 text-sm text-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Industry Sector
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950/60 disabled:bg-charcoal-950/50 disabled:text-slate-400 text-sm text-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Description & Operational Scope
                </label>
                <textarea
                  rows={3}
                  disabled={!isEditing}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950/60 disabled:bg-charcoal-950/50 disabled:text-slate-400 text-sm text-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Facility City / Cluster
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950/60 disabled:bg-charcoal-950/50 disabled:text-slate-400 text-sm text-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  State / Region
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950/60 disabled:bg-charcoal-950/50 disabled:text-slate-400 text-sm text-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Plant / Facility Address
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950/60 disabled:bg-charcoal-950/50 disabled:text-slate-400 text-sm text-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  disabled={!isEditing}
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950/60 disabled:bg-charcoal-950/50 disabled:text-slate-400 text-sm text-white focus:border-brand-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  disabled={!isEditing}
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950/60 disabled:bg-charcoal-950/50 disabled:text-slate-400 text-sm text-white focus:border-brand-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950/60 disabled:bg-charcoal-950/50 disabled:text-slate-400 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Website URL
                </label>
                <input
                  type="url"
                  disabled={!isEditing}
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-emerald-950/60 disabled:bg-charcoal-950/50 disabled:text-slate-400 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {isEditing && (
              <div className="pt-4 border-t border-emerald-950/60 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-charcoal-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-charcoal-950 font-bold text-xs shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-all flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Verification Submission Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-charcoal-900 border border-emerald-500/40 p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-emerald-950/60 pb-4">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Submit Verification Credentials
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Upload regulatory clearance IDs & ISO carbon documentation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitVerification} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Corporate GSTIN / Tax ID
                </label>
                <input
                  type="text"
                  required
                  value={verifyDocs.gstin}
                  onChange={(e) => setVerifyDocs({ ...verifyDocs, gstin: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-emerald-950 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  ISO 14064 GHG Verification Certificate Ref
                </label>
                <input
                  type="text"
                  required
                  value={verifyDocs.isoCert}
                  onChange={(e) => setVerifyDocs({ ...verifyDocs, isoCert: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-emerald-950 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  State Pollution Control Board (GPCB) Clearance Ref
                </label>
                <input
                  type="text"
                  required
                  value={verifyDocs.clearanceId}
                  onChange={(e) => setVerifyDocs({ ...verifyDocs, clearanceId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-emerald-950 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Purity Gas Chromatography Calibration Doc
                </label>
                <input
                  type="text"
                  required
                  value={verifyDocs.purityCalibrationReport}
                  onChange={(e) =>
                    setVerifyDocs({ ...verifyDocs, purityCalibrationReport: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-emerald-950 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Additional Audit Notes
                </label>
                <textarea
                  rows={2}
                  value={verifyDocs.notes}
                  onChange={(e) => setVerifyDocs({ ...verifyDocs, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-emerald-950 text-white"
                />
              </div>

              <div className="pt-3 border-t border-emerald-950/60 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-charcoal-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVerify}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-charcoal-950 font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submittingVerify ? 'Submitting...' : 'Submit for Admin Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
