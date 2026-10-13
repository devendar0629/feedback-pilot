import { apiClient } from './client';
import { NotificationItem } from '../types';

export const notificationsApi = {
  list: async (): Promise<NotificationItem[]> => {
    const res = await apiClient.get<NotificationItem[]>('/notifications');
    return res.data;
  },

  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const res = await apiClient.get<{ unread_count: number }>('/notifications/unread-count');
    return res.data;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const res = await apiClient.patch<NotificationItem>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await apiClient.post('/notifications/mark-all-read');
    return res.data;
  },
};
