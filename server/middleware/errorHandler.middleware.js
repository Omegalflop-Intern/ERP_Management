import { ApiError } from '../utils/http/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  console.error(`[Server Error] ${statusCode} - ${err.message}`, err.stack || err);

  const message = err instanceof ApiError
    ? err.message
    : (err.message || 'Internal Server Error');

  const errors = err.errors || [];

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
