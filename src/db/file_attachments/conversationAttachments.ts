import { conversationMessages } from "../schema";
import { pgTable, uuid, text, timestamp, bigint } from "drizzle-orm/pg-core";

export const conversationAttachments = pgTable("conversation_attachments", {
  id: uuid().primaryKey().defaultRandom(),
  messageId: uuid().references(() => conversationMessages.id),
  url: text(),
  fileType: text(),
  fileSize: bigint({ mode: "number" }),
  createdAt: timestamp("created_at").defaultNow()
});
