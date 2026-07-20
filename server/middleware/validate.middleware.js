import { ApiError } from '../utils/http/ApiError.js';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        throw ApiError.badRequest('Validation failed', errors);
      }
      req.body = parsed.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};
