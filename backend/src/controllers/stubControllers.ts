import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export class MarketplaceController {
  static async getListings(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, stateOfMatter, minPurity, maxPrice, mode } = req.query;

      const listings = await prisma.cO2Listing.findMany({
        where: {
          status: status ? (status as any) : 'ACTIVE',
          ...(stateOfMatter && { stateOfMatter: stateOfMatter as string }),
          ...(minPurity && { purityPercentage: { gte: parseFloat(minPurity as string) } }),
          ...(maxPrice && { pricePerKg: { lte: parseFloat(maxPrice as string) } }),
          ...(mode && { transactionMode: mode as any }),
        },
        include: {
          supplierCompany: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              isVerified: true,
              trustScore: true,
              latitude: true,
              longitude: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ listings });
    } catch (error) {
      next(error);
    }
  }

  static async getListingById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const listing = await prisma.cO2Listing.findUnique({
        where: { id },
        include: {
          supplierCompany: true,
          matches: {
            include: { requirement: true },
          },
        },
      });

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
      if (!req.user || req.user.role !== 'SUPPLIER') {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Only registered suppliers can create CO2 listings' },
        });
      }

      if (!req.user.companyId) {
        return res.status(400).json({
          error: { code: 'NO_COMPANY', message: 'User must belong to a company to list CO2' },
        });
      }

      const {
        title,
        description,
        quantityAvailableKg,
        minOrderKg,
        purityPercentage,
        captureMethod,
        stateOfMatter,
        pressureBar,
        temperatureC,
        pricePerKg,
        isSplitAllowed,
        transactionMode,
      } = req.body;

      const listing = await prisma.cO2Listing.create({
        data: {
          supplierCompanyId: req.user.companyId,
          title,
          description,
          quantityAvailableKg: Number(quantityAvailableKg),
          minOrderKg: minOrderKg ? Number(minOrderKg) : 1000,
          purityPercentage: Number(purityPercentage),
          captureMethod: captureMethod || 'Industrial Capture',
          stateOfMatter: stateOfMatter || 'Liquid',
          pressureBar: pressureBar ? Number(pressureBar) : null,
          temperatureC: temperatureC ? Number(temperatureC) : null,
          pricePerKg: Number(pricePerKg),
          isSplitAllowed: isSplitAllowed ?? true,
          transactionMode: transactionMode || 'FIXED_PRICE',
          status: 'ACTIVE',
        },
        include: {
          supplierCompany: true,
        },
      });

      return res.status(201).json({ listing });
    } catch (error) {
      next(error);
    }
  }

  static async getRequirements(req: Request, res: Response, next: NextFunction) {
    try {
      const requirements = await prisma.cO2Requirement.findMany({
        include: {
          buyerCompany: {
            select: {
              id: true,
              name: true,
              city: true,
              isVerified: true,
              trustScore: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ requirements });
    } catch (error) {
      next(error);
    }
  }

  static async createRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'BUYER') {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Only registered buyers can post requirements' },
        });
      }

      if (!req.user.companyId) {
        return res.status(400).json({
          error: { code: 'NO_COMPANY', message: 'User must belong to a company to post requirements' },
        });
      }

      const {
        title,
        description,
        quantityRequiredKg,
        minPurityPercentage,
        maxPricePerKg,
        preferredState,
        targetDeliveryDate,
      } = req.body;

      const requirement = await prisma.cO2Requirement.create({
        data: {
          buyerCompanyId: req.user.companyId,
          title,
          description,
          quantityRequiredKg: Number(quantityRequiredKg),
          minPurityPercentage: Number(minPurityPercentage),
          maxPricePerKg: maxPricePerKg ? Number(maxPricePerKg) : null,
          preferredState: preferredState || 'Liquid',
          targetDeliveryDate: targetDeliveryDate ? new Date(targetDeliveryDate) : null,
          status: 'OPEN',
        },
        include: {
          buyerCompany: true,
        },
      });

      return res.status(201).json({ requirement });
    } catch (error) {
      next(error);
    }
  }

  static async getMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const matches = await prisma.match.findMany({
        include: {
          listing: {
            include: { supplierCompany: true },
          },
          requirement: {
            include: { buyerCompany: true },
          },
        },
        orderBy: { overallScore: 'desc' },
      });

      return res.status(200).json({ matches });
    } catch (error) {
      next(error);
    }
  }
}

export class OrderController {
  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req;
      const whereClause = user?.role === 'ADMIN'
        ? {}
        : user?.role === 'SUPPLIER'
        ? { supplierCompanyId: user.companyId || '' }
        : { buyerCompanyId: user?.companyId || '' };

      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          buyerCompany: true,
          supplierCompany: true,
          listing: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ orders });
    } catch (error) {
      next(error);
    }
  }
}

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      }

      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return res.status(200).json({ notifications });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
      return res.status(200).json({ notification: updated });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      }

      await prisma.notification.updateMany({
        where: { userId: req.user.userId, isRead: false },
        data: { isRead: true },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

export class StatsController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalListings,
        activeListingsCount,
        totalRequirements,
        totalCompanies,
        totalOrders,
        activePlatformFee,
      ] = await Promise.all([
        prisma.cO2Listing.count(),
        prisma.cO2Listing.count({ where: { status: 'ACTIVE' } }),
        prisma.cO2Requirement.count(),
        prisma.company.count(),
        prisma.order.count(),
        prisma.platformFee.findFirst({ where: { effectiveTo: null }, orderBy: { createdAt: 'desc' } }),
      ]);

      const volumeAggregate = await prisma.cO2Listing.aggregate({
        _sum: { quantityAvailableKg: true },
        where: { status: 'ACTIVE' },
      });

      return res.status(200).json({
        stats: {
          totalListings,
          activeListingsCount,
          totalRequirements,
          totalCompanies,
          totalOrders,
          activeVolumeTonnes: ((volumeAggregate._sum.quantityAvailableKg || 0) / 1000).toFixed(1),
          platformFeePercentage: activePlatformFee?.feePercentage || 2.5,
          transportRate: activePlatformFee?.transportRatePerKmKg || 0.015,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      return res.status(200).json({ logs });
    } catch (error) {
      next(error);
    }
  }
}
