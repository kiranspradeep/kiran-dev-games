import prisma from "../lib/prisma";
import { FriendshipStatus } from "@prisma/client";
import { Errors } from "../middleware/errorHandler";
import { createNotification } from "./notification.service";
import { awardXp } from "./user.service";

// ── Send friend request ───────────────────────────────────────────────────────
export async function sendFriendRequest(
  senderId: string,
  receiverUsername: string
) {
  const receiver = await prisma.user.findUnique({
    where: { username: receiverUsername },
    select: { id: true, username: true, displayName: true, status: true },
  });

  if (!receiver) throw Errors.notFound("Player");
  if (receiver.status !== "ACTIVE") throw Errors.notFound("Player");
  if (receiver.id === senderId) {
    throw Errors.badRequest("You cannot add yourself as a friend");
  }

  // Check for existing friendship
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId, receiverId: receiver.id },
        { senderId: receiver.id, receiverId: senderId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      throw Errors.conflict("Already friends");
    }
    if (existing.status === "PENDING") {
      throw Errors.conflict("Friend request already sent");
    }
    if (existing.status === "BLOCKED") {
      throw Errors.forbidden("Cannot send friend request");
    }
  }

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { displayName: true, username: true },
  });

  const friendship = await prisma.friendship.create({
    data: { senderId, receiverId: receiver.id, status: "PENDING" },
  });

  // Notify receiver
  await createNotification({
    userId: receiver.id,
    type: "FRIEND_REQUEST",
    title: "Friend Request",
    body: `${sender?.displayName ?? "Someone"} wants to be your friend`,
    data: { senderId, senderUsername: sender?.username },
  });

  return friendship;
}

// ── Accept friend request ─────────────────────────────────────────────────────
export async function acceptFriendRequest(
  userId: string,
  friendshipId: string
) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
    include: {
      sender: {
        select: { id: true, displayName: true, username: true },
      },
      receiver: {
        select: { id: true, displayName: true, username: true },
      },
    },
  });

  if (!friendship) throw Errors.notFound("Friend request");
  if (friendship.receiverId !== userId) throw Errors.forbidden();
  if (friendship.status !== "PENDING") {
    throw Errors.badRequest("Request already handled");
  }

  const updated = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: "ACCEPTED" },
  });

  // Award XP to both
  await Promise.all([
    awardXp(friendship.senderId, "FRIEND_ADDED"),
    awardXp(friendship.receiverId, "FRIEND_ADDED"),
  ]);

  // Notify sender
  await createNotification({
    userId: friendship.senderId,
    type: "FRIEND_ACCEPTED",
    title: "Friend Request Accepted",
    body: `${friendship.receiver.displayName} accepted your friend request`,
    data: {
      receiverId: friendship.receiverId,
      receiverUsername: friendship.receiver.username,
    },
  });

  return updated;
}

// ── Decline / cancel friend request ──────────────────────────────────────────
export async function declineFriendRequest(
  userId: string,
  friendshipId: string
) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
    select: {
      senderId: true,
      receiverId: true,
      status: true,
    },
  });

  if (!friendship) throw Errors.notFound("Friend request");

  const isInvolved =
    friendship.senderId === userId || friendship.receiverId === userId;

  if (!isInvolved) throw Errors.forbidden();

  await prisma.friendship.delete({ where: { id: friendshipId } });
}

// ── Remove friend ─────────────────────────────────────────────────────────────
export async function removeFriend(userId: string, friendId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
      status: "ACCEPTED",
    },
  });

  if (!friendship) throw Errors.notFound("Friendship");

  await prisma.friendship.delete({ where: { id: friendship.id } });
}

// ── Get friends list ──────────────────────────────────────────────────────────
export async function getFriends(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { senderId: userId, status: "ACCEPTED" },
        { receiverId: userId, status: "ACCEPTED" },
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          level: true,
          lastSeenAt: true,
        },
      },
      receiver: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          level: true,
          lastSeenAt: true,
        },
      },
    },
  });

  return friendships.map((f) => {
    const friend = f.senderId === userId ? f.receiver : f.sender;
    return {
      friendshipId: f.id,
      ...friend,
    };
  });
}

// ── Get pending requests ──────────────────────────────────────────────────────
export async function getPendingRequests(userId: string) {
  const [received, sent] = await Promise.all([
    prisma.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: { senderId: userId, status: "PENDING" },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    received: received.map((f) => ({
      friendshipId: f.id,
      ...f.sender,
      createdAt: f.createdAt,
    })),
    sent: sent.map((f) => ({
      friendshipId: f.id,
      ...f.receiver,
      createdAt: f.createdAt,
    })),
  };
}

// ── Get friendship status between two users ───────────────────────────────────
export async function getFriendshipStatus(
  userId: string,
  otherUserId: string
): Promise<{
  status: FriendshipStatus | "NONE";
  friendshipId: string | null;
  isSender: boolean;
}> {
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    select: { id: true, status: true, senderId: true },
  });

  if (!friendship) {
    return { status: "NONE", friendshipId: null, isSender: false };
  }

  return {
    status: friendship.status,
    friendshipId: friendship.id,
    isSender: friendship.senderId === userId,
  };
}