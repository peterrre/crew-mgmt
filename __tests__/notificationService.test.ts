// Mock dependencies first
jest.mock('@/lib/db', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Then import the mocked prisma and the service functions
import { prisma } from '@/lib/db';
import {
  createNotification,
  getUnreadNotifications,
  markAsRead,
  deleteNotification,
} from '@/lib/notificationService';

describe('notificationService', () => {
  const mockUserId = 'user-1';
  const mockNotificationId = 'notification-1';
  const mockNotificationData = {
    id: mockNotificationId,
    userId: mockUserId,
    title: 'Test Notification',
    body: 'This is a test notification',
    read: false,
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotificationData);

      const result = await createNotification(mockNotificationData);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: mockNotificationData,
      });
      expect(result).toEqual(mockNotificationData);
    });
  });

  describe('getUnreadNotifications', () => {
    it('should get unread notifications for a user', async () => {
      const mockNotifications = [mockNotificationData];
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);

      const result = await getUnreadNotifications(mockUserId);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, read: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should respect limit and offset parameters', async () => {
      const mockNotifications = [mockNotificationData];
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);

      await getUnreadNotifications(mockUserId, 10, 5);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, read: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 5,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const updatedNotification = { ...mockNotificationData, read: true };
      (prisma.notification.update as jest.Mock).mockResolvedValue(updatedNotification);

      const result = await markAsRead(mockNotificationId);

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: mockNotificationId },
        data: { read: true },
      });
      expect(result).toEqual(updatedNotification);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      (prisma.notification.delete as jest.Mock).mockResolvedValue(mockNotificationData);

      const result = await deleteNotification(mockNotificationId);

      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: mockNotificationId },
      });
      expect(result).toEqual(mockNotificationData);
    });
  });
});