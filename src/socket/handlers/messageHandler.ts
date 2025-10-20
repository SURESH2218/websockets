import { db } from "../../db";
import { and, eq } from "drizzle-orm";
import { Server } from "socket.io";
import { AuthenticatedSocket } from "../../middlewares/socketAuth.middleware";
import { conversationMessages, conversationsParticipants, usersTable } from "../../db/schema";

interface SendMessageData {
  conversationId: string;
  content: string;
  messageType: "text" | "image" | "file" | "mixed";
}

export const registerMessageHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user!.userId;

  socket.on("send:message", async (data: SendMessageData) => {
    try {
      const { conversationId, content, messageType } = data;

      // Verify user is participant
      const [participant] = await db
        .select()
        .from(conversationsParticipants)
        .where(
          and(
            eq(conversationsParticipants.conversationId, conversationId),
            eq(conversationsParticipants.userId, userId)
          )
        )
        .limit(1);

      if (!participant) {
        socket.emit("error", { message: "Not a participant of this conversation" });
        return;
      }

      // Get user details
      const [user] = await db
        .select({ fullName: usersTable.fullName, email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      const tempId = `temp_${Date.now()}_${socket.id}`;

      // Emit immediately to all participants (including sender)
      io.to(conversationId).emit("message:new", {
        id: tempId,
        conversationId,
        content,
        messageType: messageType || "text",
        senderId: userId,
        senderName: user.fullName,
        senderEmail: user.email,
        createdAt: new Date()
      });

      // Save to DB (don't await - fire and forget with error handling)
      db.insert(conversationMessages)
        .values({
          conversationId,
          content,
          messageType: messageType || "text",
          senderId: userId
        })
        .returning()
        .then(([message]) => {
          // Send delivery confirmation with actual DB ID
          io.to(conversationId).emit("message:delivered", {
            tempId,
            actualId: message.id
          });
        })
        .catch((error) => {
          console.error("Error saving message:", error);
          socket.emit("error", {
            message: "Failed to save message",
            tempId
          });
        });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });
};
