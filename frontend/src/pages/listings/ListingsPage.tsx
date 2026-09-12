import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService, CreateListingInput } from '../../services/marketplaceService';
import { CO2Listing, AIMatchResult } from '../../types';
import { SkeletonTable } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ListingCreateModal } from '../../components/ListingCreateModal';
import { RFQQuoteModal } from '../../components/RFQQuoteModal';
import { MatchDrawer } from '../../components/MatchDrawer';
import {
  Layers,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Trash2,
  Edit,
  Scale,
  Sparkles,
  MapPin,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ListingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState<CO2Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState<CO2Listing | null>(null);
  const [rfqListing, setRfqListing] = useState<CO2Listing | null>(null);

  // Match Drawer State
  const [matchDrawerData, setMatchDrawerData] = useState<{
    isOpen: boolean;
    matches: AIMatchResult[];
    bestDeal: AIMatchResult | null;
  }>({ isOpen: false, matches: [], bestDeal: null });

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await marketplaceService.getListings({
        supplierCompanyId: user?.role === 'SUPPLIER' ? user.companyId || undefined : undefined,
        status: undefined, // load all statuses (ACTIVE, PAUSED, SOLD_OUT)
      });
      setListings(data);
    } catch (err) {
      console.error('Failed to load listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleCreateListing = async (data: CreateListingInput) => {
    if (editingListing) {
      await marketplaceService.updateListing(editingListing.id, data);
      setMessage(`Listing "${data.title}" updated successfully!`);
    } else {
      await marketplaceService.createListing(data);
      setMessage(`CO2 stream "${data.title}" published to marketplace with preview verification!`);
    }
    setEditingListing(null);
    loadListings();
  };

  const handleToggleStatus = async (listing: CO2Listing) => {
    try {
      const nextStatus = listing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await marketplaceService.setListingStatus(listing.id, nextStatus);
      setMessage(`Stream status changed to ${nextStatus}.`);
      loadListings();
    } catch (err: any) {
      setMessage(err.response?.data?.error?.message || 'Failed to update status');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to delete this CO2 supply stream?')) return;
    try {
      await marketplaceService.deleteListing(listingId);
      setMessage('Supply stream deleted from marketplace.');
      loadListings();
    } catch (err: any) {
      setMessage(err.response?.data?.error?.message || 'Failed to delete listing');
    }
  };

  const handleFindMatches = async (listing: CO2Listing) => {
    try {
      const data = await marketplaceService.findMatchesForListing(listing.id);
      setMatchDrawerData({
        isOpen: true,
        matches: data.matches,
        bestDeal: data.matches.length > 0 ? data.matches[0] : null,
      });
    } catch (e) {
      console.error('Failed to load matches', e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Layers className="w-7 h-7 text-brand-400" />
            <span>Supplier CO2 Inventory & Streams</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage captured CO2 inventory, preview physical assays, and open RFQ bidding rounds
          </p>
        </div>

        {user?.role === 'SUPPLIER' && (
          <button
            onClick={() => {
              setEditingListing(null);
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-charcoal-950 font-bold text-xs shadow-lg shadow-brand-500/20 transition-all self-start sm:self-center"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List New Captured Stream</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Streams Table */}
      {loading ? (
        <SkeletonTable rows={4} />
      ) : listings.length === 0 ? (
        <EmptyState
          title="No CO2 Streams Found"
          description="You have not published any captured CO2 supply streams yet."
          actionText="List First Stream"
          onActionClick={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-charcoal-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-emerald-950/60">
                <tr>
                  <th className="p-4">Stream & Capture Assay</th>
                  <th className="p-4">Inventory (kg / Tonnes)</th>
                  <th className="p-4">Purity</th>
                  <th className="p-4">Base Rate (₹/kg)</th>
                  <th className="p-4">Model</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/40">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-charcoal-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{l.title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <span>{l.stateOfMatter}</span>
                        <span>•</span>
                        <span>{l.captureMethod}</span>
                      </div>
                    </td>

                    <td className="p-4 font-mono">
                      <div className="font-bold text-white">
                        {(l.quantityAvailableKg / 1000).toFixed(1)} Tonnes
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {l.quantityAvailableKg.toLocaleString()} kg
                      </div>
                    </td>

                    <td className="p-4 font-mono font-bold text-emerald-400 text-sm">
                      {l.purityPercentage}%
                    </td>

                    <td className="p-4 font-mono">
                      <div className="font-bold text-brand-400">₹{l.pricePerKg.toFixed(2)}/kg</div>
                      <div className="text-[10px] text-slate-500">
                        ₹{(l.pricePerKg * 1000).toLocaleString()}/T
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        {l.transactionMode.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                          l.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : l.status === 'PAUSED'
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Find Offtakers */}
                        <button
                          onClick={() => handleFindMatches(l)}
                          title="Find Buyer Matches"
                          className="p-2 rounded-xl bg-charcoal-950 hover:bg-charcoal-800 text-cyan-400 border border-emerald-950 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>

                        {/* Open RFQ */}
                        <button
                          onClick={() => setRfqListing(l)}
                          title="Launch RFQ Round"
                          className="p-2 rounded-xl bg-charcoal-950 hover:bg-charcoal-800 text-amber-400 border border-emerald-950 transition-colors"
                        >
                          <Scale className="w-3.5 h-3.5" />
                        </button>

                        {/* Pause / Resume */}
                        <button
                          onClick={() => handleToggleStatus(l)}
                          title={l.status === 'ACTIVE' ? 'Pause Listing' : 'Resume Listing'}
                          className="p-2 rounded-xl bg-charcoal-950 hover:bg-charcoal-800 text-slate-300 border border-emerald-950 transition-colors"
                        >
                          {l.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditingListing(l);
                            setShowCreateModal(true);
                          }}
                          title="Edit Stream"
                          className="p-2 rounded-xl bg-charcoal-950 hover:bg-charcoal-800 text-slate-300 border border-emerald-950 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteListing(l.id)}
                          title="Delete Stream"
                          className="p-2 rounded-xl bg-charcoal-950 hover:bg-rose-950/60 text-rose-400 border border-emerald-950 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Listing Create / Edit Modal with Preview Step */}
      <ListingCreateModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingListing(null);
        }}
        onSubmit={handleCreateListing}
        initialData={
          editingListing
            ? {
                title: editingListing.title,
                description: editingListing.description || '',
                quantityAvailableKg: editingListing.quantityAvailableKg,
                minOrderKg: editingListing.minOrderKg,
                purityPercentage: editingListing.purityPercentage,
                captureMethod: editingListing.captureMethod,
                stateOfMatter: editingListing.stateOfMatter,
                pressureBar: editingListing.pressureBar,
                temperatureC: editingListing.temperatureC,
                pricePerKg: editingListing.pricePerKg,
                isSplitAllowed: editingListing.isSplitAllowed,
                transactionMode: editingListing.transactionMode,
              }
            : undefined
        }
        isEditMode={!!editingListing}
      />

      {/* Open RFQ Modal */}
      {rfqListing && (
        <RFQQuoteModal
          isOpen={!!rfqListing}
          mode="CREATE_RFQ"
          listingId={rfqListing.id}
          listingTitle={rfqListing.title}
          basePricePerKg={rfqListing.pricePerKg}
          maxAvailableKg={rfqListing.quantityAvailableKg}
          minOrderKg={rfqListing.minOrderKg}
          onClose={() => setRfqListing(null)}
          onSuccess={() => {
            setMessage(`RFQ opened for "${rfqListing.title}"!`);
            navigate('/quote-requests');
          }}
        />
      )}

      {/* Matchmaking Drawer */}
      <MatchDrawer
        isOpen={matchDrawerData.isOpen}
        matches={matchDrawerData.matches}
        bestDeal={matchDrawerData.bestDeal}
        onClose={() => setMatchDrawerData({ ...matchDrawerData, isOpen: false })}
      />
    </div>
  );
};
