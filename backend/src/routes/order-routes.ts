import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, OrderController.getOrders);
router.get('/:id', authMiddleware, OrderController.getOrderById);
router.patch('/:id/status', authMiddleware, OrderController.updateStatus);
router.post('/', authMiddleware, OrderController.createDirectOrder);

export default router;
