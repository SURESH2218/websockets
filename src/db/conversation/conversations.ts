import { usersTable } from "../schema";
import { pgTable, uuid, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const groupTypeEnum = pgEnum("group_type", ["individual", "group"]);

export const conversationsTable = pgTable("conversations", {
  id: uuid().primaryKey(),
  groupAdmin: uuid("user_id").references(() => usersTable.id),
  groupType: groupTypeEnum().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
