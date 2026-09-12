import api from './api';
import {
  CO2Listing,
  CO2Requirement,
  QuoteRequest,
  Quote,
  AIMatchResult,
  AllocationPolicy,
} from '../types';

export interface ListingFilters {
  search?: string;
  status?: string;
  stateOfMatter?: string;
  minPurity?: number;
  maxPurity?: number;
  minPrice?: number;
  maxPrice?: number;
  minQuantityKg?: number;
  verifiedOnly?: boolean;
  industry?: string;
  transactionMode?: string;
  sortBy?: string;
  supplierCompanyId?: string;
}

export interface CreateListingInput {
  title: string;
  description?: string;
  quantityAvailableKg: number;
  minOrderKg?: number;
  purityPercentage: number;
  captureMethod?: string;
  stateOfMatter?: string;
  pressureBar?: number | null;
  temperatureC?: number | null;
  pricePerKg: number;
  isSplitAllowed?: boolean;
  transactionMode?: string;
  expiryDate?: string | null;
}

export interface CreateRequirementInput {
  title: string;
  description?: string;
  quantityRequiredKg: number;
  minPurityPercentage: number;
  maxPricePerKg?: number | null;
  preferredState?: string;
  targetDeliveryDate?: string | null;
}

export interface CalculateLogisticsInput {
  quantityKg: number;
  pricePerKg?: number;
  originCity?: string;
  originLat?: number;
  originLng?: number;
  destCity?: string;
  destLat?: number;
  destLng?: number;
  distanceKm?: number;
  transportMode?: string;
}

export const marketplaceService = {
  // ==========================================
  // 1. CO2 LISTINGS (Module 1)
  // ==========================================
  async getListings(filters?: ListingFilters): Promise<CO2Listing[]> {
    const res = await api.get('/marketplace/listings', { params: filters });
    return res.data.listings || [];
  },

  async getListingById(id: string): Promise<CO2Listing> {
    const res = await api.get(`/marketplace/listings/${id}`);
    return res.data.listing;
  },

  async createListing(data: CreateListingInput): Promise<CO2Listing> {
    const res = await api.post('/marketplace/listings', data);
    return res.data.listing;
  },

  async updateListing(id: string, data: Partial<CreateListingInput>): Promise<CO2Listing> {
    const res = await api.put(`/marketplace/listings/${id}`, data);
    return res.data.listing;
  },

  async setListingStatus(id: string, status: string): Promise<CO2Listing> {
    const res = await api.patch(`/marketplace/listings/${id}/status`, { status });
    return res.data.listing;
  },

  async deleteListing(id: string): Promise<void> {
    await api.delete(`/marketplace/listings/${id}`);
  },

  // ==========================================
  // 2. BUYER REQUIREMENTS & MATCHING (Module 2)
  // ==========================================
  async getRequirements(): Promise<CO2Requirement[]> {
    const res = await api.get('/marketplace/requirements');
    return res.data.requirements || [];
  },

  async getRequirementById(id: string): Promise<CO2Requirement> {
    const res = await api.get(`/marketplace/requirements/${id}`);
    return res.data.requirement;
  },

  async createRequirement(data: CreateRequirementInput): Promise<CO2Requirement> {
    const res = await api.post('/marketplace/requirements', data);
    return res.data.requirement;
  },

  async updateRequirement(id: string, data: Partial<CreateRequirementInput>): Promise<CO2Requirement> {
    const res = await api.put(`/marketplace/requirements/${id}`, data);
    return res.data.requirement;
  },

  async deleteRequirement(id: string): Promise<void> {
    await api.delete(`/marketplace/requirements/${id}`);
  },

  async findMatchesForRequirement(requirementId: string): Promise<{
    requirement: CO2Requirement;
    totalMatches: number;
    bestDeal: AIMatchResult | null;
    matches: AIMatchResult[];
  }> {
    const res = await api.get(`/marketplace/requirements/${requirementId}/matches`);
    return res.data;
  },

  async findMatchesForListing(listingId: string): Promise<{
    listing: CO2Listing;
    totalMatches: number;
    matches: AIMatchResult[];
  }> {
    const res = await api.get(`/marketplace/listings/${listingId}/matches`);
    return res.data;
  },

  // ==========================================
  // 3. RFQ & ALLOCATION ENGINE (Module 3)
  // ==========================================
  async getQuoteRequests(listingId?: string): Promise<QuoteRequest[]> {
    const res = await api.get('/marketplace/quote-requests', { params: { listingId } });
    return res.data.rfqs || [];
  },

  async getQuoteRequestById(id: string): Promise<QuoteRequest> {
    const res = await api.get(`/marketplace/quote-requests/${id}`);
    return res.data.rfq;
  },

  async createQuoteRequest(data: {
    listingId: string;
    deadline: string;
    allocationPolicy?: AllocationPolicy;
    requirementId?: string;
  }): Promise<QuoteRequest> {
    const res = await api.post('/marketplace/quote-requests', data);
    return res.data.rfq;
  },

  async submitQuote(quoteRequestId: string, data: {
    offeredQuantityKg: number;
    offeredPricePerKg: number;
  }): Promise<Quote> {
    const res = await api.post(`/marketplace/quote-requests/${quoteRequestId}/quotes`, data);
    return res.data.quote;
  },

  async previewAllocation(quoteRequestId: string, policy?: AllocationPolicy): Promise<any> {
    const res = await api.get(`/marketplace/quote-requests/${quoteRequestId}/preview-allocation`, {
      params: { policy },
    });
    return res.data.preview;
  },

  async executeAllocation(quoteRequestId: string, policy?: AllocationPolicy): Promise<any> {
    const res = await api.post(`/marketplace/quote-requests/${quoteRequestId}/allocate`, { policy });
    return res.data;
  },

  // ==========================================
  // 4. LOGISTICS & COST CALCULATOR (Module 4)
  // ==========================================
  async calculateLogistics(params: CalculateLogisticsInput): Promise<any> {
    const res = await api.post('/marketplace/calculate-logistics', params);
    return res.data;
  },

  async calculateProductDemand(params: {
    application: string;
    productionUnits: number;
    unitPricePerKg?: number;
  }): Promise<any> {
    const res = await api.post('/marketplace/calculate-product-demand', params);
    return res.data;
  },

  // ==========================================
  // 5. DASHBOARD & NOTIFICATIONS COMPATIBILITY
  // ==========================================
  async getOverviewStats(): Promise<any> {
    const res = await api.get('/admin/overview');
    return res.data.stats || {};
  },

  async getMatches(): Promise<any[]> {
    const res = await api.get('/marketplace/requirements');
    const allReqs = res.data.requirements || [];
    const allMatches: any[] = [];
    for (const r of allReqs) {
      if (r.matches) {
        allMatches.push(...r.matches);
      }
    }
    return allMatches;
  },

  async getNotifications(): Promise<any[]> {
    const res = await api.get('/notifications');
    return res.data.notifications || [];
  },

  async markAllNotificationsRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },
};

