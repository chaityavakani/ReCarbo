import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService';

export class AnalyticsController {
  /**
   * GET /api/analytics/supplier
   * Get analytics for supplier dashboard
   */
  static async getSupplierAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      }

      const companyId = req.user.companyId;
      if (!companyId) {
        return res.status(400).json({ error: { code: 'NO_COMPANY', message: 'User is not affiliated with a company' } });
      }

      const analytics = await AnalyticsService.getSupplierAnalytics(companyId);
      return res.status(200).json({ analytics });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/buyer
   * Get analytics for buyer dashboard
   */
  static async getBuyerAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      }

      const companyId = req.user.companyId;
      if (!companyId) {
        return res.status(400).json({ error: { code: 'NO_COMPANY', message: 'User is not affiliated with a company' } });
      }

      const analytics = await AnalyticsService.getBuyerAnalytics(companyId);
      return res.status(200).json({ analytics });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/sustainability
   * Get circular carbon ecosystem metrics & carbon flow tracking
   */
  static async getSustainabilityMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await AnalyticsService.getSustainabilityMetrics();
      return res.status(200).json({ metrics });
    } catch (error) {
      next(error);
    }
  }
}
