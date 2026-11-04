/**
 * Idempotency Middleware
 * Prevents duplicate order creation across multiple serverless instances.
 *
 * Uses the database (idempotency_keys table) instead of in-memory Map
 * so the cache is shared across all Vercel instances.
 *
 * Key format: "userId:idempotencyKey"
 * TTL: 5 minutes (cleaned up by the /api/cron/cleanup endpoint)
 */

import prisma from '../config/database.js'
import { HTTP_STATUS } from '../constants/index.js'
import { logWarn } from '../utils/logger.js'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Middleware to check and enforce idempotency key via database.
 * If no idempotency key header is provided, the request proceeds normally.
 */
export const checkIdempotency = async (req, res, next) => {
  const idempotencyKey =
    req.headers['x-idempotency-key'] || req.headers['idempotency-key']

  if (!idempotencyKey) {
    return next()
  }

  const cacheKey = `${req.userId || 'anon'}:${idempotencyKey}`

  try {
    const existing = await prisma.idempotencyKey.findUnique({
      where: { cacheKey },
    })

    if (existing) {
      if (existing.status === 'PROCESSING') {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: 'Transaksi sedang diproses. Mohon tunggu beberapa saat.',
        })
      }

      if (existing.status === 'COMPLETED') {
        return res.status(existing.statusCode).json(existing.body)
      }
    }

    // Mark as PROCESSING before passing to next handler
    await prisma.idempotencyKey.upsert({
      where: { cacheKey },
      create: { cacheKey, status: 'PROCESSING' },
      update: { status: 'PROCESSING', updatedAt: new Date() },
    })
  } catch (dbError) {
    // If DB check fails, allow request through rather than blocking checkout
    logWarn('Idempotency DB check failed — allowing request through', {
      cacheKey,
      error: dbError.message,
    })
    return next()
  }

  // Intercept res.json to persist the response for future duplicate requests
  const originalJson = res.json.bind(res)
  res.json = async (body) => {
    try {
      if (res.statusCode < 500) {
        await prisma.idempotencyKey.update({
          where: { cacheKey },
          data: {
            status: 'COMPLETED',
            statusCode: res.statusCode,
            body,
          },
        })
      } else {
        // Remove key on server error so user can safely retry
        await prisma.idempotencyKey.delete({ where: { cacheKey } })
      }
    } catch {
      // Non-critical — response already sent, just log
      logWarn('Failed to persist idempotency result', { cacheKey })
    }
    return originalJson(body)
  }

  next()
}

/**
 * Delete idempotency keys older than TTL.
 * Called by the /api/cron/cleanup Vercel Cron endpoint.
 */
export const cleanupExpiredIdempotencyKeys = async () => {
  const cutoff = new Date(Date.now() - CACHE_TTL_MS)
  const { count } = await prisma.idempotencyKey.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })
  return count
}
