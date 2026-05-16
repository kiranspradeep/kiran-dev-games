import prisma from "../lib/prisma";
import { NotificationType } from "@prisma/client";
import { Errors } from "../middleware/errorHandler";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// ── Create a notification ─────────────────────────────────────────────────────
export async function createNotification(
  input: CreateNotificationInput
) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? {},
    },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      data: true,
      isRead: true,
      createdAt: true,
    },
  });
}

// ── Get notifications for a user ──────────────────────────────────────────────
export async function getUserNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number; offset?: number }
) {
  const { unreadOnly = false, limit = 20, offset = 0 } = options ?? {};

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        data: true,
        isRead: true,
        createdAt: true,
        readAt: true,
      },
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return { notifications, unreadCount };
}

// ── Mark as read ──────────────────────────────────────────────────────────────
export async function markAsRead(
  userId: string,
  notificationIds: string[]
) {
  await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

// ── Mark all as read ──────────────────────────────────────────────────────────
export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

// ── Delete a notification ─────────────────────────────────────────────────────
export async function deleteNotification(
  userId: string,
  notificationId: string
) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true },
  });

  if (!notification) throw Errors.notFound("Notification");
  if (notification.userId !== userId) throw Errors.forbidden();

  await prisma.notification.delete({ where: { id: notificationId } });
}

// ── Clear all read notifications ──────────────────────────────────────────────
export async function clearReadNotifications(userId: string) {
  await prisma.notification.deleteMany({
    where: { userId, isRead: true },
  });
}

// ── Get unread count only ─────────────────────────────────────────────────────
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}