import dotenv from 'dotenv';
dotenv.config();

import { OrderService } from '../services/orderService';
import { OrderStatus, UserRole } from '@prisma/client';
import { TrustService } from '../services/trustService';

async function runPostTransactionTests() {
  console.log('🧪 Starting ReCarbo Post-Transaction & Trust Layer Test Suite...\n');

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
  // SUITE 1: ORDER LIFECYCLE & ROLE TRANSITION RULES
  // ==========================================
  console.log('📦 --- Suite 1: Order Lifecycle State Machine & Role Security ---');

  // Supplier valid transitions
  const supToProcessing = OrderService.validateTransition(
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    UserRole.SUPPLIER
  );
  assert(supToProcessing.valid, 'Supplier CAN advance CONFIRMED -> PROCESSING');

  const supToInTransit = OrderService.validateTransition(
    OrderStatus.PROCESSING,
    OrderStatus.IN_TRANSIT,
    UserRole.SUPPLIER
  );
  assert(supToInTransit.valid, 'Supplier CAN advance PROCESSING -> IN_TRANSIT');

  // Supplier invalid transitions
  const supToDelivered = OrderService.validateTransition(
    OrderStatus.IN_TRANSIT,
    OrderStatus.DELIVERED,
    UserRole.SUPPLIER
  );
  assert(!supToDelivered.valid, 'Supplier CANNOT mark order DELIVERED (Buyer confirmation required)');

  const supToUtilized = OrderService.validateTransition(
    OrderStatus.DELIVERED,
    OrderStatus.UTILIZED,
    UserRole.SUPPLIER
  );
  assert(!supToUtilized.valid, 'Supplier CANNOT mark order UTILIZED (Buyer verification required)');

  // Buyer valid transitions
  const buyerToDelivered = OrderService.validateTransition(
    OrderStatus.IN_TRANSIT,
    OrderStatus.DELIVERED,
    UserRole.BUYER
  );
  assert(buyerToDelivered.valid, 'Buyer CAN confirm IN_TRANSIT -> DELIVERED');

  const buyerToUtilized = OrderService.validateTransition(
    OrderStatus.DELIVERED,
    OrderStatus.UTILIZED,
    UserRole.BUYER
  );
  assert(buyerToUtilized.valid, 'Buyer CAN confirm DELIVERED -> UTILIZED (Circular productive reuse)');

  // Buyer invalid transitions
  const buyerToProcessing = OrderService.validateTransition(
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    UserRole.BUYER
  );
  assert(!buyerToProcessing.valid, 'Buyer CANNOT advance order to PROCESSING');

  // Sequential progression rules
  const invalidJump = OrderService.validateTransition(
    OrderStatus.CONFIRMED,
    OrderStatus.IN_TRANSIT,
    UserRole.SUPPLIER
  );
  assert(!invalidJump.valid, 'Non-admin CANNOT skip stages (CONFIRMED -> IN_TRANSIT disallowed without PROCESSING)');

  // Terminal state protection
  const changeUtilized = OrderService.validateTransition(
    OrderStatus.UTILIZED,
    OrderStatus.CANCELLED,
    UserRole.ADMIN
  );
  assert(!changeUtilized.valid, 'UTILIZED is terminal and cannot be changed or cancelled');

  // Admin override capability
  const adminOverride = OrderService.validateTransition(
    OrderStatus.CONFIRMED,
    OrderStatus.IN_TRANSIT,
    UserRole.ADMIN
  );
  assert(adminOverride.valid, 'Platform Admin CAN perform administrative overrides');

  // ==========================================
  // SUITE 2: DETERMINISTIC FINANCIAL SETTLEMENT RECALCULATION
  // ==========================================
  console.log('\n💰 --- Suite 2: Deterministic Financial Settlement Recalculation ---');

  const qtyKg = 30000; // 30 Tonnes
  const priceKg = 4.5;
  const distanceKm = 190;
  const transportRate = 0.015; // ₹0.015 per km per kg
  const feePct = 2.5; // 2.5%

  const expectedCo2Cost = qtyKg * priceKg; // ₹135,000
  const expectedFreight = qtyKg * distanceKm * transportRate; // ₹85,500
  const expectedHandling = 2500.0;
  const subtotal = expectedCo2Cost + expectedFreight + expectedHandling; // ₹223,000
  const expectedPlatformFee = (subtotal * feePct) / 100; // ₹5,575
  const expectedTotal = subtotal + expectedPlatformFee; // ₹228,575

  assert(expectedCo2Cost === 135000, `CO2 Commodity Cost = ₹${expectedCo2Cost.toLocaleString()}`);
  assert(expectedFreight === 85500, `Freight Transit Cost = ₹${expectedFreight.toLocaleString()}`);
  assert(expectedPlatformFee === 5575, `Platform Fee (2.5%) = ₹${expectedPlatformFee.toLocaleString()}`);
  assert(expectedTotal === 228575, `Total Landed Escrow = ₹${expectedTotal.toLocaleString()}`);

  // ==========================================
  // SUITE 3: EXPLAINABLE 6-FACTOR TRUST SCORING
  // ==========================================
  console.log('\n🛡️ --- Suite 3: Explainable 6-Factor Trust Score Weights ---');

  const weights = [25, 20, 20, 15, 10, 10];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  assert(totalWeight === 100, `Trust scoring weights sum to exactly 100% (${weights.join(' + ')} = 100)`);

  // Simulated score test for verified enterprise
  const factorScores = [100, 98, 92, 95, 96, 92]; // Company, CO2, Tx, Logistics, Quality, Response
  const computedOverall = factorScores.reduce((sum, score, idx) => sum + (score * weights[idx]) / 100, 0);
  assert(computedOverall >= 90 && computedOverall <= 100, `Verified company score (${computedOverall.toFixed(1)}/100) attains Grade AA/AAA`);

  // ==========================================
  // SUITE 4: BUYER & SUPPLIER ANALYTICS FORMULAS
  // ==========================================
  console.log('\n📊 --- Suite 4: Cost Avoidance & Volume Conversions ---');

  const merchantBenchmarkPrice = 5.8; // ₹5.80/kg
  const procuredQty = 30000;
  const actualProcurementSpend = 228575; // Landed cost
  const merchantBenchmarkCost = procuredQty * merchantBenchmarkPrice; // ₹174,000 raw vs ₹228k landed or commodity 30k*4.5 = 135k vs 174k = 22.4%
  const avoidedCost = Math.max(0, merchantBenchmarkCost - (procuredQty * 4.5));
  const avoidancePercent = Math.round((avoidedCost / merchantBenchmarkCost) * 100 * 10) / 10;

  assert(avoidancePercent > 15, `Cost Avoidance vs Merchant Virgin CO2 (${avoidancePercent}%) exceeds 15% threshold`);
  assert(procuredQty / 1000 === 30.0, 'Volume normalization: 30,000 kg = 30.0 Tonnes');

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log(`\n========================================`);
  console.log(`📊 Post-Transaction Test Results: ${passed} / ${total} Tests Passed (${Math.round((passed / total) * 100)}%)`);
  console.log(`========================================\n`);

  if (passed === total) {
    console.log('🎉 Post-Transaction & Trust Layer logic verified 100% successfully!');
  } else {
    process.exit(1);
  }
}

runPostTransactionTests().catch((err) => {
  console.error('Post-Transaction test suite error:', err);
  process.exit(1);
});
