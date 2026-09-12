import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services/settingsService';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  feePercentage: z.number().min(0).max(100),
  transportRatePerKmKg: z.number().min(0),
  minQuoteIncrement: z.number().min(0).optional(),
  defaultRfqHours: z.number().min(1).max(720).optional(),
  requireDocsForVerify: z.boolean().optional(),
});

export class SettingsController {
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getActivePlatformFee();
      return res.status(200).json({ settings });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors.map((e) => e.message).join(', '),
          },
        });
      }

      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Only admins can update platform settings',
          },
        });
      }

      const updated = await SettingsService.updatePlatformFee(
        parsed.data,
        req.user.userId
      );

      return res.status(200).json({ settings: updated });
    } catch (error) {
      next(error);
    }
  }
}
