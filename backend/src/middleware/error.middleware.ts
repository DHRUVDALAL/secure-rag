import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { sendError } from "../utils/response";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {

  // ============================================================
  // ZOD VALIDATION ERROR
  // ============================================================

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    logger.warn("Validation error:", details);

    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details,
    });
  }

  // ============================================================
  // CUSTOM APPLICATION ERRORS
  // ============================================================

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error("Non-operational error:", err);
    }

    return sendError(res, err.message, err.statusCode);
  }

  // ============================================================
  // PRISMA DATABASE ERRORS
  // ============================================================

  if (err.name === "PrismaClientKnownRequestError") {
    logger.error("Database error:", err);

    return sendError(res, "Database operation failed", 500);
  }

  // ============================================================
  // FILE UPLOAD ERRORS (MULTER)
  // ============================================================

  if (err.name === "MulterError") {
    return sendError(res, `File upload error: ${err.message}`, 400);
  }

  // ============================================================
  // UNKNOWN ERROR
  // ============================================================

  logger.error("Unhandled error:", err);

  return sendError(res, "Internal server error", 500);
}