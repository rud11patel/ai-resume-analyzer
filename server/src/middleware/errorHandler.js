/**
 * Centralized error handling middleware.
 * Prevents leaking stack traces or internal implementation details in production.
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'An unexpected error occurred';
  const isProduction = process.env.NODE_ENV === 'production';

  // Handle Multer specific errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = 'Uploaded file exceeds the maximum permitted size limit.';
    } else {
      statusCode = 400;
      message = `File upload error: ${err.message}`;
    }
  }

  // Handle Mongoose duplicate key errors (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}. A record with this value already exists.`;
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for resource identifier '${err.value}'.`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(' ');
  }

  // Log error details to server console
  console.error(`[Error] ${req.method} ${req.url} - ${statusCode} - ${message}`);
  if (!isProduction && err.stack) {
    console.error(err.stack);
  }

  const response = {
    success: false,
    error: {
      message: isProduction && statusCode === 500 
        ? 'Internal Server Error' 
        : message,
      statusCode,
    },
  };

  // Only include stack trace in non-production environments for debugging
  if (!isProduction && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
