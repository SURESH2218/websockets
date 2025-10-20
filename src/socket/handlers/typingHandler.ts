import { Server } from "socket.io";
import { AuthenticatedSocket } from "../../middlewares/socketAuth.middleware";

export const registerTypingHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user!.userId;

  socket.on("typing:start", async (conversationId: string) => {
    try {
      // Broadcast to others in conversation (exclude sender)
      socket.to(conversationId).emit("user:typing", {
        conversationId,
        userId,
        fullName: socket.user!.fullName
      });
    } catch (error) {
      console.error("Error handling typing start:", error);
    }
  });

  socket.on("typing:stop", (conversationId: string) => {
    socket.to(conversationId).emit("user:typing", {
      conversationId,
      userId,
      fullName: null
    });
  });
};
