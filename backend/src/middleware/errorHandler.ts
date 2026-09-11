import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred on the server';

  logger.error(`[HTTP ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`, {
    stack: err.stack,
    code,
  });

  return res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
};
