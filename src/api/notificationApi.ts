import { api } from "./api";

export interface NotificationItem {
  id: number;
  recipientId: number;
  campaignId: number | null;
  title: string;
  message: string;
  isRead: boolean;
  createdDate: string;
}

export const notificationApi = {
  /** Lấy danh sách thông báo của tôi */
  getMyNotifications: () =>
    api.get<NotificationItem[]>("/api/notifications").then((res) => res.data),

  /** Đếm số thông báo chưa đọc */
  getUnreadCount: () =>
    api.get<{ count: number }>("/api/notifications/unread-count").then((res) => res.data.count),

  /** Đánh dấu 1 thông báo đã đọc */
  markAsRead: (id: number) =>
    api.put<NotificationItem>(`/api/notifications/${id}/read`).then((res) => res.data),

  /** Đánh dấu tất cả thông báo đã đọc */
  markAllAsRead: () =>
    api.put("/api/notifications/read-all"),
};
