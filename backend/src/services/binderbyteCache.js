/**
 * BinderByte Cache
 * Two-level cache (in-memory → database) shared across serverless instances, so BinderByte's
 * rate limit (60 req/min) and resi quota are not spent again on every cold start.
 * The database is an optimisation only: if it is unreachable we fall back to calling BinderByte.
 */

import prisma from '../config/database.js'
import { logWarn } from '../utils/logger.js'

const MAX_MEMORY_ENTRIES = 2000
const memory = new Map()
const inflight = new Map() // key → pending load, so concurrent misses share one BinderByte call

function remember(key, value, expiresAt) {
  if (memory.size >= MAX_MEMORY_ENTRIES) memory.delete(memory.keys().next().value)
  memory.set(key, { value, expiresAt })
}

async function readStored(key) {
  try {
    const row = await prisma.binderbyteCache.findUnique({ where: { key } })
    return row && row.expiresAt.getTime() > Date.now() ? row : null
  } catch (error) {
    logWarn('BinderByte cache read failed, calling API directly', { key, error: error.message })
    return null
  }
}

async function writeStored(key, value, expiresAt) {
  try {
    await prisma.binderbyteCache.upsert({
      where: { key },
      create: { key, value, expiresAt },
      update: { value, expiresAt },
    })
  } catch (error) {
    logWarn('BinderByte cache write failed', { key, error: error.message })
  }
}

/**
 * Return the cached value for `key`, or run `loader` and cache its result for `ttlMs`.
 * A loader result of null/undefined is returned as-is but NOT cached (e.g. "not found" answers).
 * Errors thrown by the loader propagate and nothing is cached.
 * Concurrent calls for the same key within this instance share a single load.
 */
export function getOrLoad(key, ttlMs, loader) {
  const hit = memory.get(key)
  if (hit && hit.expiresAt > Date.now()) return Promise.resolve(hit.value)

  if (!inflight.has(key)) {
    const pending = loadThrough(key, ttlMs, loader).finally(() => inflight.delete(key))
    inflight.set(key, pending)
  }
  return inflight.get(key)
}

async function loadThrough(key, ttlMs, loader) {
  const stored = await readStored(key)
  if (stored) {
    remember(key, stored.value, stored.expiresAt.getTime())
    return stored.value
  }

  const value = await loader()
  if (value === null || value === undefined) return value

  const expiresAt = Date.now() + ttlMs
  remember(key, value, expiresAt)
  await writeStored(key, value, new Date(expiresAt))
  return value
}

/**
 * Delete expired cache rows. Called by the /api/cron/cleanup Vercel Cron endpoint.
 */
export async function cleanupExpiredBinderbyteCache() {
  const { count } = await prisma.binderbyteCache.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  return count
}
