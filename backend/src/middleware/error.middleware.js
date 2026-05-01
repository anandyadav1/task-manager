import ApiError from '../utils/ApiError.js';

/**
 * Global error handling middleware.
 * Catches all errors thrown in routes and middleware.
 */
const errorHandler = (err, req, res, _next) => {
  let error = err;

  // If not an ApiError, wrap it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors.length > 0 && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  // Log errors in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`❌ [${error.statusCode}] ${error.message}`);
    if (error.stack && error.statusCode === 500) {
      console.error(error.stack);
    }
  }

  // Prisma-specific error handling
  if (err.code === 'P2002') {
    response.statusCode = 409;
    response.message = `Duplicate value for field: ${err.meta?.target?.join(', ')}`;
  } else if (err.code === 'P2025') {
    response.statusCode = 404;
    response.message = 'Record not found';
  } else if (err.code === 'P2003') {
    response.statusCode = 400;
    response.message = 'Related record not found (foreign key constraint)';
  }

  res.status(response.statusCode).json(response);
};

export default errorHandler;
