import { db } from "../db";
import createHttpError from "http-errors";
import { Request, Response, NextFunction } from "express";
import { eq, and, or, ilike, ne, inArray, desc, sql } from "drizzle-orm";
import {
  conversationsTable,
  conversationsParticipants,
  usersTable,
  conversationMessages
} from "../db/schema";

// Get all conversations with last message and participant details
export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    // First get user's conversations
    const userConversations = await db
      .select({ conversationId: conversationsParticipants.conversationId })
      .from(conversationsParticipants)
      .where(eq(conversationsParticipants.userId, userId));

    if (userConversations.length === 0) {
      return res.status(200).json({ success: true, conversations: [] });
    }

    const conversationIds = userConversations.map((c) => c.conversationId);

    // Get all participants for these conversations (excluding current user)
    const participants = await db
      .select({
        conversationId: conversationsParticipants.conversationId,
        userId: usersTable.id,
        userName: usersTable.fullName,
        userEmail: usersTable.email
      })
      .from(conversationsParticipants)
      .innerJoin(usersTable, eq(conversationsParticipants.userId, usersTable.id))
      .where(
        and(
          inArray(conversationsParticipants.conversationId, conversationIds),
          ne(usersTable.id, userId)
        )
      );

    // Get conversation details
    const convDetails = await db
      .select()
      .from(conversationsTable)
      .where(inArray(conversationsTable.id, conversationIds));

    // Get last messages for each conversation
    const lastMessages = await db
      .select({
        conversationId: conversationMessages.conversationId,
        id: conversationMessages.id,
        content: conversationMessages.content,
        messageType: conversationMessages.messageType,
        createdAt: conversationMessages.createdAt
      })
      .from(conversationMessages)
      .where(inArray(conversationMessages.conversationId, conversationIds))
      .orderBy(desc(conversationMessages.createdAt));

    // Build final response
    const grouped = conversationIds.map((convId) => {
      const conv = convDetails.find((c) => c.id === convId);
      const convParticipants = participants.filter((p) => p.conversationId === convId);
      const lastMsg = lastMessages.find((m) => m.conversationId === convId);

      return {
        id: convId,
        groupType: conv?.groupType || "individual",
        createdAt: conv?.createdAt || new Date(),
        participants: convParticipants.map((p) => ({
          id: p.userId,
          fullName: p.userName,
          email: p.userEmail
        })),
        lastMessage: lastMsg || null
      };
    });

    res.status(200).json({
      success: true,
      conversations: grouped
    });
  } catch (error) {
    next(error);
  }
};

// Check if conversation exists or create new one (smart endpoint)
export const getOrCreateConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { participantId } = req.body;

    if (!participantId) {
      throw createHttpError(400, "participantId is required");
    }

    if (participantId === userId) {
      throw createHttpError(400, "Cannot create conversation with yourself");
    }

    // Check if individual conversation already exists between these two users
    const user1Conversations = await db
      .select({ conversationId: conversationsParticipants.conversationId })
      .from(conversationsParticipants)
      .where(eq(conversationsParticipants.userId, userId));

    const user2Conversations = await db
      .select({ conversationId: conversationsParticipants.conversationId })
      .from(conversationsParticipants)
      .where(eq(conversationsParticipants.userId, participantId));

    // Find common conversations
    const commonConvIds = user1Conversations
      .filter((c1) => user2Conversations.some((c2) => c2.conversationId === c1.conversationId))
      .map((c) => c.conversationId);

    // Check if any is individual type
    if (commonConvIds.length > 0) {
      const [existingConv] = await db
        .select()
        .from(conversationsTable)
        .where(
          and(
            eq(conversationsTable.id, commonConvIds[0]),
            eq(conversationsTable.groupType, "individual")
          )
        )
        .limit(1);

      if (existingConv) {
        return res.status(200).json({
          success: true,
          message: "Conversation already exists",
          conversation: existingConv,
          isNew: false
        });
      }
    }

    // Create new conversation
    const [conversation] = await db
      .insert(conversationsTable)
      .values({ groupType: "individual" })
      .returning();

    // Add both participants
    await db.insert(conversationsParticipants).values([
      { conversationId: conversation.id, userId },
      { conversationId: conversation.id, userId: participantId }
    ]);

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      conversation,
      isNew: true
    });
  } catch (error) {
    next(error);
  }
};

// Get all users (except current user) with pagination and search

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Fetch paginated data
    const users = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        email: usersTable.email,
        createdAt: usersTable.createdAt
      })
      .from(usersTable)
      .where(ne(usersTable.id, userId))
      .limit(limit)
      .offset(offset);

    // Fetch total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(usersTable)
      .where(ne(usersTable.id, userId));

    // Send both results
    res.status(200).json({
      success: true,
      users,
      pagination: {
        total: Number(count),
        page,
        limit,
        hasMore: offset + users.length < count
      }
    });
  } catch (error) {
    next(error);
  }
};
