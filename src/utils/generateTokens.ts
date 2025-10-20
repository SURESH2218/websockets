import jwt from "jsonwebtoken";
import { Response } from "express";
import config from "../config/config";

interface TokenPayload {
  userId: string;
  email: string;
}

interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
}

//   Generate access and refresh tokens
export const generateTokens = (payload: TokenPayload): GeneratedTokens => {
  const accessToken = jwt.sign(payload, config.ACCESS_TOKEN_SECRET, { expiresIn: "60m" });

  const refreshToken = jwt.sign(payload, config.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

  return { accessToken, refreshToken };
};

//  Set tokens as HTTP-only cookies
export const setTokenCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  const isProduction = config.ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 15 * 60 * 1000,
    path: "/"
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
  });
};

// Clear authentication cookies (for logout)
export const clearTokenCookies = (res: Response): void => {
  const isProduction = config.ENV === "production";

  res.cookie("accessToken", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 0,
    path: "/"
  });

  res.cookie("refreshToken", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 0,
    path: "/"
  });
};

// Verify access token
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.ACCESS_TOKEN_SECRET) as TokenPayload;
};

// Verify refresh token
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.REFRESH_TOKEN_SECRET) as TokenPayload;
};
