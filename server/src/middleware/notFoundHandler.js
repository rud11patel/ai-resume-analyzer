/**
 * Handles 404 Not Found for unmatched routes.
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: {
      message: error.message,
      statusCode: 404,
    },
  });
}

module.exports = notFoundHandler;
