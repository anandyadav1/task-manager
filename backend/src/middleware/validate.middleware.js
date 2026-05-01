import ApiError from '../utils/ApiError.js';

/**
 * Middleware factory for validating request data against a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Which part of the request to validate
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return next(ApiError.unprocessable('Validation failed', errors));
    }

    // Replace request data with parsed (and transformed) data
    req[source] = result.data;
    next();
  };
};

export default validate;
