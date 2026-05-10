import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

const handleJwtInvalidSignature = () =>
  new ApiError('Invalid token, please sign in again..', 401);

const handleJwtExpired = () => new ApiError('Expired token, please sign in again..', 401);

const sendErrorDev = (
  err: { statusCode: number; status: string; message: string; stack?: string },
  res: import('express').Response
) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (
  err: { statusCode: number; status: string; message: string },
  res: import('express').Response
) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  let e: Error & { statusCode?: number; status?: string } = err;
  e.statusCode = e.statusCode || 500;
  e.status = e.status || 'error';

  if (err instanceof ZodError) {
    e = new ApiError(err.errors.map((x) => x.message).join(', '), 400);
  }

  if (err instanceof mongoose.Error.CastError) {
    e = new ApiError('Invalid ID format', 400);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const msgs = Object.values(err.errors)
      .map((el) => el.message)
      .join(', ');
    e = new ApiError(msgs, 400);
  }

  if (err.name === 'JsonWebTokenError') {
    e = handleJwtInvalidSignature();
  }
  if (err.name === 'TokenExpiredError') {
    e = handleJwtExpired();
  }

  if (err instanceof ApiError) {
    e = err;
  }

  const statusCode = e.statusCode ?? 500;
  const status = e.status ?? 'error';
  const message = e.message || 'Internal server error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev({ statusCode, status, message, stack: e.stack }, res);
  } else {
    sendErrorProd({ statusCode, status, message }, res);
  }
};
