/**
 * Logger Utility
 * Centralized logging with different log levels
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
}

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Format log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {any} data - Additional data to log
 * @returns {string} Formatted log message
 */
const formatLog = (level, message, data = null) => {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level}]`
  
  if (data) {
    return `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`
  }
  
  return `${prefix} ${message}`
}

/**
 * Log error
 * @param {string} message - Error message
 * @param {Error|any} error - Error object
 * @param {Object} context - Additional context
 */
export const logError = (message, error = null, context = {}) => {
  const errorData = {
    message,
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        stack: isDevelopment ? error.stack : undefined,
      },
    }),
    ...(Object.keys(context).length > 0 && { context }),
  }
  
  console.error(formatLog(LOG_LEVELS.ERROR, message, errorData))
}

/**
 * Log warning
 * @param {string} message - Warning message
 * @param {Object} data - Additional data
 */
export const logWarn = (message, data = {}) => {
  if (Object.keys(data).length > 0) {
    console.warn(formatLog(LOG_LEVELS.WARN, message, data))
  } else {
    console.warn(formatLog(LOG_LEVELS.WARN, message))
  }
}

/**
 * Log info
 * @param {string} message - Info message
 * @param {Object} data - Additional data
 */
export const logInfo = (message, data = {}) => {
  if (Object.keys(data).length > 0) {
    console.log(formatLog(LOG_LEVELS.INFO, message, data))
  } else {
    console.log(formatLog(LOG_LEVELS.INFO, message))
  }
}

/**
 * Log debug (only in development)
 * @param {string} message - Debug message
 * @param {Object} data - Additional data
 */
export const logDebug = (message, data = {}) => {
  if (isDevelopment) {
    if (Object.keys(data).length > 0) {
      console.log(formatLog(LOG_LEVELS.DEBUG, message, data))
    } else {
      console.log(formatLog(LOG_LEVELS.DEBUG, message))
    }
  }
}

/**
 * Request logger middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ...(req.headers.origin && { origin: req.headers.origin }),
      ...(req.userId && { userId: req.userId }),
    }
    
    if (res.statusCode >= 500) {
      logError('Request failed', null, logData)
    } else if (res.statusCode >= 400) {
      logWarn('Request warning', logData)
    } else {
      logDebug('Request completed', logData)
    }
  })
  
  next()
}

