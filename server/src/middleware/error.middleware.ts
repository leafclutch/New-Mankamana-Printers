import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

// globalErrorHandler: Catch-all middleware to handle all errors and return a consistent JSON response
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Prisma unique constraint violation → friendly 400
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = Array.isArray(err.meta?.target) ? (err.meta.target as string[]).join(', ') : 'field';
      return res.status(400).json({
        status: 'fail',
        message: `This ${field} is already in use. Please use a different value.`,
      });
    }
    // Record not found (e.g. update/delete on non-existent row)
    if (err.code === 'P2025') {
      return res.status(404).json({
        status: 'fail',
        message: 'Record not found.',
      });
    }
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err.statusCode === 500) {
    console.error('ERROR ', err);
  } else {
    console.warn(`Error ${err.statusCode}: ${err.message}`);
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};