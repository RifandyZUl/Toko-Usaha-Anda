/**
 * Custom Error Classes
 * Provides better error handling with proper status codes
 */

import { HTTP_STATUS } from '../constants/index.js'

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.name = this.constructor.name
    
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, HTTP_STATUS.BAD_REQUEST)
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, HTTP_STATUS.UNAUTHORIZED)
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, HTTP_STATUS.FORBIDDEN)
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, HTTP_STATUS.NOT_FOUND)
  }
}

/**
 * Method Not Allowed Error (405)
 */
export class MethodNotAllowedError extends AppError {
  constructor(message = 'Method not allowed') {
    super(message, HTTP_STATUS.METHOD_NOT_ALLOWED)
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, HTTP_STATUS.CONFLICT)
  }
}

/**
 * Validation Error / Unprocessable Entity (422)
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = {}) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY)
    this.errors = errors
  }
}

export class UnprocessableEntityError extends ValidationError {}

/**
 * Too Many Requests Error (429)
 */
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests. Please slow down and try again later.') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS)
  }
}

/**
 * Bad Gateway Error (502)
 */
export class BadGatewayError extends AppError {
  constructor(message = 'Bad gateway. Upstream service failed.') {
    super(message, HTTP_STATUS.BAD_GATEWAY)
  }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable. Please try again later.') {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE)
  }
}

/**
 * Gateway Timeout Error (504)
 */
export class GatewayTimeoutError extends AppError {
  constructor(message = 'Gateway timeout. Upstream request timed out.') {
    super(message, HTTP_STATUS.GATEWAY_TIMEOUT)
  }
}

