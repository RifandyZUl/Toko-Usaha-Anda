/**
 * Global Error Handler Middleware
 * Handles all errors and returns appropriate responses
 */

import { HTTP_STATUS, PRISMA_ERROR } from '../constants/index.js'
import { AppError } from '../utils/errors.js'
import { logError } from '../utils/logger.js'

/**
 * Handle Prisma errors
 * @param {Error} err - Prisma error
 * @returns {Object|null} Formatted error response or null
 */
const handlePrismaError = (err) => {
  switch (err.code) {
    case PRISMA_ERROR.UNIQUE_CONSTRAINT:
      return {
        status: HTTP_STATUS.CONFLICT,
        message: 'This record already exists',
        field: err.meta?.target?.[0] || 'field',
      }
    
    case PRISMA_ERROR.RECORD_NOT_FOUND:
      return {
        status: HTTP_STATUS.NOT_FOUND,
        message: 'Record not found',
      }
    
    default:
      return null
  }
}

/**
 * Handle JWT errors
 * @param {Error} err - JWT error
 * @returns {Object|null} Formatted error response or null
 */
const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return {
      status: HTTP_STATUS.UNAUTHORIZED,
      message: 'Invalid authentication token',
    }
  }
  
  if (err.name === 'TokenExpiredError') {
    return {
      status: HTTP_STATUS.UNAUTHORIZED,
      message: 'Authentication token has expired',
    }
  }
  
  return null
}

/**
 * Global error handler
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log error
  logError('Request error', err, {
    method: req.method,
    path: req.path,
    userId: req.userId,
  })

  // Handle custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.errors && { errors: err.errors }),
    })
  }

  // Handle Prisma errors
  const prismaError = handlePrismaError(err)
  if (prismaError) {
    return res.status(prismaError.status).json({
      error: prismaError.message,
      ...(prismaError.field && { field: prismaError.field }),
    })
  }

  // Handle JWT errors
  const jwtError = handleJWTError(err)
  if (jwtError) {
    return res.status(jwtError.status).json({
      error: jwtError.message,
    })
  }

  // Handle validation errors
  if (err.name === 'ValidationError' || err.name === 'ZodError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Validation failed',
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    })
  }

  // Default error response — never expose internal details in production
  const isDev = process.env.NODE_ENV === 'development'
  const statusCode = err.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR

  // In production: always return a generic message for 5xx errors
  const message = statusCode >= 500 && !isDev
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Internal server error'

  res.status(statusCode).json({
    error: message,
    ...(isDev && { stack: err.stack }),
  })
}

