import config from "./config";
import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { registerMessageHandlers } from "../socket/handlers/messageHandler";
import { socketAuthMiddleware, AuthenticatedSocket } from "../middlewares/socketAuth.middleware";

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.CLIENT_URL || "http://localhost:5173",
      credentials: true
    }
  });

  // Authentication middleware
  io.use(socketAuthMiddleware);

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.user!.userId;
    console.log(`User connected: ${userId}`);

    // Register event handlers
    registerMessageHandlers(io, socket);

    // Handle conversation room joining
    socket.on("join:conversation", (conversationId: string) => {
      socket.join(conversationId);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    socket.on("leave:conversation", (conversationId: string) => {
      socket.leave(conversationId);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};
