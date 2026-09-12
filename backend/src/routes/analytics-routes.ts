import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/supplier', authMiddleware, AnalyticsController.getSupplierAnalytics);
router.get('/buyer', authMiddleware, AnalyticsController.getBuyerAnalytics);

export default router;
