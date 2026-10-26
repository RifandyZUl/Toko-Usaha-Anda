/**
 * Shipping Service
 * Integrates with RajaOngkir API with robust zoned fallback
 * and ensures server-side cost calculation integrity.
 */

// Toko Usaha Anda origin: Kota Tangerang, Banten (RajaOngkir Starter ID: 457)
export const ORIGIN_CITY_ID = '457'
export const ORIGIN_CITY_NAME = 'Kota Tangerang'

// Zoned base rates per kg (IDR) from Tangerang
const ZONE_RATES = {
  LOCAL: { jne: 9000, jnt: 10000, pos: 8000, gosend: 25000 },
  JABODETABEK_BANTEN: { jne: 11000, jnt: 12000, pos: 10000 },
  PULAU_JAWA: { jne: 18000, jnt: 20000, pos: 16000 },
  LUAR_JAWA: { jne: 35000, jnt: 38000, pos: 30000 },
}

/**
 * Determine shipping zone based on destination city and province
 */
export function determineZone(city = '', province = '') {
  const c = String(city).toUpperCase()
  const p = String(province).toUpperCase()

  if (c.includes('TANGERANG')) return 'LOCAL'
  if (
    p.includes('BANTEN') ||
    p.includes('JAKARTA') ||
    c.includes('BEKASI') ||
    c.includes('DEPOK') ||
    c.includes('BOGOR')
  ) {
    return 'JABODETABEK_BANTEN'
  }
  if (p.includes('JAWA') || p.includes('YOGYAKARTA')) {
    return 'PULAU_JAWA'
  }
  return 'LUAR_JAWA'
}

/**
 * Fetch live cost from RajaOngkir Starter/Pro API if configured
 */
async function fetchRajaOngkirCost(destinationCityId, weightInGrams, courierCode) {
  const apiKey = process.env.RAJAONGKIR_API_KEY
  if (!apiKey || !destinationCityId) return null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    const response = await fetch('https://api.rajaongkir.com/starter/cost', {
      method: 'POST',
      headers: {
        key: apiKey,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        origin: ORIGIN_CITY_ID,
        destination: String(destinationCityId),
        weight: String(weightInGrams),
        courier: courierCode.toLowerCase(),
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) return null
    const json = await response.json()
    const results = json?.rajaongkir?.results?.[0]?.costs
    if (!results || results.length === 0) return null

    const service = results.find((s) => /reg|oke|standard|pos kilat/i.test(s.service)) || results[0]
    const cost = service?.cost?.[0]?.value
    const etd = service?.cost?.[0]?.etd || '2-3'
    if (cost) {
      return { fee: cost, etd: `${String(etd).replace(/hari/i, '').trim()} hari kerja` }
    }
  } catch {
    // Graceful fallback on network timeout or invalid key
    return null
  }
  return null
}

/**
 * Calculate available shipping courier options and fees
 */
export async function calculateShippingRates({
  city = '',
  province = '',
  destinationCityId = null,
  weight = 1000,
}) {
  const weightKg = Math.max(1, Math.ceil(Number(weight) / 1000) || 1)
  const zone = determineZone(city, province)
  const rates = ZONE_RATES[zone] || ZONE_RATES.LUAR_JAWA
  const isTangerang = zone === 'LOCAL'

  const couriers = [
    { id: 'JNE', name: 'JNE Express', code: 'jne', base: rates.jne, etd: isTangerang ? '1-2 hari' : '2-3 hari' },
    { id: 'J&T', name: 'J&T Express', code: 'jnt', base: rates.jnt, etd: isTangerang ? '1-2 hari' : '2-4 hari' },
    { id: 'POS', name: 'Pos Indonesia', code: 'pos', base: rates.pos, etd: isTangerang ? '2-3 hari' : '3-5 hari' },
  ]

  const options = await Promise.all(
    couriers.map(async (c) => {
      let fee = c.base * weightKg
      let etd = c.etd

      if (destinationCityId && ['jne', 'pos'].includes(c.code)) {
        const live = await fetchRajaOngkirCost(destinationCityId, weightKg * 1000, c.code)
        if (live) {
          fee = live.fee
          etd = live.etd
        }
      }

      return {
        id: c.id,
        name: c.name,
        fee,
        desc: `${etd} (${weightKg} kg)`,
        available: true,
      }
    })
  )

  options.push({
    id: 'GOSEND',
    name: 'GoSend',
    fee: 25000,
    desc: isTangerang ? 'Same Day (Maks 20kg)' : 'Di luar jangkauan GoSend',
    available: isTangerang && weightKg <= 20,
  })

  return { zone, weightKg, options }
}

/**
 * Server-side integrity calculation:
 * Ensures the order's shipping fee is validated and calculated on the server
 */
export async function calculateOrderShippingFee({ city = '', province = '', courier = 'JNE', weight = 1000 }) {
  const { options } = await calculateShippingRates({ city, province, weight })
  const courierUpper = String(courier || 'JNE').toUpperCase()
  const matched = options.find((o) => o.id === courierUpper && o.available)
  if (matched) return matched.fee

  const firstAvailable = options.find((o) => o.available)
  return firstAvailable ? firstAvailable.fee : 15000
}
