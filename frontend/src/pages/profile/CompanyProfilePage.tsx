import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TrustBadge } from '../../components/TrustBadge';
import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  Edit3,
  Save,
  CheckCircle,
  AlertCircle,
  Compass,
} from 'lucide-react';

export const CompanyProfilePage: React.FC = () => {
  const { company, updateCompanyProfile, user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
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
    }
  }, [company]);

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
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to save changes.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
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
                  score={company?.trustScore || 85.0}
                  isVerified={company?.isVerified ?? false}
                  size="sm"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {company?.industry} • Registered Node in {company?.city || 'Gujarat'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all self-start sm:self-center"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
          </button>
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

      {/* Profile Details or Edit Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Trust & Facility Overview */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Trust & Verification</span>
            </h3>

            <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Trust Score</span>
                <span className="text-base font-mono font-extrabold text-emerald-400">
                  {company?.trustScore ? company.trustScore.toFixed(1) : '85.0'} / 100
                </span>
              </div>
              <div className="w-full bg-charcoal-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${company?.trustScore || 85}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Trust score is computed based on historical delivery adherence, purity consistency, and prompt RFQ fulfillment.
              </p>
            </div>

            <div className="pt-2 border-t border-emerald-950/60 text-xs text-slate-400 space-y-2">
              <div className="flex justify-between">
                <span>Account Role:</span>
                <strong className="text-white">{user?.role}</strong>
              </div>
              <div className="flex justify-between">
                <span>Primary Contact:</span>
                <strong className="text-white">{user?.email}</strong>
              </div>
              <div className="flex justify-between">
                <span>Location Node:</span>
                <strong className="text-white">{company?.city || 'Dahej/Gujarat'}</strong>
              </div>
            </div>
          </div>

          {/* GPS Coordinates Card */}
          <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Facility Coordinates</span>
            </h3>
            <p className="text-xs text-slate-400">
              Precise latitude and longitude enable deterministic logistics routing and freight estimation.
            </p>
            <div className="p-3 rounded-2xl bg-charcoal-950 border border-emerald-950/60 font-mono text-xs text-slate-300 space-y-1">
              <div>Lat: <strong className="text-emerald-400">{formData.latitude}</strong></div>
              <div>Lng: <strong className="text-emerald-400">{formData.longitude}</strong></div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Information */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSave}
            className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-emerald-950/60">
              <h2 className="text-base font-bold text-white">Organization Details</h2>
              {isEditing && (
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Editing Mode
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Company Name
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
                  Facility City / Hub
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
                  Plant / Office Address
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
    </div>
  );
};
