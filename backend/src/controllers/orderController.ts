import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { OrderStatus } from '@prisma/client';

export class OrderController {
  /**
   * GET /api/orders
   * Retrieve orders relevant to the current user's role/company
   */
  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      }

      const { status } = req.query;
      const orders = await OrderService.getOrders(
        {
          userId: req.user.userId,
          role: req.user.role,
          companyId: req.user.companyId || undefined,
        },
        status ? (status as OrderStatus) : undefined
      );

      return res.status(200).json({ orders });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/:id
   * Retrieve a single order by ID
   */
  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      }

      const { id } = req.params;
      const order = await OrderService.getOrderById(id, {
        userId: req.user.userId,
        role: req.user.role,
        companyId: req.user.companyId || undefined,
      });

      return res.status(200).json({ order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/orders/:id/status
   * Role-gated status transition
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      }

      const { id } = req.params;
      const { status, trackingNumber, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'Target status is required' },
        });
      }

      const updatedOrder = await OrderService.updateOrderStatus({
        orderId: id,
        newStatus: status as OrderStatus,
        userId: req.user.userId,
        userRole: req.user.role,
        userCompanyId: req.user.companyId || undefined,
        userName: req.user.email,
        trackingNumber,
        notes,
      });

      return res.status(200).json({
        order: updatedOrder,
        message: `Order status updated to ${status}`,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: { code: 'STATUS_UPDATE_ERROR', message: error.message || 'Failed to update order status' },
      });
    }
  }

  /**
   * POST /api/orders
   * Direct purchase of Fixed-Price listing
   */
  static async createDirectOrder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      }

      if (req.user.role !== 'BUYER' && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Only buyers or admins can create direct orders' },
        });
      }

      if (!req.user.companyId) {
        return res.status(400).json({
          error: { code: 'NO_COMPANY', message: 'Buyer must be affiliated with a company to place orders' },
        });
      }

      const { listingId, quantityKg, deliveryAddress, notes } = req.body;

      if (!listingId || !quantityKg) {
        return res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'listingId and quantityKg are required' },
        });
      }

      const order = await OrderService.createDirectOrder({
        listingId,
        buyerCompanyId: req.user.companyId,
        quantityKg: Number(quantityKg),
        userId: req.user.userId,
        deliveryAddress,
        notes,
      });

      return res.status(201).json({
        order,
        message: 'Direct order placed successfully',
      });
    } catch (error: any) {
      return res.status(400).json({
        error: { code: 'ORDER_CREATION_FAILED', message: error.message || 'Failed to place order' },
      });
    }
  }
}
