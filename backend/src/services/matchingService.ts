import { prisma } from '../utils/prisma';
import { CO2Listing, CO2Requirement, Company } from '@prisma/client';
import { SettingsService } from './settingsService';

export interface MatchingResult {
  listingId: string;
  requirementId: string;
  overallScore: number;
  quantityScore: number;
  purityScore: number;
  distanceScore: number;
  priceScore: number;
  availabilityScore: number;
  explanation: string;
  isEligible: boolean;
  distanceKm: number;
  estimatedLandedCost: {
    co2Cost: number;
    transportCost: number;
    handlingCost: number;
    platformFee: number;
    totalAmount: number;
    costPerKg: number;
  };
  listing: any;
  requirement?: any;
}

// Coordinate lookup for Gujarat/India industrial clusters
const KNOWN_COORDINATES: Record<string, { lat: number; lng: number }> = {
  bharuch: { lat: 21.7051, lng: 72.9959 },
  dahej: { lat: 21.7051, lng: 72.9959 },
  surat: { lat: 21.1702, lng: 72.8311 },
  hazira: { lat: 21.1702, lng: 72.8311 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  sanand: { lat: 23.0225, lng: 72.5714 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  nandesari: { lat: 22.3072, lng: 73.1812 },
  jamnagar: { lat: 22.4707, lng: 70.0577 },
  mundra: { lat: 22.8395, lng: 69.7259 },
  ankleshwar: { lat: 21.6264, lng: 73.0035 },
  vapi: { lat: 20.3714, lng: 72.9106 },
  gandhidham: { lat: 23.0753, lng: 70.1337 },
};

export class MatchingService {
  /**
   * Calculate distance between two coordinate pairs using Haversine formula
   */
  static calculateDistanceKm(
    lat1: number | null | undefined,
    lon1: number | null | undefined,
    lat2: number | null | undefined,
    lon2: number | null | undefined,
    city1?: string | null,
    city2?: string | null
  ): number {
    let p1 = { lat: lat1, lng: lon1 };
    let p2 = { lat: lat2, lng: lon2 };

    if ((!p1.lat || !p1.lng) && city1) {
      const c1 = city1.toLowerCase().trim();
      p1 = KNOWN_COORDINATES[c1] || { lat: 21.7051, lng: 72.9959 };
    }
    if ((!p2.lat || !p2.lng) && city2) {
      const c2 = city2.toLowerCase().trim();
      p2 = KNOWN_COORDINATES[c2] || { lat: 23.0225, lng: 72.5714 };
    }

    const cLat1 = p1.lat ?? 21.7051;
    const cLng1 = p1.lng ?? 72.9959;
    const cLat2 = p2.lat ?? 23.0225;
    const cLng2 = p2.lng ?? 72.5714;

    const R = 6371; // Earth radius in km
    const dLat = ((cLat2 - cLat1) * Math.PI) / 180;
    const dLon = ((cLng2 - cLng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((cLat1 * Math.PI) / 180) *
        Math.cos((cLat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Road transit factor (+18% for real-world road networks over straight lines)
    return Math.round(distance * 1.18);
  }

  /**
   * Deterministic matching algorithm between a single listing and a requirement
   */
  static evaluateMatch(
    listing: CO2Listing & { supplierCompany: Company },
    requirement: CO2Requirement & { buyerCompany: Company },
    platformFeePct = 2.5,
    transportRatePerKmKg = 0.015
  ): MatchingResult | null {
    // 1. HARD ELIGIBILITY FILTERS (Must all pass)
    // Filter A: Purity fit
    if (listing.purityPercentage < requirement.minPurityPercentage) {
      return null;
    }

    // Filter B: Price budget check
    if (requirement.maxPricePerKg && listing.pricePerKg > requirement.maxPricePerKg) {
      return null;
    }

    // Filter C: Physical State Compatibility (if strict)
    if (
      requirement.preferredState &&
      requirement.preferredState !== 'ANY' &&
      listing.stateOfMatter &&
      listing.stateOfMatter !== requirement.preferredState
    ) {
      // Solid cannot easily substitute Liquid without sublimation equipment
      if (
        (listing.stateOfMatter === 'Solid' && requirement.preferredState === 'Compressed Gas') ||
        (listing.stateOfMatter === 'Compressed Gas' && requirement.preferredState === 'Solid')
      ) {
        return null;
      }
    }

    // Filter D: Minimum supply lot availability
    if (listing.quantityAvailableKg < 500) {
      return null;
    }

    // Distance Calculation
    const distanceKm = this.calculateDistanceKm(
      listing.supplierCompany.latitude,
      listing.supplierCompany.longitude,
      requirement.buyerCompany.latitude,
      requirement.buyerCompany.longitude,
      listing.supplierCompany.city,
      requirement.buyerCompany.city
    );

    // 2. FIVE-FACTOR DETERMINISTIC SCORING (0-100 each)
    // Factor 1: Quantity Fit (30%)
    let quantityScore = 100;
    const reqQty = requirement.quantityRequiredKg;
    const availQty = listing.quantityAvailableKg;
    if (availQty >= reqQty) {
      // Supply comfortably satisfies entire demand
      const excessRatio = availQty / reqQty;
      quantityScore = excessRatio <= 2 ? 100 : Math.max(85, 100 - (excessRatio - 2) * 5);
    } else {
      // Supply covers partial demand (pro-rata match)
      const coverageRatio = availQty / reqQty;
      quantityScore = Math.max(30, Math.round(coverageRatio * 90));
    }

    // Factor 2: Purity Fit (25%)
    // Exceeding minimum requirement provides higher score
    const purityDiff = listing.purityPercentage - requirement.minPurityPercentage;
    const purityScore = Math.min(100, Math.round(85 + purityDiff * 15));

    // Factor 3: Distance / Logistics Proximity (20%)
    // 0-50 km = 100, 200 km = 80, 500 km = 50, 1000 km = 10
    const distanceScore = Math.max(10, Math.min(100, Math.round(100 - distanceKm * 0.1)));

    // Factor 4: Price Fit / Economic Savings (15%)
    let priceScore = 80;
    if (requirement.maxPricePerKg) {
      const savings = requirement.maxPricePerKg - listing.pricePerKg;
      const savingsRatio = savings / requirement.maxPricePerKg;
      priceScore = Math.min(100, Math.max(40, Math.round(70 + savingsRatio * 60)));
    } else {
      // Benchmark against ₹4.5/kg standard rate
      const marketDelta = 4.5 - listing.pricePerKg;
      priceScore = Math.min(100, Math.max(40, Math.round(75 + marketDelta * 10)));
    }

    // Factor 5: Availability & Trust Fit (10%)
    const trustScore = listing.supplierCompany.trustScore || 85.0;
    const availabilityScore = Math.min(100, Math.round(trustScore));

    // Weighted Overall Score (30% Qty + 25% Purity + 20% Dist + 15% Price + 10% Avail)
    const overallScore = Number(
      (
        quantityScore * 0.3 +
        purityScore * 0.25 +
        distanceScore * 0.2 +
        priceScore * 0.15 +
        availabilityScore * 0.1
      ).toFixed(1)
    );

    // Landed Cost Simulation
    const allocatedKg = Math.min(reqQty, availQty);
    const co2Cost = allocatedKg * listing.pricePerKg;
    const transportCost = allocatedKg * distanceKm * transportRatePerKmKg;
    const handlingCost = 2500; // Standard QA audit & cryogenic handling
    const subtotal = co2Cost + transportCost + handlingCost;
    const platformFee = (subtotal * platformFeePct) / 100;
    const totalAmount = subtotal + platformFee;
    const costPerKg = Number((totalAmount / allocatedKg).toFixed(2));

    // Deterministic Plain-Language Explanation
    const purityText = `${listing.purityPercentage}% purity (${purityDiff >= 0 ? `+${purityDiff.toFixed(1)}% above min ${requirement.minPurityPercentage}%` : 'meets requirements'})`;
    const distanceText = `${distanceKm} km transit (${listing.supplierCompany.city || 'Dahej'} → ${requirement.buyerCompany.city || 'Sanand'})`;
    const qtyText = availQty >= reqQty ? `covers 100% of ${ (reqQty / 1000).toFixed(1) }T demand` : `supplies ${(availQty / 1000).toFixed(1)}T (${Math.round((availQty / reqQty) * 100)}% partial lot)`;
    const priceText = `₹${listing.pricePerKg.toFixed(2)}/kg${requirement.maxPricePerKg ? ` (₹${(requirement.maxPricePerKg - listing.pricePerKg).toFixed(2)} below max budget)` : ''}`;

    const explanation = `Strong fit (${overallScore}% match): ${listing.supplierCompany.name} provides ${purityText}, ${qtyText} at ${priceText} across a ${distanceText} with verified ${trustScore.toFixed(0)}% trust rating.`;

    return {
      listingId: listing.id,
      requirementId: requirement.id,
      overallScore,
      quantityScore,
      purityScore,
      distanceScore,
      priceScore,
      availabilityScore,
      explanation,
      isEligible: true,
      distanceKm,
      estimatedLandedCost: {
        co2Cost,
        transportCost,
        handlingCost,
        platformFee,
        totalAmount,
        costPerKg,
      },
      listing,
      requirement,
    };
  }

  /**
   * Find and rank all eligible matches for a given requirement
   */
  static async findMatchesForRequirement(requirementId: string) {
    const requirement = await prisma.cO2Requirement.findUnique({
      where: { id: requirementId },
      include: { buyerCompany: true },
    });

    if (!requirement) {
      throw new Error('CO2 Requirement not found');
    }

    const listings = await prisma.cO2Listing.findMany({
      where: { status: 'ACTIVE' },
      include: { supplierCompany: true },
    });

    const activeSettings = await SettingsService.getActivePlatformFee();
    const feePct = activeSettings.feePercentage;
    const transRate = activeSettings.transportRatePerKmKg;

    const matches: MatchingResult[] = [];

    for (const listing of listings) {
      // Prevent company matching with itself
      if (listing.supplierCompanyId === requirement.buyerCompanyId) continue;

      const evaluated = this.evaluateMatch(listing, requirement, feePct, transRate);
      if (evaluated) {
        matches.push(evaluated);

        // Upsert into Match table for persistence
        await prisma.match.upsert({
          where: {
            listingId_requirementId: {
              listingId: listing.id,
              requirementId: requirement.id,
            },
          },
          update: {
            overallScore: evaluated.overallScore,
            quantityScore: evaluated.quantityScore,
            purityScore: evaluated.purityScore,
            distanceScore: evaluated.distanceScore,
            priceScore: evaluated.priceScore,
            availabilityScore: evaluated.availabilityScore,
            explanation: evaluated.explanation,
            status: 'ACTIVE',
          },
          create: {
            listingId: listing.id,
            requirementId: requirement.id,
            overallScore: evaluated.overallScore,
            quantityScore: evaluated.quantityScore,
            purityScore: evaluated.purityScore,
            distanceScore: evaluated.distanceScore,
            priceScore: evaluated.priceScore,
            availabilityScore: evaluated.availabilityScore,
            explanation: evaluated.explanation,
            status: 'ACTIVE',
          },
        });
      }
    }

    // Sort descending by overall match score
    matches.sort((a, b) => b.overallScore - a.overallScore);

    // Identify "Best Deal" (highest score with optimal landed cost)
    const bestDeal = matches.length > 0 ? matches[0] : null;

    return {
      requirement,
      totalMatches: matches.length,
      bestDeal,
      matches,
    };
  }

  /**
   * Find matching requirements for a given supplier listing
   */
  static async findMatchesForListing(listingId: string) {
    const listing = await prisma.cO2Listing.findUnique({
      where: { id: listingId },
      include: { supplierCompany: true },
    });

    if (!listing) {
      throw new Error('CO2 Listing not found');
    }

    const requirements = await prisma.cO2Requirement.findMany({
      where: { status: 'OPEN' },
      include: { buyerCompany: true },
    });

    const activeSettings = await SettingsService.getActivePlatformFee();
    const feePct = activeSettings.feePercentage;
    const transRate = activeSettings.transportRatePerKmKg;

    const matches: MatchingResult[] = [];

    for (const req of requirements) {
      if (req.buyerCompanyId === listing.supplierCompanyId) continue;

      const evaluated = this.evaluateMatch(listing, req, feePct, transRate);
      if (evaluated) {
        matches.push(evaluated);
      }
    }

    matches.sort((a, b) => b.overallScore - a.overallScore);
    return {
      listing,
      totalMatches: matches.length,
      matches,
    };
  }
}
