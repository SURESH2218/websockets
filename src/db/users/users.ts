import { InferSelectModel } from "drizzle-orm";
import { pgTable, varchar, uuid, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  fullName: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  refreshToken: varchar({ length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type SelectUser = InferSelectModel<typeof usersTable>;
export type RegisterUserInput = Omit<SelectUser, "id" | "createdAt" | "updatedAt" | "refreshToken">;
