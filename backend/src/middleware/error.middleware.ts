import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational error:', err);
    }
    return sendError(res, err.message, err.statusCode);
  }

  // Prisma known errors
  if (err.name === 'PrismaClientKnownRequestError') {
    logger.error('Database error:', err);
    return sendError(res, 'Database operation failed', 500);
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    return sendError(res, `File upload error: ${err.message}`, 400);
  }

  logger.error('Unhandled error:', err);
  return sendError(res, 'Internal server error', 500);
}
