import { db } from "../db";
import { eq, desc, and } from "drizzle-orm";
import createHttpError from "http-errors";
import { Request, Response, NextFunction } from "express";
import { conversationMessages, conversationsParticipants, usersTable } from "../db/schema";

// Get messages with sender details
export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Check if user is participant
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
      throw createHttpError(403, "You are not a participant of this conversation");
    }

    // Get messages with sender info
    const messages = await db
      .select({
        id: conversationMessages.id,
        conversationId: conversationMessages.conversationId,
        content: conversationMessages.content,
        messageType: conversationMessages.messageType,
        createdAt: conversationMessages.createdAt,
        senderId: usersTable.id,
        senderName: usersTable.fullName,
        senderEmail: usersTable.email
      })
      .from(conversationMessages)
      .innerJoin(usersTable, eq(conversationMessages.senderId, usersTable.id))
      .where(eq(conversationMessages.conversationId, conversationId))
      .orderBy(desc(conversationMessages.createdAt))
      .limit(limit)
      .offset(offset);

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        limit,
        offset,
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    next(error);
  }
};

// Send message via HTTP (for file uploads) - Optimized
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { conversationId } = req.params;
    const { content, messageType } = req.body;

    // Check if user is participant
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
      throw createHttpError(403, "You are not a participant of this conversation");
    }

    // Get user details for socket emission
    const [user] = await db
      .select({ fullName: usersTable.fullName, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const io = req.app.get("io");
    const tempId = `temp_${Date.now()}`;

    // Emit immediately for instant UI feedback
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

    // Save to DB in parallel (don't block response)
    const dbPromise = db
      .insert(conversationMessages)
      .values({
        conversationId,
        content,
        messageType: messageType || "text",
        senderId: userId
      })
      .returning();

    // Wait for DB to complete
    const [message] = await dbPromise;

    // Send actual ID confirmation
    io.to(conversationId).emit("message:delivered", {
      tempId,
      actualId: message.id
    });

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    next(error);
  }
};
