import api from './api';
import { NotificationItem } from '../types';

export const notificationService = {
  getNotifications: async (unreadOnly = false): Promise<{ notifications: NotificationItem[]; unreadCount: number }> => {
    const res = await api.get('/notifications', { params: { unreadOnly } });
    return res.data;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data.notification;
  },

  markAllAsRead: async (): Promise<{ success: boolean; count: number }> => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};
