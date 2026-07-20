import { ApiError } from '../utils/http/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  let message;
  if (err instanceof ApiError) {
    message = err.message;
  } else if (isDev) {
    message = err.message || 'Internal Server Error';
  } else {
    message = 'Internal Server Error';
  }

  const errors = err.errors || [];

  if (isDev) {
    console.error(`[Error] ${statusCode} - ${err.message}`);
    if (errors.length) console.error('Errors:', errors);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(isDev && { stack: err.stack }),
  });
};
