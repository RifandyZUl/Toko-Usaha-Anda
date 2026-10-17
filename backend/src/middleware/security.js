/**
 * Security Middleware Configuration
 * Centralized security policies for the Express application.
 *
 * Implements:
 * 1.  Strict Security Headers (Helmet) with CSP
 * 2.  Rate Limiting (General, Auth, Upload)
 * 3.  Data Sanitization (XSS, NoSQL/SQL operator stripping)
 * 4.  HTTP Parameter Pollution protection
 */

import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import hpp from 'hpp'
import mongoSanitize from 'express-mongo-sanitize'

// ─── Security Headers (Helmet) ────────────────────────────────────────────────

/**
 * Configure Helmet with strict Content Security Policy (CSP)
 * CSP prevents XSS by controlling which resources can be loaded/executed.
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"], // Add trusted CDNs if needed
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.supabase.co"], // Allow Supabase images
      connectSrc: ["'self'", "https://*.supabase.co"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
})

// ─── Rate Limiting ──────────────────────────────────────────────────────────

/**
 * General API rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 100, // limit each IP to 10000 in development, 100 in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
})

/**
 * Strict limiter for sensitive auth routes (Login/Register)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 10, // 1000 attempts in development, 10 in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts, please try again after 15 minutes',
  },
})

/**
 * Limiter for file uploads to prevent storage exhaustion
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Upload limit reached, please try зgain after an hour',
  },
})

// ─── Data Sanitization ───────────────────────────────────────────────────────

/**
 * Deep Sanitization Middleware
 * 1. Strips MongoDB-style operators ($, .) which can also affect other DBs/logics
 * 2. Custom XSS filtering for body/query/params
 */
export const sanitizeInput = (req, res, next) => {
  // Use mongoSanitize to strip $ and . from req.body, req.query, etc.
  mongoSanitize()(req, res, () => {
    // Custom XSS Sanitization:
    // Recursively strip HTML tags from strings in the request object
    const clean = (val) => {
      if (typeof val === 'string') {
        // Remove <script> tags and other basic HTML tags
        // Note: express-validator handles fine-grained escaping at route level
        return val.replace(/<[^>]*>?/gm, '')
      }
      if (typeof val === 'object' && val !== null) {
        Object.keys(val).forEach((key) => {
          val[key] = clean(val[key])
        })
      }
      return val
    }

    if (req.body) req.body = clean(req.body)
    if (req.query) req.query = clean(req.query)
    if (req.params) req.params = clean(req.params)

    next()
  })
}

// ─── Parameter Pollution ─────────────────────────────────────────────────────

/**
 * Prevent HTTP Parameter Pollution
 * e.g., /api/products?color=red&color=blue -> will only take one or handle as array safely
 */
export const hppMiddleware = hpp()
