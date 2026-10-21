/**
 * Shipping Tracking Service
 * Integrates with Indonesian courier APIs (e.g. BinderByte / RajaOngkir)
 * with graceful simulation fallbacks and in-memory caching.
 */

import prisma from '../config/database.js'

const trackingCache = new Map()
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes
const MAX_CACHE_SIZE = 1000

/**
 * Normalizes courier names to standardized API slugs
 */
export function normalizeCourierCode(courierName) {
  if (!courierName || typeof courierName !== 'string') return 'jne'
  const clean = courierName.toLowerCase().replace(/[^a-z0-9]/g, '')
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
 * Performs real-time lookup against BinderByte API
 */
async function fetchFromBinderByte(courier, awb) {
  const apiKey = process.env.BINDERBYTE_API_KEY
  if (!apiKey || !awb) return null

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 4500)

  try {
    const url = `https://api.binderbyte.com/v1/track?api_key=${apiKey}&courier=${courier}&awb=${encodeURIComponent(awb)}`
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    const json = await res.json()
    if (json.status === 200 && json.data) {
      return json.data
    }
    return null
  } catch (err) {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Generates realistic chronological checkpoints for Indonesian courier tracking
 */
function generateRealisticCheckpoints(order, waybillNumber, courierName, destinationCity) {
  const createdDate = new Date(order.createdAt || Date.now())
  const courierUpper = courierName.toUpperCase()
  const history = []

  // Checkpoint 1: Order confirmed & packaging
  const t1 = new Date(createdDate.getTime() + 15 * 60 * 1000)
  history.push({
    date: t1.toISOString(),
    desc: `Pesanan telah dikonfirmasi dan sedang dikemas oleh penjual di Toko Usaha Anda [Tangerang]`,
    location: 'Tangerang',
    status: 'PACKED',
  })

  // Checkpoint 2: Picked up by courier drop point
  const t2 = new Date(createdDate.getTime() + 2 * 60 * 60 * 1000)
  history.push({
    date: t2.toISOString(),
    desc: `Paket telah diserahkan kepada kurir penjemput ${courierUpper} [Drop Point Tangerang]`,
    location: 'Tangerang',
    status: 'PICKED_UP',
  })

  if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
    // Checkpoint 3: Sorting center
    const t3 = new Date(createdDate.getTime() + 6 * 60 * 60 * 1000)
    history.push({
      date: t3.toISOString(),
      desc: `Paket telah tiba di Sorting Center ${courierUpper} [Gateway Hub Jakarta Barat]`,
      location: 'Jakarta Barat',
      status: 'SORTING',
    })

    // Checkpoint 4: Transit to destination
    const t4 = new Date(createdDate.getTime() + 14 * 60 * 60 * 1000)
    history.push({
      date: t4.toISOString(),
      desc: `Paket sedang dalam perjalanan transit menuju ${destinationCity} [In Transit]`,
      location: destinationCity,
      status: 'IN_TRANSIT',
    })

    // Checkpoint 5: Out for delivery
    const t5 = new Date(createdDate.getTime() + 22 * 60 * 60 * 1000)
    history.push({
      date: t5.toISOString(),
      desc: `Paket dibawa oleh kurir pengantar ${courierUpper} menuju alamat penerima`,
      location: destinationCity,
      status: 'OUT_FOR_DELIVERY',
    })
  }

  if (order.status === 'DELIVERED') {
    // Checkpoint 6: Delivered
    const t6 = new Date(createdDate.getTime() + 26 * 60 * 60 * 1000)
    history.push({
      date: t6.toISOString(),
      desc: `Paket telah berhasil diterima oleh penerima yang bersangkutan di alamat tujuan.`,
      location: destinationCity,
      status: 'DELIVERED',
    })
  }

  // Newest checkpoint first
  history.reverse()

  return {
    waybillNumber,
    courier: courierUpper,
    service: `${courierUpper} Reguler`,
    status: order.status === 'DELIVERED' ? 'DELIVERED' : order.status === 'SHIPPED' ? 'ON_PROCESS' : 'PROCESSED',
    statusLabel: order.status === 'DELIVERED' ? 'Paket Telah Diterima' : order.status === 'SHIPPED' ? 'Dalam Pengiriman' : 'Sedang Dikemas',
    origin: 'TANGERANG (Gudang Toko Usaha Anda)',
    destination: destinationCity,
    receiver: extractDestination(order.shippingAddress).receiver,
    currentLocation: history[0]?.location || 'Tangerang',
    lastUpdate: history[0]?.date || new Date().toISOString(),
    isMock: true,
    history,
  }
}

/**
 * Tracks order shipping package with caching and upstream fallbacks
 */
export async function trackOrderShipping(order) {
  if (!order) throw new Error('Order is required')

  const shippingDetails = order.paymentDetails?.shippingDetails || {}
  const courierCode = normalizeCourierCode(shippingDetails.courier || order.shippingCourier)
  const waybillNumber = shippingDetails.trackingNumber || `RESI-${courierCode.toUpperCase()}-${order.id.slice(0, 8).toUpperCase()}`

  const cacheKey = `${courierCode}|${waybillNumber}|${order.status}`
  const cached = trackingCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  const { city } = extractDestination(order.shippingAddress)

  // 1. Try real external API (BinderByte)
  const realData = await fetchFromBinderByte(courierCode, waybillNumber)
  if (realData) {
    const formatted = {
      waybillNumber: realData.summary?.waybill_number || waybillNumber,
      courier: realData.summary?.courier || courierCode.toUpperCase(),
      service: realData.summary?.service || `${courierCode.toUpperCase()} Reguler`,
      status: realData.summary?.status || 'ON_PROCESS',
      statusLabel: realData.summary?.status === 'DELIVERED' ? 'Paket Telah Diterima' : 'Dalam Pengiriman',
      origin: realData.detail?.origin || 'Tangerang',
      destination: realData.detail?.destination || city,
      receiver: realData.detail?.receiver || extractDestination(order.shippingAddress).receiver,
      currentLocation: realData.history?.[0]?.location || city,
      lastUpdate: realData.history?.[0]?.date || new Date().toISOString(),
      isMock: false,
      history: (realData.history || []).map(h => ({
        date: h.date,
        desc: h.desc,
        location: h.location || city,
      })),
    }

    // Sync deliveredAt timestamp to database if live courier confirmed delivery
    if (realData.summary?.status === 'DELIVERED' && !shippingDetails.deliveredAt && order.id) {
      const deliveredTime = realData.history?.[0]?.date || new Date().toISOString()
      prisma.order.update({
        where: { id: order.id },
        data: {
          paymentDetails: {
            ...(order.paymentDetails || {}),
            shippingDetails: {
              ...shippingDetails,
              deliveredAt: deliveredTime,
            },
          },
        },
      }).catch(err => console.warn('Failed to update deliveredAt from live tracking:', err.message))
    }

    trackingCache.set(cacheKey, { data: formatted, timestamp: Date.now() })
    return formatted
  }

  // 2. Realistic simulation fallback
  const result = generateRealisticCheckpoints(order, waybillNumber, courierCode, city)

  if (trackingCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = trackingCache.keys().next().value
    trackingCache.delete(oldestKey)
  }
  trackingCache.set(cacheKey, { data: result, timestamp: Date.now() })

  return result
}
