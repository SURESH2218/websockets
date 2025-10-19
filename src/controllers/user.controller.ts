import { db } from "../db";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { usersTable } from "../db/schema";
import createHttpError from "http-errors";
import { Request, Response, NextFunction } from "express";
import { UserRegisterSchema, UserLoginSchema } from "../validations/user.validation";
import {
  generateTokens,
  setTokenCookies,
  clearTokenCookies,
  verifyRefreshToken
} from "../utils/generateTokens";

// Register new user
const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Just parse - let global error handler handle validation errors
    const { fullName, email, password } = UserRegisterSchema.parse(req.body);

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw createHttpError(400, "Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [insertedUser] = await db
      .insert(usersTable)
      .values({ fullName, email, password: hashedPassword })
      .returning();

    const { accessToken, refreshToken } = generateTokens({
      userId: insertedUser.id,
      email: insertedUser.email
    });

    await db.update(usersTable).set({ refreshToken }).where(eq(usersTable.id, insertedUser.id));

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: insertedUser.id,
        fullName: insertedUser.fullName,
        email: insertedUser.email
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = UserLoginSchema.parse(req.body);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (!user) {
      throw createHttpError(401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createHttpError(401, "Invalid email or password");
    }

    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email
    });

    await db.update(usersTable).set({ refreshToken }).where(eq(usersTable.id, user.id));

    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

// Logout user
const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (userId) {
      await db.update(usersTable).set({ refreshToken: null }).where(eq(usersTable.id, userId));
    }

    clearTokenCookies(res);

    res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    next(error);
  }
};

// Refresh access token
const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw createHttpError(401, "Refresh token not found");
    }

    const decoded = verifyRefreshToken(refreshToken);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId))
      .limit(1);

    if (!user || user.refreshToken !== refreshToken) {
      throw createHttpError(401, "Invalid refresh token");
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email
    });

    await db
      .update(usersTable)
      .set({ refreshToken: tokens.refreshToken })
      .where(eq(usersTable.id, user.id));

    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully"
    });
  } catch (error) {
    next(error);
  }
};

export { registerUser, loginUser, logoutUser, refreshAccessToken };
