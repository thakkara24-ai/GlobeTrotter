import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

interface AppError extends Error {
  statusCode?: number;
  code?: number; // MongoDB duplicate key error code
  keyPattern?: Record<string, number>;
}

/**
 * Centralized error-handling middleware.
 * Converts known error types into a consistent JSON response.
 * Never exposes stack traces to the client.
 */
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // --- Zod validation errors ---
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
    return;
  }

  // --- Mongoose validation errors ---
  if (err.name === 'ValidationError' && err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
    return;
  }

  // --- MongoDB duplicate key error (code 11000) ---
  if (err.code === 11000 && err.keyPattern) {
    const field = Object.keys(err.keyPattern)[0];
    res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
    return;
  }

  // --- Mongoose CastError (invalid ObjectId, etc.) ---
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid resource identifier',
    });
    return;
  }

  // --- JWT errors ---
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token has expired',
    });
    return;
  }

  // --- Known application errors with statusCode ---
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 ? 'Internal server error' : err.message || 'Something went wrong';

  if (statusCode === 500) {
    console.error('Unhandled error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
