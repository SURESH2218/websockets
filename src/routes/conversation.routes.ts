// src/routes/conversation.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getMessages, sendMessage } from "../controllers/message.controller";
import {
  getConversations,
  getOrCreateConversation,
  createGroup,
  getUsers
} from "../controllers/conversation.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/users", getUsers);

// Conversation routes
router.get("/", getConversations);
router.post("/get-or-create", getOrCreateConversation);
router.post("/group", createGroup);

// Message routes
router.get("/:conversationId/messages", getMessages);
router.post("/:conversationId/messages", sendMessage);

export default router;
