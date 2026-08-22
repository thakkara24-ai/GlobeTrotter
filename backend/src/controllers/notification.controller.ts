import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notification.service';
import { notificationQuerySchema } from '../validators/notification.validator';

/**
 * GET /api/notifications
 */
export const getUserNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const validatedQuery = notificationQuerySchema.parse(req.query);

    const result = await notificationService.getUserNotifications(
      userId,
      validatedQuery
    );

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const result = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/:notificationId/read
 */
export const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const notificationId = req.params.notificationId as string;

    const notification = await notificationService.markNotificationAsRead(
      notificationId,
      userId
    );

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/read-all
 */
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const result = await notificationService.markAllNotificationsAsRead(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications/:notificationId
 */
export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const notificationId = req.params.notificationId as string;

    await notificationService.deleteNotification(notificationId, userId);

    res.json({
      success: true,
      data: { message: 'Notification deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};
