import { Request, Response, NextFunction } from 'express';
import { LogisticsService } from '../services/logisticsService';

export class LogisticsController {
  static async calculateCost(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        quantityKg,
        pricePerKg,
        originLat,
        originLng,
        originCity,
        destLat,
        destLng,
        destCity,
        distanceKm,
        transportMode,
      } = req.body;

      if (!quantityKg || Number(quantityKg) <= 0) {
        return res.status(400).json({
          error: { code: 'INVALID_QUANTITY', message: 'Quantity in kg must be greater than 0' },
        });
      }

      const result = await LogisticsService.calculateCost({
        quantityKg: Number(quantityKg),
        pricePerKg: pricePerKg ? Number(pricePerKg) : 4.5,
        originLat: originLat ? Number(originLat) : undefined,
        originLng: originLng ? Number(originLng) : undefined,
        originCity,
        destLat: destLat ? Number(destLat) : undefined,
        destLng: destLng ? Number(destLng) : undefined,
        destCity,
        distanceKm: distanceKm ? Number(distanceKm) : undefined,
        transportMode,
        userId: req.user?.userId,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async estimateProductDemand(req: Request, res: Response, next: NextFunction) {
    try {
      const { application, productionUnits, unitPricePerKg } = req.body;

      if (!application || !productionUnits || Number(productionUnits) <= 0) {
        return res.status(400).json({
          error: { code: 'INVALID_PARAMS', message: 'Valid industrial application and production quantity required' },
        });
      }

      const result = LogisticsService.estimateProductCo2Demand({
        application,
        productionUnits: Number(productionUnits),
        unitPricePerKg: unitPricePerKg ? Number(unitPricePerKg) : 4.5,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
