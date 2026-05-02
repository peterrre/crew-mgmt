import { prisma } from './db';
import type { Notification, Prisma } from '@prisma/client';

export async function createNotification(data: Prisma.NotificationUncheckedCreateInput): Promise<Notification> {
  return prisma.notification.create({ data });
}

export async function getUnreadNotifications(userId: string, limit = 50, offset = 0): Promise<Notification[]> {
  return prisma.notification.findMany({
    where: { userId, read: false },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

export async function markAsRead(notificationId: string): Promise<Notification> {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function deleteNotification(notificationId: string): Promise<Notification> {
  return prisma.notification.delete({
    where: { id: notificationId },
  });
}