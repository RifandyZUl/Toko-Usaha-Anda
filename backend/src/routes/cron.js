/**
 * Cron Job: Expire pending orders that have passed their payment deadline.
 * Triggered by Vercel Cron — schedules in vercel.json (daily on the Hobby plan).
 *
 * Route: GET /api/cron/expire-orders
 * Auth:  CRON_SECRET header (set in Vercel environment variables)
 */

import express from 'express'
import { checkAndExpirePendingOrders } from '../services/orderExpiryService.js'
import { checkAndAutoCompleteShippedOrders } from '../services/orderAutoCompleteService.js'
import { cleanupExpiredIdempotencyKeys } from '../middleware/idempotency.js'
import { cleanupExpiredOtpSessions } from '../services/otpService.js'
import { cleanupExpiredBinderbyteCache } from '../services/binderbyteCache.js'
import { logInfo, logError } from '../utils/logger.js'

const router = express.Router()

// Vercel Cron invokes jobs with GET; POST is kept for manual/authorised triggers
const cronRoute = (path, ...handlers) => {
  router.get(path, ...handlers)
  router.post(path, ...handlers)
}

/**
 * Verify the request comes from Vercel Cron (or an authorised caller).
 * Vercel automatically sets Authorization: Bearer <CRON_SECRET> on cron requests.
 */
const verifyCronSecret = (req, res, next) => {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // No secret configured — only allow in local development (preview deployments often have no NODE_ENV)
    if (process.env.NODE_ENV === 'development') return next()
    return res.status(500).json({ error: 'CRON_SECRET is not configured.' })
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (token !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  next()
}

/**
 * GET|POST /api/cron/expire-orders  (Vercel Cron calls with GET)
 * Expires pending orders past their payment deadline and restores stock.
 */
cronRoute('/expire-orders', verifyCronSecret, async (req, res) => {
  try {
    await checkAndExpirePendingOrders()
    logInfo('[Cron] expire-orders completed')
    res.json({ ok: true, job: 'expire-orders' })
  } catch (error) {
    logError('[Cron] expire-orders failed', { error: error.message })
    res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * GET|POST /api/cron/auto-complete-orders  (Vercel Cron calls with GET)
 * Auto-completes shipped orders that have passed the 2-day delivery window.
 */
cronRoute('/auto-complete-orders', verifyCronSecret, async (req, res) => {
  try {
    await checkAndAutoCompleteShippedOrders()
    logInfo('[Cron] auto-complete-orders completed')
    res.json({ ok: true, job: 'auto-complete-orders' })
  } catch (error) {
    logError('[Cron] auto-complete-orders failed', { error: error.message })
    res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * GET|POST /api/cron/cleanup  (Vercel Cron calls with GET)
 * Deletes expired idempotency keys, stale OTP sessions and expired BinderByte cache rows.
 */
cronRoute('/cleanup', verifyCronSecret, async (req, res) => {
  try {
    const [idempotencyCount, otpCount, binderbyteCacheCount] = await Promise.all([
      cleanupExpiredIdempotencyKeys(),
      cleanupExpiredOtpSessions(),
      cleanupExpiredBinderbyteCache(),
    ])
    logInfo('[Cron] cleanup completed', { idempotencyCount, otpCount, binderbyteCacheCount })
    res.json({ ok: true, job: 'cleanup', idempotencyCount, otpCount, binderbyteCacheCount })
  } catch (error) {
    logError('[Cron] cleanup failed', { error: error.message })
    res.status(500).json({ ok: false, error: error.message })
  }
})

export default router

