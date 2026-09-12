import { Request, Response, NextFunction } from 'express';
import { RFQService } from '../services/rfqService';
import { AllocationPolicy } from '@prisma/client';

export class RFQController {
  static async getQuoteRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { listingId, supplierCompanyId } = req.query;
      const rfqs = await RFQService.getQuoteRequests(
        listingId as string | undefined,
        supplierCompanyId as string | undefined
      );
      return res.status(200).json({ rfqs, count: rfqs.length });
    } catch (error) {
      next(error);
    }
  }

  static async getQuoteRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const rfq = await RFQService.getQuoteRequestById(id);

      if (!rfq) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'RFQ not found' },
        });
      }

      return res.status(200).json({ rfq });
    } catch (error) {
      next(error);
    }
  }

  static async createQuoteRequest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'SUPPLIER' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Only suppliers or admins can create an RFQ' },
        });
      }

      const { listingId, deadline, allocationPolicy, requirementId } = req.body;

      if (!listingId || !deadline) {
        return res.status(400).json({
          error: { code: 'MISSING_FIELDS', message: 'Listing ID and deadline are required' },
        });
      }

      const rfq = await RFQService.createQuoteRequest(
        listingId,
        deadline,
        allocationPolicy || AllocationPolicy.BEST_VALUE,
        requirementId,
        req.user.userId
      );

      return res.status(201).json({ rfq, message: 'RFQ created and opened for bids' });
    } catch (error: any) {
      return res.status(400).json({
        error: { code: 'RFQ_CREATION_FAILED', message: error.message || 'Failed to create RFQ' },
      });
    }
  }

  static async submitQuote(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'BUYER' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Only registered buyers or admins can submit quotes' },
        });
      }

      if (!req.user.companyId) {
        return res.status(400).json({
          error: { code: 'NO_COMPANY', message: 'User must belong to a company to submit quotes' },
        });
      }

      const { id } = req.params; // quoteRequestId
      const { offeredQuantityKg, offeredPricePerKg } = req.body;

      if (!offeredQuantityKg || !offeredPricePerKg) {
        return res.status(400).json({
          error: { code: 'MISSING_FIELDS', message: 'Offered quantity and price per kg are required' },
        });
      }

      const quote = await RFQService.submitQuote(
        id,
        req.user.companyId,
        Number(offeredQuantityKg),
        Number(offeredPricePerKg),
        req.user.userId
      );

      return res.status(201).json({ quote, message: 'Quote submitted successfully' });
    } catch (error: any) {
      return res.status(400).json({
        error: { code: 'QUOTE_SUBMISSION_FAILED', message: error.message || 'Failed to submit quote' },
      });
    }
  }

  static async previewAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { policy } = req.query;

      const preview = await RFQService.previewAllocation(
        id,
        policy as AllocationPolicy | undefined
      );

      return res.status(200).json({ preview });
    } catch (error: any) {
      return res.status(400).json({
        error: { code: 'PREVIEW_FAILED', message: error.message || 'Failed to generate allocation preview' },
      });
    }
  }

  static async executeAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      }

      const { id } = req.params;
      const { policy } = req.body;

      const result = await RFQService.executeAllocation(
        id,
        req.user.userId,
        policy as AllocationPolicy | undefined
      );

      return res.status(200).json({
        success: true,
        message: 'RFQ allocation completed atomically and orders generated',
        ...result,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: { code: 'ALLOCATION_FAILED', message: error.message || 'Failed to execute allocation' },
      });
    }
  }
}
