import { Socket } from "socket.io";
import { ExtendedError } from "socket.io";
import { verifyAccessToken } from "../utils/generateTokens";
import { db } from "../db";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";

export interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    fullName: string;
  };
}

export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
) => {
  try {
    // Get token from handshake auth or cookies
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.cookie
        ?.split("; ")
        .find((c) => c.startsWith("accessToken="))
        ?.split("=")[1];

    if (!token) {
      return next(new Error("Authentication error: Token not found"));
    }

    const decoded = verifyAccessToken(token);

    const [user] = await db
      .select({
        userId: usersTable.id,
        email: usersTable.email,
        fullName: usersTable.fullName
      })
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId))
      .limit(1);

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
};
