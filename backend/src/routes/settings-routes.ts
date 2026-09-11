import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', SettingsController.getSettings);
router.put('/', authMiddleware, roleMiddleware(['ADMIN']), SettingsController.updateSettings);

export default router;
