import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../controllers/notification.controller';

const router = Router();

// All notification endpoints require authentication
router.use(authenticate);

router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllNotificationsAsRead);
router.put('/:notificationId/read', markNotificationAsRead);
router.delete('/:notificationId', deleteNotification);

export default router;
