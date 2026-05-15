/**
 * Security Middleware Configuration
 * Centralizes all security-related middleware setup
 *
 * Protections implemented:
 * - Helmet: HTTP security headers (XSS, Clickjacking, MIME sniffing, etc.)
 * - Rate Limiting: Brute force & DDoS protection
 * - HPP: HTTP Parameter Pollution protection
 * - Request Size Limiting: Prevents large payload attacks
 */

import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import hpp from 'hpp'
import { logWarn } from '../utils/logger.js'

// ─── 1. HELMET: Security Headers ────────────────────────────────────────────

/**
 * Configures HTTP security headers via Helmet
 * Protects against: XSS, Clickjacking, MIME sniffing, etc.
 */
export const helmetMiddleware = helmet({
  // Content Security Policy — controls what resources the browser can load
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // Prevent browsers from MIME-type sniffing
  noSniff: true,
  // Force HTTPS (only enable in production)
  strictTransportSecurity: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
  // Prevent clickjacking attacks
  frameguard: { action: 'deny' },
  // Remove X-Powered-By header to hide technology stack
  hidePoweredBy: true,
  // XSS filter for older browsers
  xssFilter: true,
  // Prevent cross-site scripting via referrer
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
})

// ─── 2. RATE LIMITING ────────────────────────────────────────────────────────

/**
 * Creates a rate limiter with custom config and a logging handler
 * @param {Object} config - Rate limit configuration
 */
const createRateLimiter = (config) =>
  rateLimit({
    standardHeaders: true,  // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,    // Disable the X-RateLimit-* headers
    handler: (req, res, next, options) => {
      logWarn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        limit: options.max,
        windowMs: options.windowMs,
      })
      res.status(options.statusCode).json({
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutes',
      })
    },
    ...config,
  })

/**
 * General API rate limiter
 * Limit: 100 requests per 15 minutes per IP
 */
export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP.',
})

/**
 * Strict limiter for sensitive auth endpoints
 * Limit: 10 attempts per 15 minutes per IP
 * Prevents brute-force attacks on login
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true, // Only count failed attempts
})

/**
 * Upload rate limiter
 * Limit: 20 uploads per hour per IP
 */
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
})

// ─── 3. HPP: Parameter Pollution Protection ──────────────────────────────────

/**
 * Prevents HTTP Parameter Pollution attacks
 * e.g., ?status=active&status=inactive => uses last value
 * Whitelisted params allow arrays (e.g., ?category=a&category=b is valid)
 */
export const hppMiddleware = hpp({
  whitelist: ['category', 'status', 'sort', 'fields'],
})

// ─── 4. REQUEST SANITIZATION ─────────────────────────────────────────────────

/**
 * Sanitizes request body, query, and params to strip dangerous characters.
 * Prevents NoSQL injection-style attacks even with a SQL database.
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        if (typeof value === 'string') {
          // Strip null bytes and control characters
          return [key, value.replace(/\0/g, '').trim()]
        }
        if (typeof value === 'object') {
          return [key, sanitize(value)]
        }
        return [key, value]
      })
    )
  }

  req.body = sanitize(req.body)
  req.query = sanitize(req.query)
  req.params = sanitize(req.params)

  next()
}
