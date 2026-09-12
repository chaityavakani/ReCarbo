import { prisma } from '../utils/prisma';
import { ListingStatus, TransactionMode } from '@prisma/client';
import { createAuditLog } from './auditService';
import { broadcastEvent } from '../socket/socketHandler';
import { SOCKET_EVENTS } from '../socket/events';

export interface ListingFilterParams {
  search?: string;
  status?: ListingStatus;
  stateOfMatter?: string;
  minPurity?: number;
  maxPurity?: number;
  minPrice?: number;
  maxPrice?: number;
  minQuantityKg?: number;
  verifiedOnly?: boolean;
  industry?: string;
  transactionMode?: TransactionMode;
  supplierCompanyId?: string;
  sortBy?: 'best_match' | 'price_asc' | 'price_desc' | 'purity_desc' | 'quantity_desc' | 'newest';
}

export interface CreateListingDTO {
  title: string;
  description?: string;
  quantityAvailableKg: number; // Stored strictly in KG
  minOrderKg?: number;
  purityPercentage: number;
  captureMethod?: string;
  stateOfMatter?: string;
  pressureBar?: number | null;
  temperatureC?: number | null;
  pricePerKg: number; // In INR ₹/kg
  isSplitAllowed?: boolean;
  transactionMode?: TransactionMode;
  expiryDate?: Date | string | null;
}

export class MarketplaceService {
  /**
   * Get filtered and sorted CO2 listings
   */
  static async getListings(params: ListingFilterParams = {}) {
    const {
      search,
      status = ListingStatus.ACTIVE,
      stateOfMatter,
      minPurity,
      maxPurity,
      minPrice,
      maxPrice,
      minQuantityKg,
      verifiedOnly,
      industry,
      transactionMode,
      supplierCompanyId,
      sortBy = 'newest',
    } = params;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (supplierCompanyId) {
      where.supplierCompanyId = supplierCompanyId;
    }

    if (stateOfMatter && stateOfMatter !== 'ALL') {
      where.stateOfMatter = stateOfMatter;
    }

    if (transactionMode) {
      where.transactionMode = transactionMode;
    }

    if (minPurity !== undefined) {
      where.purityPercentage = { ...where.purityPercentage, gte: Number(minPurity) };
    }

    if (maxPurity !== undefined) {
      where.purityPercentage = { ...where.purityPercentage, lte: Number(maxPurity) };
    }

    if (minPrice !== undefined) {
      where.pricePerKg = { ...where.pricePerKg, gte: Number(minPrice) };
    }

    if (maxPrice !== undefined) {
      where.pricePerKg = { ...where.pricePerKg, lte: Number(maxPrice) };
    }

    if (minQuantityKg !== undefined) {
      where.quantityAvailableKg = { ...where.quantityAvailableKg, gte: Number(minQuantityKg) };
    }

    // Company relations filtering
    if (verifiedOnly || industry) {
      where.supplierCompany = {};
      if (verifiedOnly) {
        where.supplierCompany.isVerified = true;
      }
      if (industry && industry !== 'ALL') {
        where.supplierCompany.industry = { contains: industry, mode: 'insensitive' };
      }
    }

    // Search query across title, description, company name, city
    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { captureMethod: { contains: q, mode: 'insensitive' } },
        { supplierCompany: { name: { contains: q, mode: 'insensitive' } } },
        { supplierCompany: { city: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Sort order
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'price_asc':
        orderBy = { pricePerKg: 'asc' };
        break;
      case 'price_desc':
        orderBy = { pricePerKg: 'desc' };
        break;
      case 'purity_desc':
        orderBy = { purityPercentage: 'desc' };
        break;
      case 'quantity_desc':
        orderBy = { quantityAvailableKg: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const listings = await prisma.cO2Listing.findMany({
      where,
      include: {
        supplierCompany: {
          select: {
            id: true,
            name: true,
            industry: true,
            city: true,
            state: true,
            isVerified: true,
            trustScore: true,
            latitude: true,
            longitude: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
        quoteRequests: {
          select: {
            id: true,
            status: true,
            deadline: true,
            allocationPolicy: true,
            _count: { select: { quotes: true } },
          },
        },
        _count: {
          select: { matches: true, orders: true },
        },
      },
      orderBy,
    });

    return listings;
  }

  /**
   * Get single listing with comprehensive relations
   */
  static async getListingById(id: string) {
    const listing = await prisma.cO2Listing.findUnique({
      where: { id },
      include: {
        supplierCompany: true,
        quoteRequests: {
          include: {
            quotes: {
              include: {
                buyerCompany: {
                  select: { id: true, name: true, city: true, isVerified: true, trustScore: true },
                },
              },
            },
            allocations: true,
          },
        },
        matches: {
          include: {
            requirement: {
              include: {
                buyerCompany: {
                  select: { id: true, name: true, city: true, isVerified: true, trustScore: true },
                },
              },
            },
          },
        },
      },
    });

    return listing;
  }

  /**
   * Create new listing
   */
  static async createListing(data: CreateListingDTO, supplierCompanyId: string, userId: string) {
    // Input validation & strict normalization to KG
    const quantityKg = Number(data.quantityAvailableKg);
    const minOrder = data.minOrderKg ? Number(data.minOrderKg) : Math.min(1000, quantityKg);
    const purity = Number(data.purityPercentage);
    const price = Number(data.pricePerKg);

    if (quantityKg <= 0) {
      throw new Error('Quantity must be greater than 0 kg');
    }
    if (purity <= 0 || purity > 100) {
      throw new Error('Purity must be between 0.1% and 100%');
    }
    if (price <= 0) {
      throw new Error('Price per kg must be greater than 0');
    }
    if (minOrder > quantityKg) {
      throw new Error('Minimum order quantity cannot exceed total available quantity');
    }

    const listing = await prisma.cO2Listing.create({
      data: {
        supplierCompanyId,
        title: data.title,
        description: data.description || null,
        quantityAvailableKg: quantityKg,
        minOrderKg: minOrder,
        purityPercentage: purity,
        captureMethod: data.captureMethod || 'Industrial Post-Capture',
        stateOfMatter: data.stateOfMatter || 'Liquid',
        pressureBar: data.pressureBar !== undefined && data.pressureBar !== null ? Number(data.pressureBar) : null,
        temperatureC: data.temperatureC !== undefined && data.temperatureC !== null ? Number(data.temperatureC) : null,
        pricePerKg: price,
        isSplitAllowed: data.isSplitAllowed ?? true,
        transactionMode: data.transactionMode || TransactionMode.FIXED_PRICE,
        status: ListingStatus.ACTIVE,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      },
      include: {
        supplierCompany: true,
      },
    });

    // Write audit log
    await createAuditLog({
      userId,
      action: 'LISTING_CREATED',
      entityType: 'CO2Listing',
      entityId: listing.id,
      details: {
        title: listing.title,
        quantityKg: listing.quantityAvailableKg,
        pricePerKg: listing.pricePerKg,
        mode: listing.transactionMode,
      },
    });

    // Real-time broadcast
    broadcastEvent(SOCKET_EVENTS.LISTING_CREATED, listing);
    broadcastEvent(SOCKET_EVENTS.LISTING_OPENED, listing);

    return listing;
  }

  /**
   * Update listing details
   */
  static async updateListing(id: string, data: Partial<CreateListingDTO>, supplierCompanyId: string, userId: string, isAdmin = false) {
    const existing = await prisma.cO2Listing.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('CO2 Listing not found');
    }

    if (!isAdmin && existing.supplierCompanyId !== supplierCompanyId) {
      throw new Error('Forbidden: You do not own this listing');
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.quantityAvailableKg !== undefined) updateData.quantityAvailableKg = Number(data.quantityAvailableKg);
    if (data.minOrderKg !== undefined) updateData.minOrderKg = Number(data.minOrderKg);
    if (data.purityPercentage !== undefined) updateData.purityPercentage = Number(data.purityPercentage);
    if (data.captureMethod !== undefined) updateData.captureMethod = data.captureMethod;
    if (data.stateOfMatter !== undefined) updateData.stateOfMatter = data.stateOfMatter;
    if (data.pressureBar !== undefined) updateData.pressureBar = data.pressureBar !== null ? Number(data.pressureBar) : null;
    if (data.temperatureC !== undefined) updateData.temperatureC = data.temperatureC !== null ? Number(data.temperatureC) : null;
    if (data.pricePerKg !== undefined) updateData.pricePerKg = Number(data.pricePerKg);
    if (data.isSplitAllowed !== undefined) updateData.isSplitAllowed = Boolean(data.isSplitAllowed);
    if (data.transactionMode !== undefined) updateData.transactionMode = data.transactionMode;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

    const updated = await prisma.cO2Listing.update({
      where: { id },
      data: updateData,
      include: { supplierCompany: true },
    });

    await createAuditLog({
      userId,
      action: 'LISTING_UPDATED',
      entityType: 'CO2Listing',
      entityId: id,
      details: updateData,
    });

    broadcastEvent(SOCKET_EVENTS.LISTING_UPDATED, updated);
    return updated;
  }

  /**
   * Toggle status (e.g. ACTIVE <-> PAUSED or SOLD_OUT)
   */
  static async setListingStatus(id: string, status: ListingStatus, supplierCompanyId: string, userId: string, isAdmin = false) {
    const existing = await prisma.cO2Listing.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('CO2 Listing not found');
    }

    if (!isAdmin && existing.supplierCompanyId !== supplierCompanyId) {
      throw new Error('Forbidden: You do not own this listing');
    }

    const updated = await prisma.cO2Listing.update({
      where: { id },
      data: { status },
      include: { supplierCompany: true },
    });

    await createAuditLog({
      userId,
      action: 'LISTING_STATUS_CHANGED',
      entityType: 'CO2Listing',
      entityId: id,
      details: { previousStatus: existing.status, newStatus: status },
    });

    broadcastEvent(SOCKET_EVENTS.LISTING_UPDATED, updated);
    if (status === ListingStatus.ACTIVE) {
      broadcastEvent(SOCKET_EVENTS.LISTING_OPENED, updated);
    } else if (status === ListingStatus.PAUSED || status === ListingStatus.SOLD_OUT || status === ListingStatus.EXPIRED) {
      broadcastEvent(SOCKET_EVENTS.LISTING_CLOSED, { id, status });
    }

    return updated;
  }

  /**
   * Delete listing
   */
  static async deleteListing(id: string, supplierCompanyId: string, userId: string, isAdmin = false) {
    const existing = await prisma.cO2Listing.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('CO2 Listing not found');
    }

    if (!isAdmin && existing.supplierCompanyId !== supplierCompanyId) {
      throw new Error('Forbidden: You do not own this listing');
    }

    await prisma.cO2Listing.delete({ where: { id } });

    await createAuditLog({
      userId,
      action: 'LISTING_DELETED',
      entityType: 'CO2Listing',
      entityId: id,
      details: { title: existing.title },
    });

    broadcastEvent(SOCKET_EVENTS.LISTING_CLOSED, { id, status: 'DELETED' });
    return { success: true, id };
  }
}
