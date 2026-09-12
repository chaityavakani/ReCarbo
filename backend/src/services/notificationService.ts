import { prisma } from '../utils/prisma';
import { NotificationType } from '@prisma/client';
import { emitToRoom, broadcastEvent } from '../socket/socketHandler';
import { SOCKET_EVENTS } from '../socket/events';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  linkUrl?: string;
}

export class NotificationService {
  /**
   * Create a notification in DB and emit real-time socket event to user room
   */
  static async createNotification(params: CreateNotificationParams) {
    const { userId, title, message, type = NotificationType.SYSTEM_ALERT, linkUrl } = params;

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        linkUrl,
        isRead: false,
      },
    });

    // Real-time Socket.IO broadcast to the specific user's room
    emitToRoom(`user:${userId}`, SOCKET_EVENTS.NOTIFICATION_NEW, notification);

    return notification;
  }

  /**
   * Get user's notifications + unread count
   */
  static async getNotifications(userId: string, limit = 50, unreadOnly = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized to modify this notification');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return updated;
  }

  /**
   * Mark all unread notifications for a user as read
   */
  static async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true, count: result.count };
  }

  /**
   * Helper to broadcast a system alert notification to all users
   */
  static async broadcastSystemNotification(title: string, message: string, linkUrl?: string) {
    const users = await prisma.user.findMany({ select: { id: true } });

    const notifications = await Promise.all(
      users.map((u) =>
        this.createNotification({
          userId: u.id,
          title,
          message,
          type: NotificationType.SYSTEM_ALERT,
          linkUrl,
        })
      )
    );

    broadcastEvent(SOCKET_EVENTS.ALERT_BROADCAST, { title, message, linkUrl });
    return notifications;
  }
}
