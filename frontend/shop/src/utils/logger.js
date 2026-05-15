/**
 * Logger Utility
 * Centralized logging with environment-based control
 */

const isDevelopment = import.meta.env.DEV

/**
 * Log info message (only in development)
 * @param {string} message - Log message
 * @param {*} data - Optional data to log
 */
export const logInfo = (message, data = null) => {
  if (isDevelopment) {
    if (data) {
      console.log(`[INFO] ${message}`, data)
    } else {
      console.log(`[INFO] ${message}`)
    }
  }
}

/**
 * Log error message (always logged)
 * @param {string} message - Log message
 * @param {Error|*} error - Error object or data
 */
export const logError = (message, error = null) => {
  if (error) {
    console.error(`[ERROR] ${message}`, error)
  } else {
    console.error(`[ERROR] ${message}`)
  }
}

/**
 * Log warning message (only in development)
 * @param {string} message - Log message
 * @param {*} data - Optional data to log
 */
export const logWarn = (message, data = null) => {
  if (isDevelopment) {
    if (data) {
      console.warn(`[WARN] ${message}`, data)
    } else {
      console.warn(`[WARN] ${message}`)
    }
  }
}

/**
 * Log debug message (only in development)
 * @param {string} message - Log message
 * @param {*} data - Optional data to log
 */
export const logDebug = (message, data = null) => {
  if (isDevelopment) {
    if (data) {
      console.debug(`[DEBUG] ${message}`, data)
    } else {
      console.debug(`[DEBUG] ${message}`)
    }
  }
}

