export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';

  // Database connection errors
  if (err.message?.includes('connection') || err.message?.includes('closed')) {
    return res.status(503).json({
      error: 'Database temporarily unavailable',
      code: 'DB_CONNECTION_ERROR',
      statusCode: 503
    });
  }

  // Validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: err.errors
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
      statusCode: 401
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
      statusCode: 401
    });
  }

  // Prisma errors
  if (err.code?.startsWith('P')) {
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Resource not found',
        code: 'NOT_FOUND',
        statusCode: 404
      });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'Unique constraint violation',
        code: 'DUPLICATE_ENTRY',
        statusCode: 409
      });
    }
  }

  // Custom app errors
  if (err instanceof AppError) {
    return res.status(statusCode).json({
      error: message,
      code,
      statusCode
    });
  }

  // Generic error
  console.error('Unhandled error:', err);
  res.status(statusCode).json({
    error: message,
    code,
    statusCode
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
