import { prisma } from '../utils/prisma';
import { OrderStatus, PaymentStatus, NotificationType, UserRole } from '@prisma/client';
import { SettingsService } from './settingsService';
import { MatchingService } from './matchingService';
import { createAuditLog } from './auditService';
import { broadcastEvent } from '../socket/socketHandler';
import { SOCKET_EVENTS } from '../socket/events';
import { NotificationService } from './notificationService';
import { EmailService } from './emailService';

export interface UpdateOrderStatusParams {
  orderId: string;
  newStatus: OrderStatus;
  userId: string;
  userRole: UserRole;
  userCompanyId?: string;
  userName?: string;
  trackingNumber?: string;
  notes?: string;
}

export interface CreateDirectOrderParams {
  listingId: string;
  buyerCompanyId: string;
  quantityKg: number;
  userId: string;
  deliveryAddress?: string;
  notes?: string;
}

export class OrderService {
  /**
   * Get all orders with role-based filtering
   */
  static async getOrders(user: { userId: string; role: UserRole; companyId?: string }, status?: OrderStatus) {
    const whereClause: any = {};

    if (user.role === 'SUPPLIER') {
      if (!user.companyId) {
        throw new Error('User does not belong to any supplier company');
      }
      whereClause.supplierCompanyId = user.companyId;
    } else if (user.role === 'BUYER') {
      if (!user.companyId) {
        throw new Error('User does not belong to any buyer company');
      }
      whereClause.buyerCompanyId = user.companyId;
    }
    // ADMIN sees all orders

    if (status) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        buyerCompany: true,
        supplierCompany: true,
        listing: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  /**
   * Get single order by ID with authorization check
   */
  static async getOrderById(orderId: string, user: { userId: string; role: UserRole; companyId?: string }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyerCompany: true,
        supplierCompany: true,
        listing: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Role-based access validation
    if (user.role !== 'ADMIN') {
      if (order.buyerCompanyId !== user.companyId && order.supplierCompanyId !== user.companyId) {
        throw new Error('Unauthorized to view this order');
      }
    }

    return order;
  }

  /**
   * Validates if a status transition is permitted given the current status and user role
   */
  static validateTransition(currentStatus: OrderStatus, newStatus: OrderStatus, userRole: UserRole): { valid: boolean; reason?: string } {
    if (currentStatus === newStatus) {
      return { valid: false, reason: `Order is already in ${currentStatus} status` };
    }

    if (currentStatus === OrderStatus.CANCELLED) {
      return { valid: false, reason: 'Cannot change status of a cancelled order' };
    }

    if (currentStatus === OrderStatus.UTILIZED) {
      return { valid: false, reason: 'Order has already reached terminal utilized state' };
    }

    // Cancellation rules
    if (newStatus === OrderStatus.CANCELLED) {
      if (userRole === 'ADMIN') return { valid: true };
      if (userRole === 'BUYER' && (currentStatus === OrderStatus.PENDING || currentStatus === OrderStatus.DRAFT)) {
        return { valid: true };
      }
      if (userRole === 'SUPPLIER' && (currentStatus === OrderStatus.PENDING || currentStatus === OrderStatus.CONFIRMED)) {
        return { valid: true };
      }
      return { valid: false, reason: `Cannot cancel order at stage ${currentStatus}` };
    }

    // Standard Forward Lifecycle:
    // PENDING -> CONFIRMED -> PROCESSING -> IN_TRANSIT -> DELIVERED -> UTILIZED
    const forwardChain: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.IN_TRANSIT,
      OrderStatus.DELIVERED,
      OrderStatus.UTILIZED,
    ];

    // Support legacy DRAFT transitioning to CONFIRMED
    if (currentStatus === OrderStatus.DRAFT && newStatus === OrderStatus.CONFIRMED) {
      return { valid: true };
    }

    const currentIndex = forwardChain.indexOf(currentStatus);
    const nextIndex = forwardChain.indexOf(newStatus);

    if (currentIndex === -1 || nextIndex === -1) {
      return { valid: false, reason: `Invalid status transition from ${currentStatus} to ${newStatus}` };
    }

    if (nextIndex !== currentIndex + 1 && userRole !== 'ADMIN') {
      return {
        valid: false,
        reason: `Sequential transition required: cannot jump from ${currentStatus} directly to ${newStatus}`,
      };
    }

    // Role-specific authorization
    if (userRole === 'SUPPLIER') {
      // Supplier advances: CONFIRMED -> PROCESSING, PROCESSING -> IN_TRANSIT
      if (
        (currentStatus === OrderStatus.PENDING && newStatus === OrderStatus.CONFIRMED) ||
        (currentStatus === OrderStatus.CONFIRMED && newStatus === OrderStatus.PROCESSING) ||
        (currentStatus === OrderStatus.PROCESSING && newStatus === OrderStatus.IN_TRANSIT)
      ) {
        return { valid: true };
      }
      return { valid: false, reason: `Suppliers cannot advance orders to ${newStatus}` };
    }

    if (userRole === 'BUYER') {
      // Buyer advances: IN_TRANSIT -> DELIVERED (Confirms receipt), DELIVERED -> UTILIZED (Productive use)
      if (
        (currentStatus === OrderStatus.IN_TRANSIT && newStatus === OrderStatus.DELIVERED) ||
        (currentStatus === OrderStatus.DELIVERED && newStatus === OrderStatus.UTILIZED)
      ) {
        return { valid: true };
      }
      return { valid: false, reason: `Buyers cannot advance orders to ${newStatus}` };
    }

    if (userRole === 'ADMIN') {
      return { valid: true };
    }

    return { valid: false, reason: 'Unauthorized role for status transition' };
  }

  /**
   * Update order status with validation, notifications, socket broadcast, and audit logging
   */
  static async updateOrderStatus(params: UpdateOrderStatusParams) {
    const { orderId, newStatus, userId, userRole, userCompanyId, userName, trackingNumber, notes } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyerCompany: { include: { users: true } },
        supplierCompany: { include: { users: true } },
        listing: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Role membership verification
    if (userRole === 'SUPPLIER' && order.supplierCompanyId !== userCompanyId) {
      throw new Error('You do not have permission to manage this supplier order');
    }
    if (userRole === 'BUYER' && order.buyerCompanyId !== userCompanyId) {
      throw new Error('You do not have permission to manage this buyer order');
    }

    // Transition validation
    const validation = this.validateTransition(order.status, newStatus, userRole);
    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid status transition');
    }

    // Determine payment status update based on lifecycle
    let updatedPaymentStatus = order.paymentStatus;
    if (newStatus === OrderStatus.CONFIRMED && order.paymentStatus === PaymentStatus.PENDING) {
      updatedPaymentStatus = PaymentStatus.ESCROW_HELD;
    } else if (newStatus === OrderStatus.DELIVERED || newStatus === OrderStatus.UTILIZED) {
      updatedPaymentStatus = PaymentStatus.RELEASED;
    } else if (newStatus === OrderStatus.CANCELLED && order.paymentStatus === PaymentStatus.ESCROW_HELD) {
      updatedPaymentStatus = PaymentStatus.REFUNDED;
    }

    // Database update in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          paymentStatus: updatedPaymentStatus,
          ...(trackingNumber && { trackingNumber }),
          ...(notes && { notes }),
        },
        include: {
          buyerCompany: true,
          supplierCompany: true,
          listing: true,
        },
      });

      return updated;
    });

    // Write Audit Log
    await createAuditLog({
      userId,
      action: `ORDER_STATUS_${newStatus}`,
      entityType: 'Order',
      entityId: order.id,
      details: {
        orderNumber: order.orderNumber,
        previousStatus: order.status,
        newStatus,
        paymentStatus: updatedPaymentStatus,
        updatedBy: userName || userId,
      },
    });

    // Send Real-time Notifications to Counterparties
    const statusMessages: Record<OrderStatus, { title: string; buyerMsg: string; supplierMsg: string; type: NotificationType }> = {
      PENDING: {
        title: 'Order Pending Review',
        buyerMsg: `Order ${order.orderNumber} is pending confirmation.`,
        supplierMsg: `New incoming order ${order.orderNumber} requires confirmation.`,
        type: NotificationType.ORDER_PLACED,
      },
      CONFIRMED: {
        title: 'Order Confirmed',
        buyerMsg: `Order ${order.orderNumber} has been confirmed. Escrow held securely.`,
        supplierMsg: `Order ${order.orderNumber} confirmed. Please prepare dispatch.`,
        type: NotificationType.ORDER_STATUS_CHANGED,
      },
      PROCESSING: {
        title: 'CO2 Cryogenic Batch Processing',
        buyerMsg: `Supplier has started cryogenic cylinder / tanker prep for Order ${order.orderNumber}.`,
        supplierMsg: `Order ${order.orderNumber} is marked as Processing.`,
        type: NotificationType.ORDER_STATUS_CHANGED,
      },
      IN_TRANSIT: {
        title: 'CO2 Shipment Dispatched (In-Transit)',
        buyerMsg: `Order ${order.orderNumber} is on its way via cryogenic road tanker! Tracking: ${trackingNumber || order.trackingNumber || 'Active'}.`,
        supplierMsg: `Order ${order.orderNumber} marked in-transit.`,
        type: NotificationType.ORDER_STATUS_CHANGED,
      },
      DELIVERED: {
        title: 'CO2 Delivery Completed',
        buyerMsg: `Delivery confirmed for Order ${order.orderNumber}. Escrow payment released to supplier.`,
        supplierMsg: `Buyer confirmed receipt of Order ${order.orderNumber}. Escrow payment released.`,
        type: NotificationType.ORDER_DELIVERED,
      },
      UTILIZED: {
        title: 'CO2 Productive Utilization Verified',
        buyerMsg: `Order ${order.orderNumber} marked utilized in circular manufacturing! Carbon credits & trust recorded.`,
        supplierMsg: `Buyer has fully utilized CO2 from Order ${order.orderNumber} in industrial production.`,
        type: NotificationType.ORDER_STATUS_CHANGED,
      },
      CANCELLED: {
        title: 'Order Cancelled',
        buyerMsg: `Order ${order.orderNumber} was cancelled.`,
        supplierMsg: `Order ${order.orderNumber} was cancelled.`,
        type: NotificationType.SYSTEM_ALERT,
      },
      DRAFT: {
        title: 'Order Draft Saved',
        buyerMsg: `Order ${order.orderNumber} is in draft mode.`,
        supplierMsg: `Order ${order.orderNumber} draft created.`,
        type: NotificationType.SYSTEM_ALERT,
      },
    };

    const config = statusMessages[newStatus] || statusMessages.CONFIRMED;

    // Notify Buyer Users
    for (const buyerUser of order.buyerCompany.users) {
      await NotificationService.createNotification({
        userId: buyerUser.id,
        title: `${config.title} (${order.orderNumber})`,
        message: config.buyerMsg,
        type: config.type,
        linkUrl: `/orders`,
      });
    }

    // Notify Supplier Users
    for (const supplierUser of order.supplierCompany.users) {
      await NotificationService.createNotification({
        userId: supplierUser.id,
        title: `${config.title} (${order.orderNumber})`,
        message: config.supplierMsg,
        type: config.type,
        linkUrl: `/orders`,
      });
    }

    // Send status update emails to both parties
    for (const buyerUser of order.buyerCompany.users) {
      EmailService.sendOrderStatusUpdate(buyerUser.email, buyerUser.name, updatedOrder, newStatus, true).catch(() => {});
    }
    for (const supplierUser of order.supplierCompany.users) {
      EmailService.sendOrderStatusUpdate(supplierUser.email, supplierUser.name, updatedOrder, newStatus, false).catch(() => {});
    }

    // Real-Time Socket Broadcasts
    broadcastEvent(SOCKET_EVENTS.ORDER_STATUS_CHANGED, {
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
      updatedOrder,
    });

    if (newStatus === OrderStatus.DELIVERED) {
      broadcastEvent(SOCKET_EVENTS.ORDER_DELIVERED, updatedOrder);
    }

    return updatedOrder;
  }

  /**
   * Create direct order for Fixed-Price listing
   */
  static async createDirectOrder(params: CreateDirectOrderParams) {
    const { listingId, buyerCompanyId, quantityKg, userId, deliveryAddress, notes } = params;

    const activeFee = await SettingsService.getActivePlatformFee();
    const platformFeePct = activeFee.feePercentage;
    const transportRate = activeFee.transportRatePerKmKg;

    const result = await prisma.$transaction(async (tx) => {
      const listing = await tx.cO2Listing.findUnique({
        where: { id: listingId },
        include: { supplierCompany: true },
      });

      if (!listing) {
        throw new Error('CO2 Listing not found');
      }

      if (listing.status !== 'ACTIVE') {
        throw new Error('Listing is not currently active');
      }

      if (listing.quantityAvailableKg < quantityKg) {
        throw new Error(`Insufficient quantity available. Requested ${quantityKg} kg, available ${listing.quantityAvailableKg} kg`);
      }

      if (quantityKg < listing.minOrderKg) {
        throw new Error(`Order quantity must be at least ${listing.minOrderKg} kg`);
      }

      const buyerCompany = await tx.company.findUnique({
        where: { id: buyerCompanyId },
        include: { users: true },
      });

      if (!buyerCompany) {
        throw new Error('Buyer company not found');
      }

      // Calculate distance deterministically
      const distanceKm = MatchingService.calculateDistanceKm(
        listing.supplierCompany.latitude,
        listing.supplierCompany.longitude,
        buyerCompany.latitude,
        buyerCompany.longitude,
        listing.supplierCompany.city,
        buyerCompany.city
      );

      // Server-Recalculated Financials
      const totalCo2Cost = quantityKg * listing.pricePerKg;
      const transportCost = quantityKg * distanceKm * transportRate;
      const handlingCost = 2500.0; // Standard handling & QA verification
      const subtotal = totalCo2Cost + transportCost + handlingCost;
      const platformFee = (subtotal * platformFeePct) / 100;
      const totalAmount = subtotal + platformFee;

      const orderNumber = `RC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      // Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          listingId: listing.id,
          buyerCompanyId,
          supplierCompanyId: listing.supplierCompanyId,
          quantityKg,
          unitPricePerKg: listing.pricePerKg,
          totalCo2Cost,
          transportCost,
          handlingCost,
          platformFee,
          totalAmount,
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.ESCROW_HELD,
          deliveryAddress: deliveryAddress || `${buyerCompany.address || ''}, ${buyerCompany.city || ''}, ${buyerCompany.state || 'Gujarat'}`,
          routeDistanceKm: distanceKm,
          transitMethod: 'Cryogenic Road Tanker',
          estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          notes,
        },
        include: {
          buyerCompany: true,
          supplierCompany: true,
          listing: true,
        },
      });

      // Update Listing quantity
      const newRemainingKg = Math.max(0, listing.quantityAvailableKg - quantityKg);
      await tx.cO2Listing.update({
        where: { id: listing.id },
        data: {
          quantityAvailableKg: newRemainingKg,
          status: newRemainingKg < 100 ? 'SOLD_OUT' : 'ACTIVE',
        },
      });

      return { order, newRemainingKg };
    });

    // Write Audit Log
    await createAuditLog({
      userId,
      action: 'ORDER_PLACED_DIRECT',
      entityType: 'Order',
      entityId: result.order.id,
      details: {
        orderNumber: result.order.orderNumber,
        quantityKg,
        totalAmount: result.order.totalAmount,
      },
    });

    // Broadcast Socket.IO events
    broadcastEvent(SOCKET_EVENTS.ORDER_CREATED, result.order);
    broadcastEvent(SOCKET_EVENTS.LISTING_UPDATED, {
      listingId,
      quantityAvailableKg: result.newRemainingKg,
    });

    // Create notifications for both parties
    const buyerUsers = await prisma.user.findMany({ where: { companyId: buyerCompanyId } });
    const supplierUsers = await prisma.user.findMany({ where: { companyId: result.order.supplierCompanyId } });

    for (const u of buyerUsers) {
      await NotificationService.createNotification({
        userId: u.id,
        title: `Order Confirmed: ${result.order.orderNumber}`,
        message: `Your procurement order for ${(quantityKg / 1000).toFixed(1)} Tonnes of CO2 is confirmed.`,
        type: NotificationType.ORDER_PLACED,
        linkUrl: '/orders',
      });
      EmailService.sendOrderPlacedBuyer(u.email, u.name, result.order).catch(() => {});
    }

    for (const u of supplierUsers) {
      await NotificationService.createNotification({
        userId: u.id,
        title: `New Order Received: ${result.order.orderNumber}`,
        message: `${result.order.buyerCompany.name} purchased ${(quantityKg / 1000).toFixed(1)} Tonnes of CO2.`,
        type: NotificationType.ORDER_PLACED,
        linkUrl: '/orders',
      });
      EmailService.sendNewOrderSupplier(u.email, u.name, result.order).catch(() => {});
    }

    return result.order;
  }
}
