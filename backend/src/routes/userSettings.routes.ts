import { Router } from 'express';
import { UserSettingsController } from '../controllers/userSettings.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Protected settings routes
router.get('/', requireAuth, UserSettingsController.getUserSettings);
router.put('/', requireAuth, UserSettingsController.updateUserSettings);

export default router;
