// src/middlewares/globalErrorHandler.ts
import { ZodError } from "zod";
import config from "../config/config";
import createHttpError from "http-errors";
import { type Request, type Response, type NextFunction } from "express";

const globalErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = "Internal server error";
  let details = undefined;

  // Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message
    }));
  }
  // HTTP errors (from http-errors package)
  else if (createHttpError.isHttpError(err)) {
    statusCode = err.statusCode;
    message = err.message;
    details = (err as any).details;
  }
  // Generic errors
  else if (err instanceof Error) {
    message = err.message;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(config.ENV === "development" && err instanceof Error && { stack: err.stack })
  });
};

export default globalErrorHandler;
