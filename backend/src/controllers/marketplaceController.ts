import { Request, Response, NextFunction } from 'express';
import { MarketplaceService, ListingFilterParams } from '../services/marketplaceService';
import { ListingStatus, TransactionMode } from '@prisma/client';
import { EmailService } from '../services/emailService';
import { prisma } from '../utils/prisma';

export class MarketplaceController {
  static async getListings(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        search,
        status,
        stateOfMatter,
        minPurity,
        maxPurity,
        minPrice,
        maxPrice,
        minQuantityKg,
        verifiedOnly,
        industry,
        transactionMode,
        supplierCompanyId,
        sortBy,
      } = req.query;

      const filters: ListingFilterParams = {
        search: search ? (search as string) : undefined,
        status: status ? (status as ListingStatus) : ListingStatus.ACTIVE,
        stateOfMatter: stateOfMatter ? (stateOfMatter as string) : undefined,
        minPurity: minPurity ? parseFloat(minPurity as string) : undefined,
        maxPurity: maxPurity ? parseFloat(maxPurity as string) : undefined,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        minQuantityKg: minQuantityKg ? parseFloat(minQuantityKg as string) : undefined,
        verifiedOnly: verifiedOnly === 'true',
        industry: industry ? (industry as string) : undefined,
        transactionMode: transactionMode ? (transactionMode as TransactionMode) : undefined,
        supplierCompanyId: supplierCompanyId ? (supplierCompanyId as string) : undefined,
        sortBy: sortBy as any,
      };

      const listings = await MarketplaceService.getListings(filters);
      return res.status(200).json({ listings, count: listings.length });
    } catch (error) {
      next(error);
    }
  }

  static async getListingById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const listing = await MarketplaceService.getListingById(id);

      if (!listing) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'CO2 Listing not found' },
        });
      }

      return res.status(200).json({ listing });
    } catch (error) {
      next(error);
    }
  }

  static async createListing(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'SUPPLIER' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Only registered suppliers or admins can create CO2 supply streams' },
        });
      }

      if (!req.user.companyId) {
        return res.status(400).json({
          error: { code: 'NO_COMPANY', message: 'User must belong to a company to list CO2' },
        });
      }

      const listing = await MarketplaceService.createListing(
        req.body,
        req.user.companyId,
        req.user.userId
      );

      // Email supplier: listing published
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (user) {
        EmailService.sendListingCreated(user.email, user.name, listing).catch(() => {});
      }

      return res.status(201).json({ listing, message: 'CO2 supply stream published successfully' });
    } catch (error: any) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: error.message || 'Failed to create listing' },
      });
    }
  }

  static async updateListing(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      }

      const { id } = req.params;
      const updated = await MarketplaceService.updateListing(
        id,
        req.body,
        req.user.companyId || '',
        req.user.userId,
        req.user.role === 'ADMIN'
      );

      return res.status(200).json({ listing: updated, message: 'Listing updated successfully' });
    } catch (error: any) {
      return res.status(400).json({
        error: { code: 'UPDATE_FAILED', message: error.message || 'Failed to update listing' },
      });
    }
  }

  static async setStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(ListingStatus).includes(status)) {
        return res.status(400).json({
          error: { code: 'INVALID_STATUS', message: 'Valid status is required' },
        });
      }

      const updated = await MarketplaceService.setListingStatus(
        id,
        status,
        req.user.companyId || '',
        req.user.userId,
        req.user.role === 'ADMIN'
      );

      return res.status(200).json({ listing: updated, message: `Listing status updated to ${status}` });
    } catch (error: any) {
      return res.status(400).json({
        error: { code: 'STATUS_UPDATE_FAILED', message: error.message || 'Failed to update status' },
      });
    }
  }

  static async deleteListing(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      }

      const { id } = req.params;
      const result = await MarketplaceService.deleteListing(
        id,
        req.user.companyId || '',
        req.user.userId,
        req.user.role === 'ADMIN'
      );

      return res.status(200).json({ message: 'Listing deleted successfully', ...result });
    } catch (error: any) {
      return res.status(400).json({
        error: { code: 'DELETE_FAILED', message: error.message || 'Failed to delete listing' },
      });
    }
  }
}
