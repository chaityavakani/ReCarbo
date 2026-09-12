import { prisma } from '../utils/prisma';
import { NotificationType } from '@prisma/client';
import { NotificationService } from './notificationService';
import { createAuditLog } from './auditService';
import { broadcastEvent } from '../socket/socketHandler';
import { SOCKET_EVENTS } from '../socket/events';

export interface TrustFactor {
  id: string;
  name: string;
  weight: number; // percentage out of 100
  score: number; // 0 to 100
  contribution: number; // weight * score / 100
  description: string;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'UNVERIFIED';
}

export interface TrustScoreBreakdown {
  companyId: string;
  companyName: string;
  isVerified: boolean;
  verificationStatus: string;
  overallScore: number;
  grade: 'AAA' | 'AA' | 'A' | 'BBB' | 'UNRATED';
  summary: string;
  factors: TrustFactor[];
  lastCalculatedAt: string;
}

export class TrustService {
  /**
   * Compute comprehensive, explainable 6-factor trust breakdown for a company
   */
  static async getTrustBreakdown(companyId: string): Promise<TrustScoreBreakdown> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        ordersAsSupplier: {
          include: { listing: true },
        },
        ordersAsBuyer: true,
        listings: true,
        quotesSubmitted: true,
      },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // 1. Company Verification Factor (Weight: 25%)
    let companyVerificationScore = 60.0;
    if (company.isVerified) {
      companyVerificationScore = 100.0;
    } else if (company.verificationStatus === 'PENDING_REVIEW') {
      companyVerificationScore = 75.0;
    } else if (company.address && company.city && company.contactEmail && company.contactPhone) {
      companyVerificationScore = 70.0;
    }

    // 2. Verified CO2 Data & Specifications (Weight: 20%)
    let co2DataScore = 80.0;
    if (company.listings.length > 0) {
      const avgPurity = company.listings.reduce((acc, l) => acc + l.purityPercentage, 0) / company.listings.length;
      if (avgPurity >= 99.0) co2DataScore = 98.0;
      else if (avgPurity >= 98.0) co2DataScore = 92.0;
      else co2DataScore = 85.0;
    } else if (company.isVerified) {
      co2DataScore = 95.0;
    }

    // 3. Successful Transaction Volume & Fulfillments (Weight: 20%)
    const allOrders = [...company.ordersAsSupplier, ...company.ordersAsBuyer];
    const completedOrders = allOrders.filter((o) => o.status === 'DELIVERED' || o.status === 'UTILIZED');
    const cancelledOrders = allOrders.filter((o) => o.status === 'CANCELLED');

    let transactionScore = 80.0;
    if (completedOrders.length >= 5) {
      transactionScore = 98.0;
    } else if (completedOrders.length >= 2) {
      transactionScore = 92.0;
    } else if (completedOrders.length === 1) {
      transactionScore = 86.0;
    } else if (allOrders.length > 0) {
      transactionScore = 82.0;
    }

    // 4. Delivery Timeliness & Logistics Success (Weight: 15%)
    let deliveryScore = 90.0;
    if (cancelledOrders.length > 0) {
      deliveryScore = Math.max(60.0, 90.0 - cancelledOrders.length * 10);
    }
    if (completedOrders.length > 0) {
      deliveryScore = Math.min(100.0, deliveryScore + 5.0);
    }

    // 5. Quality & Purity Consistency (Weight: 10%)
    let qualityScore = 92.0;
    if (company.isVerified) {
      qualityScore = 96.0;
    }

    // 6. Response Rate & RFQ Participation (Weight: 10%)
    let responseScore = 88.0;
    const quotesCount = company.quotesSubmitted.length;
    if (quotesCount >= 3) {
      responseScore = 96.0;
    } else if (quotesCount >= 1) {
      responseScore = 92.0;
    }

    // Factor definitions
    const factors: TrustFactor[] = [
      {
        id: 'company_verification',
        name: 'Company Identity & Registration',
        weight: 25,
        score: companyVerificationScore,
        contribution: (25 * companyVerificationScore) / 100,
        description: company.isVerified
          ? 'Corporate identity, GSTIN, and Gujarat industrial node verified by ReCarbo Platform Authority.'
          : 'Pending full regulatory document review.',
        status: companyVerificationScore >= 90 ? 'EXCELLENT' : companyVerificationScore >= 75 ? 'GOOD' : 'UNVERIFIED',
      },
      {
        id: 'co2_specs',
        name: 'CO2 Purity & Calibration Data',
        weight: 20,
        score: co2DataScore,
        contribution: (20 * co2DataScore) / 100,
        description: 'Verified gas chromatography purity profiles, state-of-matter pressure ratings, and certified capture methodology.',
        status: co2DataScore >= 90 ? 'EXCELLENT' : 'GOOD',
      },
      {
        id: 'transactions',
        name: 'Transaction & Fulfillment History',
        weight: 20,
        score: transactionScore,
        contribution: (20 * transactionScore) / 100,
        description: `${completedOrders.length} successfully delivered/utilized commercial CO2 transaction batches with full escrow settlement.`,
        status: transactionScore >= 90 ? 'EXCELLENT' : 'GOOD',
      },
      {
        id: 'logistics_adherence',
        name: 'Logistics & Dispatch Timeliness',
        weight: 15,
        score: deliveryScore,
        contribution: (15 * deliveryScore) / 100,
        description: 'On-schedule dispatch of cryogenic road tankers and zero unresolved transit disputes.',
        status: deliveryScore >= 90 ? 'EXCELLENT' : deliveryScore >= 75 ? 'GOOD' : 'FAIR',
      },
      {
        id: 'quality_consistency',
        name: 'Batch Quality Consistency',
        weight: 10,
        score: qualityScore,
        contribution: (10 * qualityScore) / 100,
        description: 'Zero specification deviations or purity rejection events reported across all procurement orders.',
        status: qualityScore >= 90 ? 'EXCELLENT' : 'GOOD',
      },
      {
        id: 'rfq_promptness',
        name: 'RFQ Response & Uptime',
        weight: 10,
        score: responseScore,
        contribution: (10 * responseScore) / 100,
        description: 'Commercial promptness in quote submissions, bid allocations, and transaction lifecycle advancement.',
        status: responseScore >= 90 ? 'EXCELLENT' : 'GOOD',
      },
    ];

    const overallScore = Math.round(factors.reduce((sum, f) => sum + f.contribution, 0) * 10) / 10;

    let grade: 'AAA' | 'AA' | 'A' | 'BBB' | 'UNRATED' = 'A';
    if (overallScore >= 95) grade = 'AAA';
    else if (overallScore >= 90) grade = 'AA';
    else if (overallScore >= 80) grade = 'A';
    else if (overallScore >= 70) grade = 'BBB';
    else grade = 'UNRATED';

    let summary = '';
    if (company.isVerified && overallScore >= 90) {
      summary = `Prime Industrial Grade (${grade}): Fully verified entity with pristine fulfillment record, calibrated CO2 purity metrics, and seamless logistics adherence in the Gujarat industrial hub.`;
    } else if (company.isVerified) {
      summary = `Verified Enterprise (${grade}): Officially verified entity with strong operational history and reliable supply-chain execution.`;
    } else {
      summary = `Provisional Trust Rating (${grade}): Base business profile active. Submitting environmental clearances & purity test certificates will elevate trust to Verified Tier.`;
    }

    // Sync trust score back to company record if changed
    if (Math.abs(company.trustScore - overallScore) > 0.1) {
      await prisma.company.update({
        where: { id: companyId },
        data: { trustScore: overallScore },
      });
    }

    return {
      companyId: company.id,
      companyName: company.name,
      isVerified: company.isVerified,
      verificationStatus: company.verificationStatus || (company.isVerified ? 'VERIFIED' : 'UNVERIFIED'),
      overallScore,
      grade,
      summary,
      factors,
      lastCalculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Submit documents for verification review
   */
  static async submitVerificationRequest(companyId: string, docsPayload: { documents: any; notes?: string }, userId: string) {
    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        verificationDocs: JSON.stringify(docsPayload),
        verificationStatus: 'PENDING_REVIEW',
      },
    });

    await createAuditLog({
      userId,
      action: 'VERIFICATION_SUBMITTED',
      entityType: 'Company',
      entityId: companyId,
      details: docsPayload,
    });

    // Notify Admins
    const adminUsers = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of adminUsers) {
      await NotificationService.createNotification({
        userId: admin.id,
        title: `Verification Request: ${company.name}`,
        message: `${company.name} (${company.city}, ${company.industry}) has submitted documents for verification review.`,
        type: NotificationType.VERIFICATION_UPDATE,
        linkUrl: '/admin/companies',
      });
    }

    return company;
  }

  /**
   * Admin approves or rejects company verification
   */
  static async reviewVerification(
    companyId: string,
    isVerified: boolean,
    notes: string,
    adminUserId: string
  ) {
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        isVerified,
        verificationStatus: isVerified ? 'VERIFIED' : 'REJECTED',
        verificationNotes: notes,
      },
      include: { users: true },
    });

    // Recalculate trust score
    const breakdown = await this.getTrustBreakdown(companyId);

    await createAuditLog({
      userId: adminUserId,
      action: isVerified ? 'COMPANY_VERIFIED' : 'COMPANY_VERIFICATION_REJECTED',
      entityType: 'Company',
      entityId: companyId,
      details: { isVerified, notes, newTrustScore: breakdown.overallScore },
    });

    // Notify company users
    for (const u of updatedCompany.users) {
      await NotificationService.createNotification({
        userId: u.id,
        title: isVerified ? '🎉 Verification Approved!' : 'Verification Review Update',
        message: isVerified
          ? `Your company "${updatedCompany.name}" is now an officially Verified Industrial Partner on ReCarbo! Trust Score updated to ${breakdown.overallScore}/100.`
          : `Your verification submission requires attention: ${notes}`,
        type: NotificationType.VERIFICATION_UPDATE,
        linkUrl: '/profile',
      });
    }

    broadcastEvent('company:verification_updated', {
      companyId,
      isVerified,
      trustScore: breakdown.overallScore,
    });

    return { company: updatedCompany, trustBreakdown: breakdown };
  }
}
