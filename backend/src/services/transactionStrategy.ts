import { AllocationPolicy, Quote, QuoteRequest, CO2Listing, Company, Prisma } from '@prisma/client';
import { MatchingService } from './matchingService';

export interface WinnerAllocation {
  quoteId: string;
  buyerCompanyId: string;
  buyerCompany: Company;
  offeredPricePerKg: number;
  requestedQuantityKg: number;
  allocatedQuantityKg: number;
  isPartial: boolean;
  score: number;
}

export interface ITransactionStrategy {
  validateRequest(
    rfq: QuoteRequest & { listing: CO2Listing },
    buyerCompanyId: string,
    quantityKg: number,
    pricePerKg: number
  ): Promise<{ isValid: boolean; error?: string }>;

  rankOffers(
    policy: AllocationPolicy,
    quotes: (Quote & { buyerCompany: Company })[],
    listing: CO2Listing & { supplierCompany: Company }
  ): WinnerAllocation[];

  selectWinners(
    rankedOffers: WinnerAllocation[],
    totalAvailableKg: number,
    isSplitAllowed: boolean
  ): { winners: WinnerAllocation[]; unallocatedKg: number };
}

export class TransactionStrategy implements ITransactionStrategy {
  /**
   * Server-side validation of quote submission
   */
  async validateRequest(
    rfq: QuoteRequest & { listing: CO2Listing },
    buyerCompanyId: string,
    quantityKg: number,
    pricePerKg: number
  ): Promise<{ isValid: boolean; error?: string }> {
    // 1. RFQ status check
    if (rfq.status !== 'OPEN') {
      return { isValid: false, error: `RFQ is no longer accepting quotes (status: ${rfq.status})` };
    }

    // 2. Listing status check
    if (rfq.listing.status !== 'ACTIVE') {
      return { isValid: false, error: `Underlying CO2 stream is not active (status: ${rfq.listing.status})` };
    }

    // 3. Deadline check
    if (new Date() > new Date(rfq.deadline)) {
      return { isValid: false, error: 'RFQ bidding deadline has expired' };
    }

    // 4. Quantity validations
    if (quantityKg <= 0) {
      return { isValid: false, error: 'Offered quantity must be greater than 0 kg' };
    }

    if (quantityKg < (rfq.listing.minOrderKg || 1000)) {
      return {
        isValid: false,
        error: `Offered quantity (${quantityKg} kg) is below minimum order size (${rfq.listing.minOrderKg || 1000} kg)`,
      };
    }

    if (quantityKg > rfq.listing.quantityAvailableKg) {
      return {
        isValid: false,
        error: `Offered quantity exceeds available stream inventory (${rfq.listing.quantityAvailableKg} kg)`,
      };
    }

    // 5. Price validation
    if (pricePerKg <= 0) {
      return { isValid: false, error: 'Offered price must be greater than ₹0' };
    }

    // 6. Prevent self-bidding
    if (rfq.listing.supplierCompanyId === buyerCompanyId) {
      return { isValid: false, error: 'Supplier company cannot submit quotes on its own listing' };
    }

    return { isValid: true };
  }

  /**
   * Rank buyer offers according to the configured Allocation Policy
   */
  rankOffers(
    policy: AllocationPolicy,
    quotes: (Quote & { buyerCompany: Company })[],
    listing: CO2Listing & { supplierCompany: Company }
  ): WinnerAllocation[] {
    const listPrice = listing.pricePerKg;

    const evaluated: WinnerAllocation[] = quotes.map((q) => {
      let score = 0;

      if (policy === 'FCFS') {
        // Earlier timestamp gets higher priority
        const timeScore = 10000000000000 - new Date(q.createdAt).getTime();
        score = timeScore;
      } else if (policy === 'HIGHEST_PRICE') {
        // Highest offered price per kg gets highest rank
        score = q.offeredPricePerKg * 1000 + (q.offeredQuantityKg / 1000);
      } else {
        // BEST_VALUE Score: 40% Price + 25% Quantity Coverage + 20% Logistics Proximity + 15% Trust Score
        const priceFit = Math.min(100, Math.max(10, (q.offeredPricePerKg / listPrice) * 100));
        const qtyFit = Math.min(100, (q.offeredQuantityKg / listing.quantityAvailableKg) * 100);

        const dist = MatchingService.calculateDistanceKm(
          listing.supplierCompany.latitude,
          listing.supplierCompany.longitude,
          q.buyerCompany.latitude,
          q.buyerCompany.longitude,
          listing.supplierCompany.city,
          q.buyerCompany.city
        );
        const distFit = Math.max(10, Math.min(100, 100 - dist * 0.1));
        const trustFit = q.buyerCompany.trustScore || 85.0;

        score = Number(
          (priceFit * 0.4 + qtyFit * 0.25 + distFit * 0.2 + trustFit * 0.15).toFixed(2)
        );
      }

      return {
        quoteId: q.id,
        buyerCompanyId: q.buyerCompanyId,
        buyerCompany: q.buyerCompany,
        offeredPricePerKg: q.offeredPricePerKg,
        requestedQuantityKg: q.offeredQuantityKg,
        allocatedQuantityKg: 0,
        isPartial: false,
        score,
      };
    });

    // Sort descending by score
    evaluated.sort((a, b) => b.score - a.score);
    return evaluated;
  }

  /**
   * Select winning buyers and resolve allocations (Single vs Multi-Buyer Split)
   */
  selectWinners(
    rankedOffers: WinnerAllocation[],
    totalAvailableKg: number,
    isSplitAllowed: boolean
  ): { winners: WinnerAllocation[]; unallocatedKg: number } {
    let remainingSupply = totalAvailableKg;
    const winners: WinnerAllocation[] = [];

    if (!isSplitAllowed) {
      // Single buyer mode: Allocate only to the top eligible buyer
      if (rankedOffers.length > 0) {
        const top = { ...rankedOffers[0] };
        const allocated = Math.min(top.requestedQuantityKg, remainingSupply);
        top.allocatedQuantityKg = allocated;
        top.isPartial = allocated < top.requestedQuantityKg;
        winners.push(top);
        remainingSupply -= allocated;
      }
      return { winners, unallocatedKg: remainingSupply };
    }

    // Multi-buyer split allowed: Greedily allocate according to rank
    for (const offer of rankedOffers) {
      if (remainingSupply <= 0) break;

      const toAllocate = Math.min(offer.requestedQuantityKg, remainingSupply);
      if (toAllocate > 0) {
        const allocatedOffer = {
          ...offer,
          allocatedQuantityKg: toAllocate,
          isPartial: toAllocate < offer.requestedQuantityKg,
        };
        winners.push(allocatedOffer);
        remainingSupply -= toAllocate;
      }
    }

    return { winners, unallocatedKg: remainingSupply };
  }
}

export const defaultTransactionStrategy = new TransactionStrategy();
