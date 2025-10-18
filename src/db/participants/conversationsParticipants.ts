import { timestamp } from "drizzle-orm/pg-core";
import { pgTable, uuid } from "drizzle-orm/pg-core";
import { conversationsTable, usersTable } from "../schema";

export const conversationsParticipants = pgTable("conversations_participants", {
  id: uuid().primaryKey(),
  conversationId: uuid()
    .notNull()
    .references(() => conversationsTable.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
