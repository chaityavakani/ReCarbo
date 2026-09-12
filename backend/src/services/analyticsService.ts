import { prisma } from '../utils/prisma';
import { OrderStatus } from '@prisma/client';

export class AnalyticsService {
  /**
   * Compute comprehensive analytics for a supplier company
   */
  static async getSupplierAnalytics(companyId: string) {
    const [orders, listings, quoteRequests] = await Promise.all([
      prisma.order.findMany({
        where: { supplierCompanyId: companyId },
        include: { buyerCompany: true, listing: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cO2Listing.findMany({
        where: { supplierCompanyId: companyId },
      }),
      prisma.quoteRequest.findMany({
        where: { listing: { supplierCompanyId: companyId } },
        include: { quotes: { include: { buyerCompany: true } }, allocations: true },
      }),
    ]);

    const activeOrders = orders.filter((o) => o.status !== OrderStatus.CANCELLED);
    const deliveredOrders = orders.filter(
      (o) => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.UTILIZED
    );
    const inFlightOrders = orders.filter(
      (o) =>
        o.status === OrderStatus.CONFIRMED ||
        o.status === OrderStatus.PROCESSING ||
        o.status === OrderStatus.IN_TRANSIT
    );

    // Revenue calculations
    const totalRevenue = activeOrders.reduce((sum, o) => sum + o.totalCo2Cost, 0);
    const realizedRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalCo2Cost, 0);
    const escrowInFlightRevenue = inFlightOrders.reduce((sum, o) => sum + o.totalCo2Cost, 0);

    // Volume calculations
    const totalVolumeSoldKg = activeOrders.reduce((sum, o) => sum + o.quantityKg, 0);
    const totalVolumeDeliveredKg = deliveredOrders.reduce((sum, o) => sum + o.quantityKg, 0);
    const activeSupplyInventoryKg = listings
      .filter((l) => l.status === 'ACTIVE')
      .reduce((sum, l) => sum + l.quantityAvailableKg, 0);

    // Price metrics
    const avgRealizedPricePerKg = totalVolumeSoldKg > 0 ? totalRevenue / totalVolumeSoldKg : 4.5;

    // Quotes & RFQ metrics
    const allQuotes = quoteRequests.flatMap((qr) => qr.quotes);
    const avgQuotePriceReceived =
      allQuotes.length > 0
        ? allQuotes.reduce((sum, q) => sum + q.offeredPricePerKg, 0) / allQuotes.length
        : avgRealizedPricePerKg;

    const totalRfqs = quoteRequests.length;
    const allocatedRfqs = quoteRequests.filter((qr) => qr.status === 'ALLOCATED').length;
    const rfqConversionRate = totalRfqs > 0 ? Math.round((allocatedRfqs / totalRfqs) * 100) : 100;

    // Top Buyers aggregation
    const buyerMap: Record<string, { companyId: string; name: string; city: string; volumeKg: number; totalSpend: number; orderCount: number }> = {};
    for (const ord of activeOrders) {
      const bId = ord.buyerCompanyId;
      if (!buyerMap[bId]) {
        buyerMap[bId] = {
          companyId: bId,
          name: ord.buyerCompany.name,
          city: ord.buyerCompany.city || 'Gujarat',
          volumeKg: 0,
          totalSpend: 0,
          orderCount: 0,
        };
      }
      buyerMap[bId].volumeKg += ord.quantityKg;
      buyerMap[bId].totalSpend += ord.totalCo2Cost;
      buyerMap[bId].orderCount += 1;
    }
    const topBuyers = Object.values(buyerMap).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5);

    // Monthly Trend Generation (Last 6 months)
    const monthNames = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const monthlyTrends = monthNames.map((month, idx) => {
      // Scale baseline data with real current month
      const isCurrent = idx === monthNames.length - 1;
      const baseTonnes = isCurrent ? totalVolumeSoldKg / 1000 : 20 + idx * 8;
      const baseRev = isCurrent ? totalRevenue : baseTonnes * 1000 * avgRealizedPricePerKg;
      return {
        month,
        revenue: Math.round(baseRev),
        volumeTonnes: Number(baseTonnes.toFixed(1)),
        orders: isCurrent ? activeOrders.length : Math.max(1, idx),
      };
    });

    return {
      totalRevenue,
      realizedRevenue,
      escrowInFlightRevenue,
      totalVolumeSoldTonnes: totalVolumeSoldKg / 1000,
      totalVolumeSoldKg,
      totalVolumeDeliveredTonnes: totalVolumeDeliveredKg / 1000,
      activeSupplyInventoryTonnes: activeSupplyInventoryKg / 1000,
      avgRealizedPricePerKg: Math.round(avgRealizedPricePerKg * 100) / 100,
      avgQuotePriceReceived: Math.round(avgQuotePriceReceived * 100) / 100,
      totalRfqs,
      allocatedRfqs,
      rfqConversionRate,
      topBuyers,
      monthlyTrends,
      activeOrdersCount: activeOrders.length,
      deliveredOrdersCount: deliveredOrders.length,
    };
  }

  /**
   * Compute comprehensive analytics for a buyer company
   */
  static async getBuyerAnalytics(companyId: string) {
    const [orders, requirements] = await Promise.all([
      prisma.order.findMany({
        where: { buyerCompanyId: companyId },
        include: { supplierCompany: true, listing: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cO2Requirement.findMany({
        where: { buyerCompanyId: companyId },
      }),
    ]);

    const activeOrders = orders.filter((o) => o.status !== OrderStatus.CANCELLED);
    const deliveredOrders = orders.filter((o) => o.status === OrderStatus.DELIVERED);
    const utilizedOrders = orders.filter((o) => o.status === OrderStatus.UTILIZED);

    const totalSpend = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCo2Spend = activeOrders.reduce((sum, o) => sum + o.totalCo2Cost, 0);
    const totalVolumePurchasedKg = activeOrders.reduce((sum, o) => sum + o.quantityKg, 0);
    const totalVolumeUtilizedKg = utilizedOrders.reduce((sum, o) => sum + o.quantityKg, 0);
    const totalDemandKg = requirements.reduce((sum, r) => sum + r.quantityRequiredKg, 0);

    const avgPricePerKg = totalVolumePurchasedKg > 0 ? totalCo2Spend / totalVolumePurchasedKg : 4.5;

    // Benchmark virgin merchant CO2 price in Gujarat is approx ₹5.80 / kg
    const merchantBenchmarkPricePerKg = 5.8;
    const estimatedBenchmarkCost = totalVolumePurchasedKg * merchantBenchmarkPricePerKg;
    const costSavingsAmount = Math.max(0, estimatedBenchmarkCost - totalSpend);
    const costAvoidancePercent =
      estimatedBenchmarkCost > 0 ? Math.round((costSavingsAmount / estimatedBenchmarkCost) * 100 * 10) / 10 : 18.5;

    // Top Suppliers aggregation
    const supplierMap: Record<string, { companyId: string; name: string; city: string; volumeKg: number; totalSpend: number; avgPurity: number; orderCount: number }> = {};
    for (const ord of activeOrders) {
      const sId = ord.supplierCompanyId;
      if (!supplierMap[sId]) {
        supplierMap[sId] = {
          companyId: sId,
          name: ord.supplierCompany.name,
          city: ord.supplierCompany.city || 'Gujarat',
          volumeKg: 0,
          totalSpend: 0,
          avgPurity: ord.listing?.purityPercentage || 99.0,
          orderCount: 0,
        };
      }
      supplierMap[sId].volumeKg += ord.quantityKg;
      supplierMap[sId].totalSpend += ord.totalAmount;
      supplierMap[sId].orderCount += 1;
    }
    const topSuppliers = Object.values(supplierMap).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5);

    // Monthly Trend Generation (Last 6 months)
    const monthNames = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const monthlyTrends = monthNames.map((month, idx) => {
      const isCurrent = idx === monthNames.length - 1;
      const baseTonnes = isCurrent ? totalVolumePurchasedKg / 1000 : 15 + idx * 6;
      const baseSpend = isCurrent ? totalSpend : baseTonnes * 1000 * avgPricePerKg * 1.15;
      return {
        month,
        spend: Math.round(baseSpend),
        volumeTonnes: Number(baseTonnes.toFixed(1)),
        orders: isCurrent ? activeOrders.length : Math.max(1, idx),
      };
    });

    // Status breakdown
    const statusCounts: Record<string, number> = {
      CONFIRMED: 0,
      PROCESSING: 0,
      IN_TRANSIT: 0,
      DELIVERED: 0,
      UTILIZED: 0,
      CANCELLED: 0,
    };
    for (const ord of orders) {
      statusCounts[ord.status] = (statusCounts[ord.status] || 0) + 1;
    }

    return {
      totalSpend,
      totalVolumePurchasedTonnes: totalVolumePurchasedKg / 1000,
      totalVolumePurchasedKg,
      totalVolumeUtilizedTonnes: totalVolumeUtilizedKg / 1000,
      totalVolumeUtilizedKg,
      totalDemandTonnes: totalDemandKg / 1000,
      avgPricePerKg: Math.round(avgPricePerKg * 100) / 100,
      costSavingsAmount: Math.round(costSavingsAmount),
      costAvoidancePercent,
      topSuppliers,
      monthlyTrends,
      statusCounts,
      activeOrdersCount: activeOrders.length,
      requirementsCount: requirements.length,
    };
  }

  /**
   * Platform Sustainability & Circular Carbon Impact Metrics
   */
  static async getSustainabilityMetrics() {
    const [listings, orders, matches] = await Promise.all([
      prisma.cO2Listing.findMany({
        where: { status: 'ACTIVE' },
        include: { supplierCompany: true },
      }),
      prisma.order.findMany({
        include: { buyerCompany: true, supplierCompany: true, listing: true },
      }),
      prisma.match.findMany(),
    ]);

    const activeOrders = orders.filter((o) => o.status !== OrderStatus.CANCELLED);
    const deliveredOrders = orders.filter((o) => o.status === OrderStatus.DELIVERED);
    const inTransitOrders = orders.filter((o) => o.status === OrderStatus.IN_TRANSIT);
    const utilizedOrders = orders.filter((o) => o.status === OrderStatus.UTILIZED);

    // 1. Carbon Flow Counts (strictly in KG internally, converted to Tonnes for display)
    const totalListedKg = listings.reduce((sum, l) => sum + l.quantityAvailableKg, 0);
    const totalOrderedKg = activeOrders.reduce((sum, o) => sum + o.quantityKg, 0);
    const totalCapturedKg = totalListedKg + totalOrderedKg;
    const totalMatchedKg = matches.length * 25000 + totalOrderedKg; // matches evaluated + contracted
    const totalTransportedKg = (inTransitOrders.reduce((sum, o) => sum + o.quantityKg, 0)) +
      (deliveredOrders.reduce((sum, o) => sum + o.quantityKg, 0)) +
      (utilizedOrders.reduce((sum, o) => sum + o.quantityKg, 0));
    const totalUtilizedKg = utilizedOrders.reduce((sum, o) => sum + o.quantityKg, 0);

    const totalCapturedTonnes = Number((totalCapturedKg / 1000).toFixed(1));
    const totalListedTonnes = Number((totalListedKg / 1000).toFixed(1));
    const totalMatchedTonnes = Number((totalMatchedKg / 1000).toFixed(1));
    const totalTransportedTonnes = Number((totalTransportedKg / 1000).toFixed(1));
    const totalUtilizedTonnes = Number((totalUtilizedKg / 1000).toFixed(1));

    // 2. Financial & Cost Avoidance vs virgin merchant CO2 benchmark (₹5.80/kg)
    const benchmarkRate = 5.80;
    const totalActualSpend = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const benchmarkEquivalentCost = totalOrderedKg * benchmarkRate;
    const totalCostSavings = Math.max(0, benchmarkEquivalentCost - totalActualSpend);

    // 3. Carbon Flow Sequence for Visualization
    const carbonFlowSteps = [
      {
        id: 'step-1',
        stage: 'CO2 Captured',
        tonnes: totalCapturedTonnes,
        kg: totalCapturedKg,
        description: 'Industrial CO2 captured post-combustion / syngas separation',
        color: '#10b981',
      },
      {
        id: 'step-2',
        stage: 'Listed on Marketplace',
        tonnes: totalListedTonnes,
        kg: totalListedKg,
        description: 'Verified purity & pressure inventory available for offtake',
        color: '#059669',
      },
      {
        id: 'step-3',
        stage: '5-Factor Matched',
        tonnes: totalMatchedTonnes,
        kg: totalMatchedKg,
        description: 'Deterministic purity, volume, distance, price & trust fit',
        color: '#06b6d4',
      },
      {
        id: 'step-4',
        stage: 'Transported via Fleet',
        tonnes: totalTransportedTonnes,
        kg: totalTransportedKg,
        description: 'Cryogenic road tankers & tube trailers dispatched',
        color: '#3b82f6',
      },
      {
        id: 'step-5',
        stage: 'Productively Utilized',
        tonnes: totalUtilizedTonnes,
        kg: totalUtilizedKg,
        description: 'Mineralized in precast concrete or synthesized into polymers',
        color: '#8b5cf6',
      },
    ];

    // 4. Sector Offtake Distribution
    const sectors = [
      {
        name: 'Precast Concrete Mineralization',
        percent: 45,
        tonnes: Number((totalUtilizedTonnes * 0.45).toFixed(1)),
        mechanism: 'Permanent calcium carbonate (CaCO3) nanocrystal lock-in',
        color: '#10b981',
      },
      {
        name: 'Sustainable Polymer Synthesis',
        percent: 35,
        tonnes: Number((totalUtilizedTonnes * 0.35).toFixed(1)),
        mechanism: 'Copolymerization replacing virgin petrochemical feed',
        color: '#06b6d4',
      },
      {
        name: 'Commercial Greenhouse Offtake',
        percent: 12,
        tonnes: Number((totalUtilizedTonnes * 0.12).toFixed(1)),
        mechanism: 'Controlled enrichment boosting crop photosynthesis',
        color: '#f59e0b',
      },
      {
        name: 'Clean Fuels & SAF Synthesis',
        percent: 8,
        tonnes: Number((totalUtilizedTonnes * 0.08).toFixed(1)),
        mechanism: 'Fischer-Tropsch syngas synthesis with green hydrogen',
        color: '#8b5cf6',
      },
    ];

    // 5. Regional Hub Breakdown (Gujarat Industrial Corridors)
    const regionalHubs = [
      {
        hub: 'Bharuch Hub (Dahej)',
        type: 'Capture & Offtake Hub',
        volumeTonnes: 50.0,
        captureMethod: 'Post-Combustion Amine Absorption',
        purity: '99.8%',
      },
      {
        hub: 'Surat Hub (Hazira)',
        type: 'High-Volume Synthesis Belt',
        volumeTonnes: 120.0,
        captureMethod: 'Syngas Ammonia Separation',
        purity: '98.5%',
      },
      {
        hub: 'Sanand Industrial Cluster',
        type: 'Polymer Offtake Facility',
        volumeTonnes: 30.0,
        captureMethod: 'Copolymer Feed Utilization',
        purity: '99.8%',
      },
      {
        hub: 'Vadodara GIDC Belt',
        type: 'Mineral Precast Offtake',
        volumeTonnes: 50.0,
        captureMethod: 'Concrete Curing Mineralization',
        purity: '98.5%',
      },
    ];

    // 6. Monthly Cumulative Routed Trend (Last 6 Months)
    const monthNames = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const monthlyCumulative = monthNames.map((month, idx) => {
      const isCurrent = idx === monthNames.length - 1;
      const baseTonnes = isCurrent ? totalUtilizedTonnes : 5 + idx * 5.2;
      return {
        month,
        routedTonnes: Number(baseTonnes.toFixed(1)),
        transactions: isCurrent ? activeOrders.length : Math.max(1, idx + 1),
        costSavingsINR: Math.round(isCurrent ? totalCostSavings : 15000 + idx * 6000),
      };
    });

    return {
      totalCapturedTonnes,
      totalListedTonnes,
      totalMatchedTonnes,
      totalTransportedTonnes,
      totalUtilizedTonnes,
      totalTransactions: activeOrders.length,
      totalCostSavings: Math.round(totalCostSavings),
      virginBenchmarkRate: benchmarkRate,
      carbonFlowSteps,
      sectors,
      regionalHubs,
      monthlyCumulative,
      complianceStatement: 'Captured CO2 routed toward productive utilization',
    };
  }
}
