/**
 * Async Wrapper Utility
 * Eliminates the need for try-catch blocks in controllers
 */

/**
 * Wraps an async function and passes errors to the next middleware
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
