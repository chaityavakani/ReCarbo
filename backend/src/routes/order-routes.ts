import { Router } from 'express';
import { OrderController } from '../controllers/stubControllers';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, OrderController.getOrders);

export default router;
