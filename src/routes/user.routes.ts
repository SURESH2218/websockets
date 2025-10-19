import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
} from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);

// Protected routes
router.post("/logout", authenticate, logoutUser);

export default router;
