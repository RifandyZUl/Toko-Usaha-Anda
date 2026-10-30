/**
 * Express Server Configuration
 * Main entry point for the backend API
 *
 * Middleware order (important!):
 * 1. Security headers (Helmet)
 * 2. CORS
 * 3. Request logging
 * 4. Body parsing + size limits
 * 5. HPP + input sanitization
 * 6. General rate limiter
 * 7. Static files
 * 8. Routes
 * 9. 404 handler
 * 10. Global error handler
 */

// ── MUST be first: loads .env and validates required variables ─────────────────
import { validateEnv } from './config/env.js'
validateEnv()

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import cartRoutes from './routes/cart.js'
import orderRoutes from './routes/orders.js'
import uploadRoutes from './routes/upload.js'
import paymentRoutes from './routes/payment.js'
import locationRoutes from './routes/location.js'
import shippingRoutes from './routes/shipping.js'
import webhookRoutes from './routes/webhook.js'
import contactRoutes from './routes/contact.js'
import { startOrderExpiryCron } from './services/orderExpiryService.js'
import { startOrderAutoCompleteCron } from './services/orderAutoCompleteService.js'

import { errorHandler } from './middleware/errorHandler.js'
import {
  helmetMiddleware,
  generalLimiter,
  hppMiddleware,
  sanitizeInput,
  uploadLimiter,
} from './middleware/security.js'
import { requestLogger, logInfo, logWarn } from './utils/logger.js'


// ─── Bootstrap ────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || 'development'

// ─── CORS Configuration ───────────────────────────────────────────────────────

const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
]

const envOrigins = process.env.FRONTEND_URL
  ?.split(',')
  .map((url) => url.trim())
  .filter(Boolean) || []

const allowedOrigins = [...new Set([...DEFAULT_ORIGINS, ...envOrigins])]

logInfo('CORS Configuration', { allowedOrigins })

// ─── Middleware Stack ─────────────────────────────────────────────────────────

// 1. Security headers — must be first
app.use(helmetMiddleware)

// 2. CORS — allow configured origins with credentials
app.use(
  cors({
    origin: (origin, callback) => {
      // In development, allow requests with no origin
      if (!origin && NODE_ENV === 'development') {
        return callback(null, true)
      }
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      logWarn('CORS blocked request from unknown origin', { origin })
      callback(new Error(`CORS policy: origin ${origin} is not allowed`))
    },
    credentials: true, // Required for cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Idempotency-Key',
      'Idempotency-Key',
      'Accept',
    ],
    optionsSuccessStatus: 200,
  })
)

// 3. Request logging
app.use(requestLogger)

// 4. Body parsing + Cookie parsing
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

// 5. HTTP Parameter Pollution protection + input sanitization
app.use(hppMiddleware)
app.use(sanitizeInput)

// 6. General API rate limiter (applied to all /api routes except payment notification and webhooks)
app.use('/api', (req, res, next) => {
  if (req.path === '/payment/notification' || req.path.startsWith('/webhook')) {
    return next()
  }
  return generalLimiter(req, res, next)
})

// 7. Static files (served outside /api rate limit)
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../public/uploads'), {
    maxAge: '1d', // Cache static files for 1 day
    etag: true,
  })
)

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/upload', uploadLimiter, uploadRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/location', locationRoutes)
app.use('/api/shipping', shippingRoutes)
app.use('/api/webhook', webhookRoutes)
app.use('/api/contact', contactRoutes)

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    error: 'The requested resource does not exist.',
    path: req.originalUrl,
  })
})

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  logInfo('🚀 Server started', {
    port: PORT,
    environment: NODE_ENV,
    apiBaseUrl: `http://localhost:${PORT}/api`,
  })

  try {
    const { isSupabaseConfigured } = await import('./config/supabase.js')
    logInfo(
      isSupabaseConfigured()
        ? '☁️  Storage: Supabase (Cloud)'
        : '💾 Storage: Local (public/uploads)'
    )
  } catch {
    logWarn('Could not verify Supabase configuration on startup')
  }

  // Start background auto-expiry service for pending orders
  startOrderExpiryCron(60 * 1000)

  // Start background auto-complete service for shipped orders (2 days window)
  startOrderAutoCompleteCron(5 * 60 * 1000)
})
