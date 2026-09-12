import { prisma } from '../utils/prisma';
import {
  AllocationPolicy,
  QuoteRequestStatus,
  QuoteStatus,
  OrderStatus,
  PaymentStatus,
  NotificationType,
} from '@prisma/client';
import { defaultTransactionStrategy } from './transactionStrategy';
import { SettingsService } from './settingsService';
import { MatchingService } from './matchingService';
import { createAuditLog } from './auditService';
import { broadcastEvent, emitToRoom } from '../socket/socketHandler';
import { SOCKET_EVENTS } from '../socket/events';

export class RFQService {
  /**
   * Get all active or historical RFQs
   */
  static async getQuoteRequests(listingId?: string, supplierCompanyId?: string) {
    const where: any = {};
    if (listingId) where.listingId = listingId;
    if (supplierCompanyId) {
      where.listing = { supplierCompanyId };
    }

    const rfqs = await prisma.quoteRequest.findMany({
      where,
      include: {
        listing: {
          include: {
            supplierCompany: true,
          },
        },
        requirement: true,
        quotes: {
          include: {
            buyerCompany: true,
          },
          orderBy: { offeredPricePerKg: 'desc' },
        },
        allocations: {
          include: {
            quote: {
              include: { buyerCompany: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rfqs;
  }

  /**
   * Get single RFQ by ID with full relations
   */
  static async getQuoteRequestById(id: string) {
    const rfq = await prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            supplierCompany: true,
          },
        },
        requirement: true,
        quotes: {
          include: {
            buyerCompany: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        allocations: {
          include: {
            quote: {
              include: { buyerCompany: true },
            },
          },
        },
      },
    });

    return rfq;
  }

  /**
   * Create an RFQ for a CO2 Listing
   */
  static async createQuoteRequest(
    listingId: string,
    deadline: Date | string,
    allocationPolicy: AllocationPolicy = AllocationPolicy.BEST_VALUE,
    requirementId?: string,
    userId?: string
  ) {
    const listing = await prisma.cO2Listing.findUnique({
      where: { id: listingId },
      include: { supplierCompany: true },
    });

    if (!listing) {
      throw new Error('CO2 Listing not found');
    }

    if (listing.status !== 'ACTIVE') {
      throw new Error('Cannot create RFQ for an inactive CO2 listing');
    }

    const rfq = await prisma.quoteRequest.create({
      data: {
        listingId,
        deadline: new Date(deadline),
        allocationPolicy,
        requirementId: requirementId || null,
        status: QuoteRequestStatus.OPEN,
      },
      include: {
        listing: { include: { supplierCompany: true } },
        quotes: true,
      },
    });

    if (userId) {
      await createAuditLog({
        userId,
        action: 'RFQ_CREATED',
        entityType: 'QuoteRequest',
        entityId: rfq.id,
        details: { listingId, deadline, allocationPolicy },
      });
    }

    broadcastEvent(SOCKET_EVENTS.QUOTE_REQUEST_CREATED, rfq);
    return rfq;
  }

  /**
   * Buyer submits a quote on an open RFQ
   */
  static async submitQuote(
    quoteRequestId: string,
    buyerCompanyId: string,
    offeredQuantityKg: number,
    offeredPricePerKg: number,
    userId: string
  ) {
    const rfq = await prisma.quoteRequest.findUnique({
      where: { id: quoteRequestId },
      include: { listing: { include: { supplierCompany: true } } },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    // Server-side validation via TransactionStrategy
    const validation = await defaultTransactionStrategy.validateRequest(
      rfq,
      buyerCompanyId,
      Number(offeredQuantityKg),
      Number(offeredPricePerKg)
    );

    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid quote submission');
    }

    // Concurrency safe submission
    const quote = await prisma.$transaction(async (tx) => {
      // Check if buyer already has an open quote on this RFQ
      const existingQuote = await tx.quote.findFirst({
        where: {
          quoteRequestId,
          buyerCompanyId,
          status: QuoteStatus.PENDING,
        },
      });

      if (existingQuote) {
        // Update existing quote
        return tx.quote.update({
          where: { id: existingQuote.id },
          data: {
            offeredQuantityKg: Number(offeredQuantityKg),
            offeredPricePerKg: Number(offeredPricePerKg),
          },
          include: { buyerCompany: true, quoteRequest: true },
        });
      }

      // Create new quote
      return tx.quote.create({
        data: {
          quoteRequestId,
          buyerCompanyId,
          offeredQuantityKg: Number(offeredQuantityKg),
          offeredPricePerKg: Number(offeredPricePerKg),
          status: QuoteStatus.PENDING,
        },
        include: { buyerCompany: true, quoteRequest: true },
      });
    });

    // Write audit log
    await createAuditLog({
      userId,
      action: 'QUOTE_SUBMITTED',
      entityType: 'Quote',
      entityId: quote.id,
      details: {
        rfqId: quoteRequestId,
        offeredQuantityKg: quote.offeredQuantityKg,
        offeredPricePerKg: quote.offeredPricePerKg,
      },
    });

    // Real-time broadcast
    broadcastEvent(SOCKET_EVENTS.QUOTE_SUBMITTED, quote);
    broadcastEvent(SOCKET_EVENTS.QUOTE_UPDATED, quote);

    return quote;
  }

  /**
   * Preview allocation without persisting (dry-run simulation)
   */
  static async previewAllocation(quoteRequestId: string, policyOverride?: AllocationPolicy) {
    const rfq = await prisma.quoteRequest.findUnique({
      where: { id: quoteRequestId },
      include: {
        listing: { include: { supplierCompany: true } },
        quotes: {
          where: { status: QuoteStatus.PENDING },
          include: { buyerCompany: true },
        },
      },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    const policy = policyOverride || rfq.allocationPolicy;
    const rankedOffers = defaultTransactionStrategy.rankOffers(
      policy,
      rfq.quotes,
      rfq.listing
    );

    const { winners, unallocatedKg } = defaultTransactionStrategy.selectWinners(
      rankedOffers,
      rfq.listing.quantityAvailableKg,
      rfq.listing.isSplitAllowed
    );

    return {
      rfqId: rfq.id,
      policyUsed: policy,
      totalAvailableKg: rfq.listing.quantityAvailableKg,
      isSplitAllowed: rfq.listing.isSplitAllowed,
      rankedOffers,
      winners,
      unallocatedKg,
    };
  }

  /**
   * Atomic Allocation Execution: evaluates winners, locks rows, updates DB, creates binding orders
   */
  static async executeAllocation(quoteRequestId: string, userId: string, policyOverride?: AllocationPolicy) {
    const activeSettings = await SettingsService.getActivePlatformFee();
    const platformFeePct = activeSettings.feePercentage;
    const transportRate = activeSettings.transportRatePerKmKg;

    // Prisma Transaction with row locking & atomic consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch and lock RFQ & Listing
      const rfq = await tx.quoteRequest.findUnique({
        where: { id: quoteRequestId },
        include: {
          listing: { include: { supplierCompany: true } },
          quotes: {
            where: { status: QuoteStatus.PENDING },
            include: { buyerCompany: true },
          },
        },
      });

      if (!rfq) {
        throw new Error('RFQ not found');
      }

      if (rfq.status === QuoteRequestStatus.ALLOCATED || rfq.status === QuoteRequestStatus.CLOSED) {
        throw new Error('RFQ is already allocated or closed');
      }

      if (rfq.quotes.length === 0) {
        throw new Error('No pending buyer quotes to allocate');
      }

      const policy = policyOverride || rfq.allocationPolicy;

      // 2. Rank offers using TransactionStrategy
      const rankedOffers = defaultTransactionStrategy.rankOffers(
        policy,
        rfq.quotes,
        rfq.listing
      );

      // 3. Select winners based on split rules
      const { winners, unallocatedKg } = defaultTransactionStrategy.selectWinners(
        rankedOffers,
        rfq.listing.quantityAvailableKg,
        rfq.listing.isSplitAllowed
      );

      if (winners.length === 0) {
        throw new Error('No eligible winning buyers could be selected');
      }

      const createdAllocations = [];
      const createdOrders = [];
      let totalAllocatedKg = 0;

      // 4. Process each winning quote
      for (const winner of winners) {
        totalAllocatedKg += winner.allocatedQuantityKg;

        // Create Allocation record
        const allocation = await tx.allocation.create({
          data: {
            quoteRequestId: rfq.id,
            quoteId: winner.quoteId,
            allocatedQuantityKg: winner.allocatedQuantityKg,
            agreedPricePerKg: winner.offeredPricePerKg,
            allocationStatus: 'CONFIRMED',
          },
        });
        createdAllocations.push(allocation);

        // Update Quote status
        await tx.quote.update({
          where: { id: winner.quoteId },
          data: {
            status: winner.isPartial ? QuoteStatus.PARTIALLY_ACCEPTED : QuoteStatus.ACCEPTED,
          },
        });

        // 5. Mandatory Server-Recalculated Financials for Order
        const distanceKm = MatchingService.calculateDistanceKm(
          rfq.listing.supplierCompany.latitude,
          rfq.listing.supplierCompany.longitude,
          winner.buyerCompany.latitude,
          winner.buyerCompany.longitude,
          rfq.listing.supplierCompany.city,
          winner.buyerCompany.city
        );

        const totalCo2Cost = winner.allocatedQuantityKg * winner.offeredPricePerKg;
        const transportCost = winner.allocatedQuantityKg * distanceKm * transportRate;
        const handlingCost = 2500.0; // Standard handling/QA audit fee
        const subtotal = totalCo2Cost + transportCost + handlingCost;
        const platformFee = (subtotal * platformFeePct) / 100;
        const totalAmount = subtotal + platformFee;

        // Unique order number: RC-YYYY-RANDOM
        const orderNumber = `RC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

        const order = await tx.order.create({
          data: {
            orderNumber,
            listingId: rfq.listingId,
            buyerCompanyId: winner.buyerCompanyId,
            supplierCompanyId: rfq.listing.supplierCompanyId,
            quantityKg: winner.allocatedQuantityKg,
            unitPricePerKg: winner.offeredPricePerKg,
            totalCo2Cost,
            transportCost,
            handlingCost,
            platformFee,
            totalAmount,
            status: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PENDING,
            deliveryAddress: `${winner.buyerCompany.address || ''}, ${winner.buyerCompany.city || ''}, ${winner.buyerCompany.state || 'Gujarat'}`,
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          },
        });
        createdOrders.push(order);

        // Send buyer notification
        const buyerUser = await tx.user.findFirst({
          where: { companyId: winner.buyerCompanyId },
        });

        if (buyerUser) {
          await tx.notification.create({
            data: {
              userId: buyerUser.id,
              title: `Quote Allocated! (${(winner.allocatedQuantityKg / 1000).toFixed(1)} Tonnes)`,
              message: `Your quote on "${rfq.listing.title}" has been allocated. Order ${orderNumber} is now confirmed.`,
              type: NotificationType.QUOTE_ACCEPTED,
              linkUrl: '/orders',
            },
          });
        }
      }

      // 6. Reject non-winning quotes
      const winningQuoteIds = new Set(winners.map((w) => w.quoteId));
      for (const quote of rfq.quotes) {
        if (!winningQuoteIds.has(quote.id)) {
          await tx.quote.update({
            where: { id: quote.id },
            data: { status: QuoteStatus.REJECTED },
          });

          const nonWinnerUser = await tx.user.findFirst({
            where: { companyId: quote.buyerCompanyId },
          });
          if (nonWinnerUser) {
            await tx.notification.create({
              data: {
                userId: nonWinnerUser.id,
                title: 'Quote Not Selected',
                message: `Your quote on "${rfq.listing.title}" was not selected in this allocation cycle.`,
                type: NotificationType.SYSTEM_ALERT,
                linkUrl: '/quote-requests',
              },
            });
          }
        }
      }

      // 7. Update Listing remaining quantity & status
      const newRemainingKg = Math.max(0, rfq.listing.quantityAvailableKg - totalAllocatedKg);
      const isSoldOut = newRemainingKg < 100;

      await tx.cO2Listing.update({
        where: { id: rfq.listingId },
        data: {
          quantityAvailableKg: newRemainingKg,
          status: isSoldOut ? 'SOLD_OUT' : 'ACTIVE',
        },
      });

      // 8. Update QuoteRequest status
      const updatedRfq = await tx.quoteRequest.update({
        where: { id: quoteRequestId },
        data: {
          status: QuoteRequestStatus.ALLOCATED,
        },
      });

      return {
        rfq: updatedRfq,
        totalAllocatedKg,
        newRemainingKg,
        allocations: createdAllocations,
        orders: createdOrders,
      };
    });

    // 9. Write audit log
    await createAuditLog({
      userId,
      action: 'RFQ_ALLOCATED',
      entityType: 'QuoteRequest',
      entityId: quoteRequestId,
      details: {
        totalAllocatedKg: result.totalAllocatedKg,
        ordersCreatedCount: result.orders.length,
      },
    });

    // 10. Emit real-time socket events
    broadcastEvent(SOCKET_EVENTS.ALLOCATION_RESOLVED, result);
    broadcastEvent(SOCKET_EVENTS.LISTING_ALLOCATED, {
      listingId: result.rfq.listingId,
      newRemainingKg: result.newRemainingKg,
    });

    for (const order of result.orders) {
      broadcastEvent(SOCKET_EVENTS.ORDER_CREATED, order);
    }

    return result;
  }
}
