import { Router } from 'express';
import { StatsController } from '../controllers/stubControllers';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

router.get('/overview', authMiddleware, roleMiddleware(['ADMIN']), StatsController.getOverview);
router.get('/audit-logs', authMiddleware, roleMiddleware(['ADMIN']), StatsController.getAuditLogs);

export default router;
