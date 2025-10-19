import createHttpError from "http-errors";
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/generateTokens";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from cookies
    const { accessToken } = req.cookies;

    if (!accessToken) {
      return next(createHttpError(401, "Access token not found. Please login."));
    }

    // Verify token
    const decoded = verifyAccessToken(accessToken);

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TokenExpiredError") {
        return next(createHttpError(401, "Access token expired. Please refresh."));
      }
      if (error.name === "JsonWebTokenError") {
        return next(createHttpError(401, "Invalid access token."));
      }
    }
    next(createHttpError(401, "Authentication failed."));
  }
};
