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
const STALE_PROCESSING_MS = 2 * 60 * 1000 // no order request legitimately takes this long

/**
 * Respond to a request whose idempotency key was already claimed by an earlier request.
 */
async function replyWithExisting(cacheKey, res, next) {
  const existing = await prisma.idempotencyKey.findUnique({ where: { cacheKey } }).catch(() => null)
  if (existing?.status === 'COMPLETED') {
    return res.status(existing.statusCode).json(existing.body)
  }
  // PROCESSING far longer than any real request: the first attempt most likely crashed mid-way.
  // We deliberately do NOT take the key over — the order may already exist, and re-running would duplicate it.
  if (existing && Date.now() - new Date(existing.updatedAt).getTime() > STALE_PROCESSING_MS) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      error: 'Status transaksi sebelumnya tidak diketahui. Silakan cek halaman Pesanan Saya sebelum mencoba checkout lagi.',
      code: 'IDEMPOTENCY_STALE',
    })
  }
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      error: 'Transaksi sedang diproses. Mohon tunggu beberapa saat.',
    })
  }
  // Key was removed in between (e.g. first request hit a 5xx): let this request proceed without the guard
  return next()
}

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
    // Atomic claim: the unique constraint on cacheKey guarantees only one concurrent request wins
    await prisma.idempotencyKey.create({ data: { cacheKey, status: 'PROCESSING' } })
  } catch (dbError) {
    if (dbError?.code === 'P2002') {
      return replyWithExisting(cacheKey, res, next)
    }
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
