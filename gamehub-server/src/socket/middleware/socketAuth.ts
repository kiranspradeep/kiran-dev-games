import { Socket } from "socket.io";
import { verifyAccessToken } from "../../lib/jwt";
import { extractBearerToken } from "../../lib/jwt";
import prisma from "../../lib/prisma";

export interface AuthenticatedSocket extends Socket {
  userId:      string;
  username:    string;
  displayName: string;
  avatarUrl:   string | null;
  level:       number;
}

// ── Authenticate socket connections ───────────────────────────────────────────
export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    const token =
      socket.handshake.auth?.token ||
      extractBearerToken(socket.handshake.headers.authorization);

    if (!token) {
      next(new Error("AUTH_REQUIRED"));
      return;
    }

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id:          true,
        username:    true,
        displayName: true,
        avatarUrl:   true,
        level:       true,
        status:      true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      next(new Error("AUTH_INVALID"));
      return;
    }

    // Attach to socket
    const authSocket = socket as AuthenticatedSocket;
    authSocket.userId      = user.id;
    authSocket.username    = user.username;
    authSocket.displayName = user.displayName;
    authSocket.avatarUrl   = user.avatarUrl;
    authSocket.level       = user.level;

    next();
  } catch {
    next(new Error("AUTH_FAILED"));
  }
}