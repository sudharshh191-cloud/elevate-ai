import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// All notification routes require JWT authentication
router.get('/', requireAuth, NotificationController.getNotifications);
router.get('/unread-count', requireAuth, NotificationController.getUnreadCount);
router.put('/:id/read', requireAuth, NotificationController.markAsRead);
router.put('/read-all', requireAuth, NotificationController.markAllAsRead);

export default router;
