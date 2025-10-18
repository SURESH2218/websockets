import { type Request, type Response, type NextFunction } from "express";
import createHttpError from "http-errors";
import config from "../config/config";

const globalErrorHandler = (
  err: createHttpError.HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    error: {
      message: err.message,
      errorStack: config.ENV == "development" ? err.stack : "",
    },
  });
};

export default globalErrorHandler;
