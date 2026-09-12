import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { MatchingService } from '../services/matchingService';
import { createAuditLog } from '../services/auditService';
import { RequirementStatus } from '@prisma/client';

export class RequirementController {
  static async getRequirements(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, buyerCompanyId } = req.query;

      const where: any = {};
      if (status) where.status = status as RequirementStatus;
      if (buyerCompanyId) where.buyerCompanyId = buyerCompanyId as string;

      const requirements = await prisma.cO2Requirement.findMany({
        where,
        include: {
          buyerCompany: {
            select: {
              id: true,
              name: true,
              industry: true,
              city: true,
              state: true,
              isVerified: true,
              trustScore: true,
              latitude: true,
              longitude: true,
            },
          },
          matches: {
            include: {
              listing: {
                include: { supplierCompany: true },
              },
            },
            orderBy: { overallScore: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ requirements, count: requirements.length });
    } catch (error) {
      next(error);
    }
  }

  static async getRequirementById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requirement = await prisma.cO2Requirement.findUnique({
        where: { id },
        include: {
          buyerCompany: true,
          matches: {
            include: {
              listing: {
                include: { supplierCompany: true },
              },
            },
            orderBy: { overallScore: 'desc' },
          },
        },
      });

      if (!requirement) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Requirement not found' },
        });
      }

      return res.status(200).json({ requirement });
    } catch (error) {
      next(error);
    }
  }

  static async createRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'BUYER' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Only registered buyers or admins can post procurement requirements' },
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

      const qty = Number(quantityRequiredKg);
      const purity = Number(minPurityPercentage);

      if (qty <= 0) {
        return res.status(400).json({ error: { code: 'INVALID_QTY', message: 'Quantity must be greater than 0 kg' } });
      }
      if (purity <= 0 || purity > 100) {
        return res.status(400).json({ error: { code: 'INVALID_PURITY', message: 'Purity must be between 1 and 100%' } });
      }

      const requirement = await prisma.cO2Requirement.create({
        data: {
          buyerCompanyId: req.user.companyId,
          title,
          description: description || null,
          quantityRequiredKg: qty,
          minPurityPercentage: purity,
          maxPricePerKg: maxPricePerKg ? Number(maxPricePerKg) : null,
          preferredState: preferredState || 'Liquid',
          targetDeliveryDate: targetDeliveryDate ? new Date(targetDeliveryDate) : null,
          status: RequirementStatus.OPEN,
        },
        include: {
          buyerCompany: true,
        },
      });

      await createAuditLog({
        userId: req.user.userId,
        action: 'REQUIREMENT_CREATED',
        entityType: 'CO2Requirement',
        entityId: requirement.id,
        details: { title, quantityRequiredKg: qty, minPurityPercentage: purity },
      });

      return res.status(201).json({ requirement, message: 'CO2 requirement posted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async updateRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      }

      const { id } = req.params;
      const existing = await prisma.cO2Requirement.findUnique({ where: { id } });

      if (!existing) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Requirement not found' } });
      }

      if (req.user.role !== 'ADMIN' && existing.buyerCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized to edit this requirement' } });
      }

      const {
        title,
        description,
        quantityRequiredKg,
        minPurityPercentage,
        maxPricePerKg,
        preferredState,
        targetDeliveryDate,
        status,
      } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (quantityRequiredKg !== undefined) updateData.quantityRequiredKg = Number(quantityRequiredKg);
      if (minPurityPercentage !== undefined) updateData.minPurityPercentage = Number(minPurityPercentage);
      if (maxPricePerKg !== undefined) updateData.maxPricePerKg = maxPricePerKg ? Number(maxPricePerKg) : null;
      if (preferredState !== undefined) updateData.preferredState = preferredState;
      if (targetDeliveryDate !== undefined) updateData.targetDeliveryDate = targetDeliveryDate ? new Date(targetDeliveryDate) : null;
      if (status !== undefined) updateData.status = status;

      const updated = await prisma.cO2Requirement.update({
        where: { id },
        data: updateData,
        include: { buyerCompany: true },
      });

      return res.status(200).json({ requirement: updated, message: 'Requirement updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      }

      const { id } = req.params;
      const existing = await prisma.cO2Requirement.findUnique({ where: { id } });

      if (!existing) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Requirement not found' } });
      }

      if (req.user.role !== 'ADMIN' && existing.buyerCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized to delete this requirement' } });
      }

      await prisma.cO2Requirement.delete({ where: { id } });
      return res.status(200).json({ success: true, message: 'Requirement deleted' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Trigger AI Matching Engine for a requirement
   */
  static async findMatchesForRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const results = await MatchingService.findMatchesForRequirement(id);
      return res.status(200).json(results);
    } catch (error: any) {
      return res.status(400).json({
        error: { code: 'MATCHING_ERROR', message: error.message || 'Failed to compute matches' },
      });
    }
  }

  /**
   * Find matching requirements for a listing
   */
  static async findMatchesForListing(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const results = await MatchingService.findMatchesForListing(id);
      return res.status(200).json(results);
    } catch (error: any) {
      return res.status(400).json({
        error: { code: 'MATCHING_ERROR', message: error.message || 'Failed to compute matches' },
      });
    }
  }
}
