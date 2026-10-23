import { apiClient } from './apiClient';
import { NotificationItem } from '../types';

export const notificationService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await apiClient.get<NotificationItem[] | { notifications: NotificationItem[] }>(
      '/notifications'
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).notifications)) return (res as any).notifications;
    return [];
  },

  markAsRead: async (nid: string, is_read = true): Promise<any> => {
    return apiClient.patch(`/notifications/${encodeURIComponent(nid)}`, { is_read });
  },
};
