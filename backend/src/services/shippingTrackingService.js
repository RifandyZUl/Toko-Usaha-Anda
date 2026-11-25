/**
 * Shipping Tracking Service
 * Live waybill tracking via BinderByte (/v1/track), cached in memory and in the database.
 * Never invents checkpoints: without a real waybill or courier data it returns { available: false }.
 */

import { binderbyteGet } from './binderbyteClient.js'
import { getOrLoad } from './binderbyteCache.js'
import { updateOrderIfUnchanged } from './orderStockService.js'
import { logWarn } from '../utils/logger.js'

const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes

// Older orders got a server-made placeholder "RESI-JNE-XXXXXXXX"; that is not a courier waybill
export const isRealWaybill = waybill => typeof waybill === 'string' && waybill.trim() !== '' && !waybill.trim().startsWith('RESI-')

/**
 * Normalizes courier names to standardized API slugs
 */
export function normalizeCourierCode(courierName) {
  if (!courierName || typeof courierName !== 'string') return 'jne'
  // Orders store "<COURIER> <SERVICE>" (e.g. "JNE JTR"); only the first word is the courier
  const clean = courierName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  if (clean.includes('sicepat')) return 'sicepat'
  if (clean.includes('jnt') || clean.includes('jt')) return 'jnt'
  if (clean.includes('pos')) return 'pos'
  if (clean.includes('anteraja')) return 'anteraja'
  if (clean.includes('tiki')) return 'tiki'
  if (clean.includes('wahana')) return 'wahana'
  if (clean.includes('ninja')) return 'ninja'
  if (clean.includes('spx') || clean.includes('shopee')) return 'spx'
  if (clean.includes('lion')) return 'lion'
  return 'jne'
}

/**
 * Extracts destination city and receiver from shipping address
 */
export function extractDestination(shippingAddress) {
  if (!shippingAddress || typeof shippingAddress !== 'string') {
    return { receiver: 'Penerima', city: 'Tujuan' }
  }

  const [receiverPart] = shippingAddress.split('|')
  const receiver = receiverPart ? receiverPart.trim() : 'Penerima'

  const parts = shippingAddress.split(',').map(s => s.trim())
  const cityPart = parts.find(p => /kota|kabupaten|kab\.|adm\./i.test(p))
  const city = cityPart ? cityPart.replace(/^(kota adm\.|kab\. adm\.|kota|kabupaten|kab\.)\s+/i, '').trim() : 'Kota Tujuan'

  return { receiver, city }
}

/**
 * Performs real-time lookup against BinderByte API.
 * Returns null on any failure (missing key, network, unknown waybill) so the caller can fall back.
 */
async function fetchFromBinderByte(courier, awb) {
  if (!awb) return null
  try {
    // Shared cache (memory + DB): the resi quota is small, so repeat lookups across instances reuse one hit
    return await getOrLoad(`track:${courier}:${awb}`, CACHE_TTL_MS, async () => {
      const json = await binderbyteGet('/v1/track', { courier, awb })
      return Number(json?.status) === 200 && json.data ? json.data : null
    })
  } catch {
    return null
  }
}

/**
 * Tracking for an order: courier data when a real waybill exists and BinderByte answers,
 * otherwise { available: false, message } so the shop shows an honest "not yet available".
 */
export async function trackOrderShipping(order) {
  if (!order) throw new Error('Order is required')

  const shippingDetails = order.paymentDetails?.shippingDetails || {}
  const courierCode = normalizeCourierCode(shippingDetails.courier || order.shippingCourier)
  const waybill = isRealWaybill(shippingDetails.trackingNumber) ? shippingDetails.trackingNumber.trim() : null
  const { city, receiver } = extractDestination(order.shippingAddress)
  const unavailable = message => ({
    available: false,
    message,
    waybillNumber: waybill,
    courier: courierCode.toUpperCase(),
    destination: city,
    history: [],
  })

  if (!waybill) return unavailable('Nomor resi belum diinput oleh toko. Silakan cek kembali nanti.')

  const realData = await fetchFromBinderByte(courierCode, waybill)
  if (!realData) return unavailable('Data pelacakan dari kurir belum tersedia. Silakan coba beberapa saat lagi.')

  if (realData.summary?.status === 'DELIVERED' && !shippingDetails.deliveredAt && order.id) {
    syncDeliveredAt(order, realData.history?.[0]?.date || new Date().toISOString())
  }

  return {
    available: true,
    waybillNumber: realData.summary?.waybill_number || waybill,
    courier: realData.summary?.courier || courierCode.toUpperCase(),
    service: realData.summary?.service || null,
    status: realData.summary?.status || 'ON_PROCESS',
    statusLabel: realData.summary?.status === 'DELIVERED' ? 'Paket Telah Diterima' : 'Dalam Pengiriman',
    origin: realData.detail?.origin || null,
    destination: realData.detail?.destination || city,
    receiver: realData.detail?.receiver || receiver,
    currentLocation: realData.history?.[0]?.location || null,
    lastUpdate: realData.history?.[0]?.date || null,
    history: (realData.history || []).map(h => ({ date: h.date, desc: h.desc, location: h.location || null })),
  }
}

/**
 * Record the courier-confirmed delivery time. Fire-and-forget; skipped if the order changed meanwhile
 * (conditional on updatedAt so it never overwrites a dispute/review written in parallel).
 */
function syncDeliveredAt(order, deliveredAt) {
  const details = order.paymentDetails || {}
  updateOrderIfUnchanged(order, {
    paymentDetails: { ...details, shippingDetails: { ...(details.shippingDetails || {}), deliveredAt } },
  }).catch(err => logWarn('Failed to save deliveredAt from live tracking', { orderId: order.id, error: err.message }))
}
