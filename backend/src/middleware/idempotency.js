/**
 * Idempotency Middleware
 * Prevents duplicate request execution for critical endpoints (e.g. order creation)
 */

import { HTTP_STATUS } from '../constants/index.js'

// In-memory cache for idempotency keys
// Key format: `${userId}:${idempotencyKey}`
const idempotencyCache = new Map()

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes TTL

/**
 * Periodically clean up expired idempotency keys
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of idempotencyCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      idempotencyCache.delete(key)
    }
  }
}, 60 * 1000).unref()

/**
 * Middleware to check and enforce idempotency key
 */
export const checkIdempotency = (req, res, next) => {
  const idempotencyKey = req.headers['x-idempotency-key'] || req.headers['idempotency-key']

  // If no idempotency key provided, proceed normally
  if (!idempotencyKey) {
    return next()
  }

  const cacheKey = `${req.userId || 'anon'}:${idempotencyKey}`
  const cached = idempotencyCache.get(cacheKey)

  if (cached) {
    // If request is currently processing, reject concurrent request
    if (cached.status === 'PROCESSING') {
      return res.status(HTTP_STATUS.CONFLICT).json({
        error: 'Transaksi sedang diproses. Mohon tunggu beberapa saat.',
      })
    }

    // If request completed previously, return cached response
    if (cached.status === 'COMPLETED') {
      return res.status(cached.statusCode).json(cached.body)
    }
  }

  // Mark key as PROCESSING
  idempotencyCache.set(cacheKey, {
    status: 'PROCESSING',
    timestamp: Date.now(),
  })

  // Intercept response json method to cache completion
  const originalJson = res.json.bind(res)
  res.json = (body) => {
    // Only cache successful or client error responses (don't cache 500 server errors)
    if (res.statusCode < 500) {
      idempotencyCache.set(cacheKey, {
        status: 'COMPLETED',
        statusCode: res.statusCode,
        body,
        timestamp: Date.now(),
      })
    } else {
      // Remove key if server error occurred so user can retry
      idempotencyCache.delete(cacheKey)
    }
    return originalJson(body)
  }

  next()
}
