import { Router } from 'express';
import { AssistantController } from '../controllers/assistantController';
import { optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/chat', optionalAuthMiddleware, AssistantController.chat);
router.post('/parse-search', optionalAuthMiddleware, AssistantController.parseSearch);

export default router;
