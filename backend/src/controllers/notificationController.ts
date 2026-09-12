import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService';

export class NotificationController {
  /**
   * GET /api/notifications
   * Get user's notifications
   */
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const unreadOnly = req.query.unreadOnly === 'true';

      const { notifications, unreadCount } = await NotificationService.getNotifications(
        req.user.userId,
        limit,
        unreadOnly
      );

      return res.status(200).json({ notifications, unreadCount });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark single notification as read
   */
  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      }

      const { id } = req.params;
      const notification = await NotificationService.markAsRead(id, req.user.userId);

      return res.status(200).json({ notification });
    } catch (error: any) {
      return res.status(400).json({
        error: { code: 'NOTIFICATION_ERROR', message: error.message || 'Failed to update notification' },
      });
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read for the user
   */
  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      }

      const result = await NotificationService.markAllAsRead(req.user.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
