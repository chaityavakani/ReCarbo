import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/supplier', authMiddleware, AnalyticsController.getSupplierAnalytics);
router.get('/buyer', authMiddleware, AnalyticsController.getBuyerAnalytics);
router.get('/sustainability', optionalAuthMiddleware, AnalyticsController.getSustainabilityMetrics);

export default router;
