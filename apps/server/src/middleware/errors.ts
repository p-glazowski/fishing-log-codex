import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { env } from '../config/env.js';
import { HttpError } from './security.js';
export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check the submitted fields',
        details: error.flatten(),
      },
    });
    return;
  }
  if (error instanceof multer.MulterError) {
    res.status(400).json({
      error: {
        code: 'UPLOAD_ERROR',
        message:
          error.code === 'LIMIT_FILE_SIZE' ? 'Images must be 5 MB or smaller' : error.message,
      },
    });
    return;
  }
  if ((error as { code?: number })?.code === 11000) {
    res
      .status(409)
      .json({ error: { code: 'CONFLICT', message: 'This email address is already registered' } });
    return;
  }
  if (res.headersSent) {
    _next(error);
    return;
  }
  const parserStatus =
    (error as { type?: string }).type === 'entity.parse.failed'
      ? 400
      : (error as { type?: string }).type === 'entity.too.large'
        ? 413
        : undefined;
  const status = error instanceof HttpError ? error.status : (parserStatus ?? 500);
  if (status === 500 && env.NODE_ENV !== 'test') console.error(error);
  res.status(status).json({
    error: {
      code: status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
      message:
        status === 500
          ? 'Something went wrong. Please try again.'
          : parserStatus
            ? 'Invalid or oversized JSON request'
            : (error as Error).message,
    },
  });
};
