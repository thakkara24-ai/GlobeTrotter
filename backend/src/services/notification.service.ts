import mongoose from 'mongoose';
import Notification, {
  INotification,
  NotificationType,
} from '../models/Notification';
import { NotificationQueryInput } from '../validators/notification.validator';

export interface CreateNotificationDTO {
  recipient: string | mongoose.Types.ObjectId;
  actor?: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  trip?: string | mongoose.Types.ObjectId;
  post?: string | mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
}

export interface UserNotificationsResult {
  notifications: INotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

class NotificationService {
  /**
   * Internal helper: Create a notification.
   * Suppresses notifications if actor is the recipient.
   */
  async createNotification(
    data: CreateNotificationDTO
  ): Promise<INotification | null> {
    try {
      const recipientId = data.recipient.toString();
      const actorId = data.actor ? data.actor.toString() : undefined;

      // Do not notify user about their own action, except for status alerts like TRIP_OVER_BUDGET
      if (
        actorId &&
        actorId === recipientId &&
        data.type !== NotificationType.TRIP_OVER_BUDGET
      ) {
        return null;
      }

      // De-duplicate unread like notifications for the same post & actor
      if (data.type === NotificationType.POST_LIKED && actorId && data.post) {
        const existing = await Notification.findOne({
          recipient: recipientId,
          actor: actorId,
          post: data.post,
          type: NotificationType.POST_LIKED,
          isRead: false,
        });
        if (existing) {
          return existing;
        }
      }

      const notification = await Notification.create({
        recipient: recipientId,
        actor: actorId || undefined,
        type: data.type,
        title: data.title,
        message: data.message,
        trip: data.trip || undefined,
        post: data.post || undefined,
        metadata: data.metadata || undefined,
        isRead: false,
      });

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  /**
   * GET /api/notifications
   * Retrieves paginated notifications for the authenticated user.
   */
  async getUserNotifications(
    userId: string,
    options: NotificationQueryInput
  ): Promise<UserNotificationsResult> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { recipient: userId };
    if (options.unread === true) {
      filter.isRead = false;
    } else if (options.unread === false) {
      filter.isRead = true;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('actor', '_id name username avatar')
        .populate('trip', '_id title coverImage')
        .populate('post', '_id content')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  /**
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return { unreadCount };
  }

  /**
   * PUT /api/notifications/:notificationId/read
   * Marks a single notification as read (recipient only).
   */
  async markNotificationAsRead(
    notificationId: string,
    userId: string
  ): Promise<INotification> {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      const error = new Error('Invalid notification ID format');
      (error as any).statusCode = 400;
      throw error;
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      const error = new Error('Notification not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (notification.recipient.toString() !== userId) {
      const error = new Error(
        'You do not have permission to modify this notification'
      );
      (error as any).statusCode = 403;
      throw error;
    }

    notification.isRead = true;
    await notification.save();

    return notification.populate([
      { path: 'actor', select: '_id name username avatar' },
      { path: 'trip', select: '_id title coverImage' },
      { path: 'post', select: '_id content' },
    ]);
  }

  /**
   * PUT /api/notifications/read-all
   * Marks all notifications for a user as read.
   */
  async markAllNotificationsAsRead(
    userId: string
  ): Promise<{ updatedCount: number }> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return { updatedCount: result.modifiedCount };
  }

  /**
   * DELETE /api/notifications/:notificationId
   * Deletes a notification (recipient only).
   */
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      const error = new Error('Invalid notification ID format');
      (error as any).statusCode = 400;
      throw error;
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      const error = new Error('Notification not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (notification.recipient.toString() !== userId) {
      const error = new Error(
        'You do not have permission to delete this notification'
      );
      (error as any).statusCode = 403;
      throw error;
    }

    await Notification.findByIdAndDelete(notificationId);
  }
}

export default new NotificationService();
