import { conversationsTable, usersTable } from "../schema";
import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";

export const MessageType = pgEnum("message_type", ["text", "image", "file", "mixed"]);

export const conversationMessages = pgTable("conversation_messages", {
  id: uuid().primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversationsTable.id),
  content: text(),
  senderId: uuid("sender_id").references(() => usersTable.id),
  messageType: MessageType(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
