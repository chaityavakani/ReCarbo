import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, NotificationController.getNotifications);
router.patch('/:id/read', authMiddleware, NotificationController.markAsRead);
router.patch('/read-all', authMiddleware, NotificationController.markAllAsRead);

export default router;
