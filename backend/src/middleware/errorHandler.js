/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle different error types
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    return res.status(400).json({
      error: true,
      message: 'Duplicate entry',
      detail: 'A record with this value already exists'
    });
  }

  if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({
      error: true,
      message: 'Invalid reference',
      detail: 'Referenced record does not exist'
    });
  }

  if (err.message && err.message.includes('no such table')) {
    return res.status(500).json({
      error: true,
      message: 'Database error',
      detail: 'Table not found - database may not be initialized'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: true,
    message: err.message || 'Internal server error',
    detail: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
