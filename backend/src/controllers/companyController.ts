import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../services/companyService';
import { TrustService } from '../services/trustService';
import { z } from 'zod';

const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  industry: z.string().min(2).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  website: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

export class CompanyController {
  static async getCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const company = await CompanyService.getCompanyById(id);
      return res.status(200).json({ company });
    } catch (error) {
      next(error);
    }
  }

  static async updateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      // Check authorization: must be admin or belong to this company
      if (req.user?.role !== 'ADMIN' && req.user?.companyId !== id) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only edit your own company profile',
          },
        });
      }

      const parsed = updateCompanySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors.map((e) => e.message).join(', '),
          },
        });
      }

      const updated = await CompanyService.updateCompany(id, parsed.data, req.user?.userId);
      return res.status(200).json({ company: updated });
    } catch (error) {
      next(error);
    }
  }

  static async listCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const isVerified = req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined;
      const industry = req.query.industry as string | undefined;

      const companies = await CompanyService.getAllCompanies({ isVerified, industry });
      return res.status(200).json({ companies });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/:id/trust-breakdown
   * Get explainable 6-factor trust breakdown
   */
  static async getTrustBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const breakdown = await TrustService.getTrustBreakdown(id);
      return res.status(200).json({ trustBreakdown: breakdown });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/companies/verify-request
   * Submit documents for verification review
   */
  static async submitVerificationRequest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      }

      const companyId = req.user.companyId;
      if (!companyId) {
        return res.status(400).json({ error: { code: 'NO_COMPANY', message: 'User must belong to a company' } });
      }

      const { documents, notes } = req.body;
      const company = await TrustService.submitVerificationRequest(companyId, { documents, notes }, req.user.userId);

      return res.status(200).json({
        company,
        message: 'Verification request submitted for admin review.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/companies/:id/verify
   * Admin approves/rejects verification
   */
  static async verifyCompany(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
      }

      const { id } = req.params;
      const { isVerified, notes = 'Admin compliance audit approved.' } = req.body;

      const result = await TrustService.reviewVerification(id, Boolean(isVerified), notes, req.user.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
