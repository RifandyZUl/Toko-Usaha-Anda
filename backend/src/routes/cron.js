/**
 * Cron Job: Expire pending orders that have passed their payment deadline.
 * Triggered by Vercel Cron — runs every 5 minutes.
 *
 * Route: GET /api/cron/expire-orders
 * Auth:  CRON_SECRET header (set in Vercel environment variables)
 */

import express from 'express'
import { checkAndExpirePendingOrders } from '../services/orderExpiryService.js'
import { checkAndAutoCompleteShippedOrders } from '../services/orderAutoCompleteService.js'
import { cleanupExpiredIdempotencyKeys } from '../middleware/idempotency.js'
import { cleanupExpiredOtpSessions } from '../services/otpService.js'
import { logInfo, logError } from '../utils/logger.js'

const router = express.Router()

/**
 * Verify the request comes from Vercel Cron (or an authorised caller).
 * Vercel automatically sets Authorization: Bearer <CRON_SECRET> on cron requests.
 */
const verifyCronSecret = (req, res, next) => {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // No secret configured — only allow in development
    if (process.env.NODE_ENV !== 'production') return next()
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
 * POST /api/cron/expire-orders
 * Expires pending orders past their payment deadline and restores stock.
 */
router.post('/expire-orders', verifyCronSecret, async (req, res) => {
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
 * POST /api/cron/auto-complete-orders
 * Auto-completes shipped orders that have passed the 2-day delivery window.
 */
router.post('/auto-complete-orders', verifyCronSecret, async (req, res) => {
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
 * POST /api/cron/cleanup
 * Deletes expired idempotency keys and stale OTP sessions from the database.
 */
router.post('/cleanup', verifyCronSecret, async (req, res) => {
  try {
    const [idempotencyCount, otpCount] = await Promise.all([
      cleanupExpiredIdempotencyKeys(),
      cleanupExpiredOtpSessions(),
    ])
    logInfo('[Cron] cleanup completed', { idempotencyCount, otpCount })
    res.json({ ok: true, job: 'cleanup', idempotencyCount, otpCount })
  } catch (error) {
    logError('[Cron] cleanup failed', { error: error.message })
    res.status(500).json({ ok: false, error: error.message })
  }
})

export default router

