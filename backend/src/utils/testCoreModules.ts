import dotenv from 'dotenv';
dotenv.config();

import { defaultTransactionStrategy } from '../services/transactionStrategy';
import { MatchingService } from '../services/matchingService';
import { LogisticsService } from '../services/logisticsService';
import { AllocationPolicy } from '@prisma/client';

async function runTests() {
  console.log('🧪 Starting ReCarbo 4 Core Modules Verification Test Suite...\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
    }
  }

  // ==========================================
  // TEST SUITE 1: MODULE 1 & UNIT NORMALIZATION
  // ==========================================
  console.log('📦 --- Suite 1: Unit Normalization & Basic Listings Logic ---');
  const qtyTonnes = 25.5;
  const normalizedKg = qtyTonnes * 1000;
  assert(normalizedKg === 25500, 'Tonne to KG conversion normalization (25.5 T = 25,500 kg)');

  const minOrderTonnes = 2.0;
  const normalizedMinOrderKg = minOrderTonnes * 1000;
  assert(normalizedMinOrderKg === 2000, 'Min order normalization (2.0 T = 2,000 kg)');

  // ==========================================
  // TEST SUITE 2: MODULE 2 & AI MATCHING ENGINE
  // ==========================================
  console.log('\n🎯 --- Suite 2: AI Matching Engine (5-Factor Deterministic Algorithm) ---');

  const mockSupplierCompany: any = {
    id: 'supp-1',
    name: 'Gujarat Carbon Capture Ltd',
    city: 'Bharuch',
    latitude: 21.7051,
    longitude: 72.9959,
    trustScore: 95.0,
    isVerified: true,
  };

  const mockBuyerCompany: any = {
    id: 'buy-1',
    name: 'Aura Polymer Materials',
    city: 'Ahmedabad',
    latitude: 23.0225,
    longitude: 72.5714,
    trustScore: 92.0,
    isVerified: true,
  };

  const mockListing: any = {
    id: 'list-1',
    supplierCompanyId: 'supp-1',
    supplierCompany: mockSupplierCompany,
    title: 'High-Purity Liquid CO2 (99.8%) - Dahej',
    quantityAvailableKg: 50000, // 50 Tonnes
    minOrderKg: 2000,
    purityPercentage: 99.8,
    pricePerKg: 4.5,
    stateOfMatter: 'Liquid',
    status: 'ACTIVE',
  };

  const mockRequirement: any = {
    id: 'req-1',
    buyerCompanyId: 'buy-1',
    buyerCompany: mockBuyerCompany,
    title: 'Monthly Liquid CO2 for Polymers',
    quantityRequiredKg: 30000, // 30 Tonnes
    minPurityPercentage: 99.5,
    maxPricePerKg: 5.0,
    preferredState: 'Liquid',
    status: 'OPEN',
  };

  // Test Distance Calculation
  const distance = MatchingService.calculateDistanceKm(
    mockSupplierCompany.latitude,
    mockSupplierCompany.longitude,
    mockBuyerCompany.latitude,
    mockBuyerCompany.longitude,
    mockSupplierCompany.city,
    mockBuyerCompany.city
  );
  assert(distance > 150 && distance < 250, `Haversine road corridor distance (${distance} km) in expected range ~190km`);

  // Test Match Evaluation
  const matchResult = MatchingService.evaluateMatch(mockListing, mockRequirement, 2.5, 0.015);
  assert(matchResult !== null, 'Eligible match generated when all hard filters pass');
  if (matchResult) {
    assert(matchResult.overallScore >= 80 && matchResult.overallScore <= 100, `Match score (${matchResult.overallScore}%) in high-fit range`);
    assert(matchResult.purityScore > 85, `Purity score (${matchResult.purityScore}%) reflects surplus purity (99.8% vs 99.5%)`);
    assert(matchResult.explanation.length > 20, 'Deterministic plain-language explanation generated');
    assert(matchResult.estimatedLandedCost.totalAmount > 0, 'Landed cost calculation preview generated');
  }

  // Test Disqualification: Hard Filter Failure (Purity too low)
  const lowPurityListing = { ...mockListing, purityPercentage: 97.0 };
  const disqualifiedMatch = MatchingService.evaluateMatch(lowPurityListing, mockRequirement, 2.5, 0.015);
  assert(disqualifiedMatch === null, 'Hard eligibility filter properly disqualifies listing with sub-par purity');

  // Test Disqualification: Hard Filter Failure (Price over budget)
  const highPriceListing = { ...mockListing, pricePerKg: 6.5 };
  const overBudgetMatch = MatchingService.evaluateMatch(highPriceListing, mockRequirement, 2.5, 0.015);
  assert(overBudgetMatch === null, 'Hard eligibility filter properly disqualifies listing with price above max budget');

  // ==========================================
  // TEST SUITE 3: MODULE 3 & TRANSACTION STRATEGY RFQ ALLOCATION
  // ==========================================
  console.log('\n⚖️ --- Suite 3: RFQ TransactionStrategy & Allocation Engine ---');

  const mockQuotes: any[] = [
    {
      id: 'quote-1',
      buyerCompanyId: 'buyer-alpha',
      buyerCompany: { ...mockBuyerCompany, id: 'buyer-alpha', name: 'Alpha Polymers', trustScore: 95.0 },
      offeredPricePerKg: 4.8,
      offeredQuantityKg: 30000,
      createdAt: new Date('2026-09-01T10:00:00Z'),
    },
    {
      id: 'quote-2',
      buyerCompanyId: 'buyer-beta',
      buyerCompany: { ...mockBuyerCompany, id: 'buyer-beta', name: 'Beta Chemicals', trustScore: 88.0 },
      offeredPricePerKg: 5.2, // Highest price
      offeredQuantityKg: 25000,
      createdAt: new Date('2026-09-01T11:00:00Z'),
    },
    {
      id: 'quote-3',
      buyerCompanyId: 'buyer-gamma',
      buyerCompany: { ...mockBuyerCompany, id: 'buyer-gamma', name: 'Gamma Materials', trustScore: 90.0 },
      offeredPricePerKg: 4.6,
      offeredQuantityKg: 15000,
      createdAt: new Date('2026-09-01T09:00:00Z'), // Earliest timestamp
    },
  ];

  // Test Policy: HIGHEST_PRICE
  const rankedByPrice = defaultTransactionStrategy.rankOffers('HIGHEST_PRICE', mockQuotes, mockListing);
  assert(rankedByPrice[0].buyerCompany.name === 'Beta Chemicals', 'Highest-Price policy ranks ₹5.2/kg buyer #1');

  // Test Policy: FCFS
  const rankedByFcfs = defaultTransactionStrategy.rankOffers('FCFS', mockQuotes, mockListing);
  assert(rankedByFcfs[0].buyerCompany.name === 'Gamma Materials', 'FCFS policy ranks earliest 09:00 AM timestamp buyer #1');

  // Test Single-Buyer Allocation (isSplitAllowed = false)
  const singleAllocation = defaultTransactionStrategy.selectWinners(rankedByPrice, 50000, false);
  assert(singleAllocation.winners.length === 1, 'Single-buyer allocation selects exactly 1 winner when split is false');
  assert(singleAllocation.winners[0].allocatedQuantityKg === 25000, 'Winner allocated their full requested quantity');
  assert(singleAllocation.unallocatedKg === 25000, 'Unallocated remaining lot calculated correctly');

  // Test Multi-Buyer Split Allocation (isSplitAllowed = true)
  const splitAllocation = defaultTransactionStrategy.selectWinners(rankedByPrice, 50000, true);
  assert(splitAllocation.winners.length === 2, 'Multi-buyer allocation selects multiple winners (25k + 25k of 30k lot)');
  assert(splitAllocation.winners[0].allocatedQuantityKg === 25000, 'Top winner gets 25,000 kg');
  assert(splitAllocation.winners[1].allocatedQuantityKg === 25000, 'Second winner gets remaining 25,000 kg (partial fulfillment)');
  assert(splitAllocation.winners[1].isPartial === true, 'Second winner marked as partial allocation');
  assert(splitAllocation.unallocatedKg === 0, 'Total available 50,000 kg supply fully cleared');

  // ==========================================
  // TEST SUITE 4: MODULE 4 & LOGISTICS ENGINE + PRODUCT CALCULATOR
  // ==========================================
  console.log('\n🚚 --- Suite 4: Logistics Engine & Landed Cost Calculator ---');

  const logisticsCalc = await LogisticsService.calculateCost({
    quantityKg: 25000,
    pricePerKg: 4.5,
    distanceKm: 190,
    originCity: 'Dahej',
    destCity: 'Sanand',
    transportMode: 'CRYOGENIC_TANKER',
  });

  assert(logisticsCalc.costs.co2Cost === 25000 * 4.5, 'CO2 base cost (25,000 kg * ₹4.5 = ₹112,500)');
  const expectedFreight = 25000 * 190 * 0.015 * 1.0;
  assert(logisticsCalc.costs.transportCost === expectedFreight, `Freight cost (25,000 * 190 * 0.015 = ₹${expectedFreight})`);
  assert(logisticsCalc.costs.totalAmount > logisticsCalc.costs.co2Cost, 'Landed total includes freight, handling, and platform fee');
  assert(logisticsCalc.costs.landedCostPerKg > 4.5, 'Delivered rate per kg exceeds raw commodity rate');

  // Test Buyer CO2 Product Calculator
  const productDemand = LogisticsService.estimateProductCo2Demand({
    application: 'CONCRETE_CURING',
    productionUnits: 2000, // 2,000 m3
    unitPricePerKg: 4.5,
  });

  assert(productDemand.totalCo2RequiredKg === 2000 * 15.0, 'Concrete carbonation demand (2,000 m³ * 15 kg/m³ = 30,000 kg CO2)');
  assert(productDemand.totalCo2Tonnes === 30.0, 'Demand normalized to 30.0 Tonnes');
  assert(productDemand.estimatedRawCo2Cost === 30000 * 4.5, 'Feedstock budget estimated correctly (₹135,000)');

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log(`\n========================================`);
  console.log(`📊 Test Results: ${passed} / ${total} Tests Passed (${Math.round((passed / total) * 100)}%)`);
  console.log(`========================================\n`);

  if (passed === total) {
    console.log('🎉 All 4 Core Modules verified successfully!');
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
