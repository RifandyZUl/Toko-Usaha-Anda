/**
 * BinderByte API Client
 * Shared HTTP helper for BinderByte wilayah, ongkir and resi endpoints.
 * The API key never leaves the server.
 */

import { ServiceUnavailableError } from '../utils/errors.js'
import { logWarn } from '../utils/logger.js'

const BASE_URL = 'https://api.binderbyte.com'
const DEFAULT_TIMEOUT_MS = 6000

const RATE_LIMIT_RETRY_MS = 1500

/**
 * GET a BinderByte endpoint and return parsed JSON.
 * Throws ServiceUnavailableError on missing key, network failure, timeout or a persisting rate limit.
 * Non-2xx responses still return their JSON body so callers can inspect error codes.
 * BinderByte allows 60 requests/minute per key and answers 429 with an HTML page: retried once after a short wait.
 */
export async function binderbyteGet(path, params = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const apiKey = process.env.BINDERBYTE_API_KEY
  if (!apiKey) {
    throw new ServiceUnavailableError('Layanan pengiriman belum dikonfigurasi (BINDERBYTE_API_KEY kosong).')
  }

  const url = `${BASE_URL}${path}?${new URLSearchParams({ ...params, api_key: apiKey })}`
  let res = await fetchWithTimeout(url, timeoutMs)
  if (res.status === 429) {
    logWarn('BinderByte rate limit hit, retrying once', { path })
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_RETRY_MS))
    res = await fetchWithTimeout(url, timeoutMs)
  }
  if (res.status === 429) {
    throw new ServiceUnavailableError('Layanan pengiriman sedang sibuk. Silakan coba lagi dalam satu menit.')
  }

  try {
    return await res.json()
  } catch {
    throw new ServiceUnavailableError('Layanan BinderByte sedang tidak dapat dihubungi. Silakan coba lagi.')
  }
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } catch {
    throw new ServiceUnavailableError('Layanan BinderByte sedang tidak dapat dihubungi. Silakan coba lagi.')
  } finally {
    clearTimeout(timeoutId)
  }
}
