import { registerUser } from "../controllers/user.controller";
import { Router } from "express";

const router = Router();

router.use("/register", registerUser);

export default router;
