/**
 * Shipping Service
 * Exact courier tariffs from BinderByte (/v1/cost). No estimated/zoned fallback:
 * if BinderByte cannot price a route, the error propagates and checkout is blocked.
 */

import prisma from '../config/database.js'
import { binderbyteGet } from './binderbyteClient.js'
import { getOrLoad } from './binderbyteCache.js'
import { getVillageById } from './wilayahService.js'
import { BadRequestError, ServiceUnavailableError } from '../utils/errors.js'
import { logWarn } from '../utils/logger.js'

const DEFAULT_ITEM_WEIGHT_GRAMS = 1000

/**
 * Shipping weight rule shared by rate lookup and order creation: variant weight, else product weight, else 1 kg.
 */
export function itemWeightGrams(product, variant) {
  return Number(variant?.weight ?? product?.weight ?? DEFAULT_ITEM_WEIGHT_GRAMS)
}

/**
 * Total weight (grams) of [{ productId, variantId, quantity }], using weights from the database.
 */
export async function getItemsWeightGrams(items) {
  const products = await prisma.product.findMany({
    where: { id: { in: [...new Set(items.map(i => i.productId))] } },
    select: { id: true, weight: true, variants: { select: { id: true, weight: true } } },
  })
  const productById = new Map(products.map(p => [p.id, p]))

  return items.reduce((total, item) => {
    const product = productById.get(item.productId)
    const variant = item.variantId ? product?.variants.find(v => v.id === item.variantId) : null
    if (!product || (item.variantId && !variant)) {
      throw new BadRequestError('Sebagian produk tidak ditemukan. Silakan muat ulang keranjang Anda.')
    }
    return total + itemWeightGrams(product, variant) * item.quantity
  }, 0)
}

// Gudang: Jl. KH. Mas Mansyur No.1, Kunciran Indah, Kec. Pinang, Kota Tangerang, Banten 15144
export const ORIGIN_LOCATION_ID = 'village_73328'

// BinderByte courier code → label sent/stored by the app (also used by the order validator)
const COURIERS = { jne: 'JNE', jnt: 'J&T', pos: 'POS' }
export const SUPPORTED_COURIERS = Object.values(COURIERS)

// /v1/cost only accepts numeric IDs (village_59456). /v1/locations also returns Kemendagri-coded IDs
// (village_61.01.01.2001) for some areas, which /v1/cost rejects with "Invalid ... prefix IDs"
const COSTABLE_LOCATION_ID = /^village_\d+$/

// Special-goods services that need separate handling, not offered for regular parcels
const EXCLUDED_SERVICE = /dangerous|valuable/i

const MAX_WEIGHT_GRAMS = 1_000_000 // 1 ton
// kelurahan → cost location mapping is static data: cache long so each kelurahan costs BinderByte calls ~once a month
const LOCATION_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000
// Bump when findLocationId's matching rules change: old cached mappings are then ignored (and expire on their own)
const LOCATION_MAPPING_VERSION = 'v4'
const COST_CACHE_TTL_MS = 10 * 60 * 1000 // tariffs can change; keep short

// "Pinang (penang)" → "pinang"; "KAB. TANAH LAUT" / "KOTA TANGERANG" → "tanahlaut" / "tangerang"
function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/^\s*(kabupaten|kab\.?|kota(\s+adm\.?)?)\s+/, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]/g, '')
}

// BinderByte labels carry alternative spellings that the wilayah dataset may use instead:
// "Bangko Pusaka (pusako)" → bangkopusaka | bangkopusako   (bracket replaces the last word(s))
// "Beranti/branti Raya"    → berantibrantiraya | berantiraya | brantiraya
function nameForms(name) {
  const raw = String(name || '').trim()
  const [, main = raw, alias] = raw.match(/^(.*?)\((.*?)\)\s*$/) || []
  const bases = [main]
  if (alias) {
    const words = main.trim().split(/\s+/)
    const aliasWords = alias.trim().split(/\s+/).length
    bases.push([...words.slice(0, Math.max(0, words.length - aliasWords)), alias].join(' '))
  }
  const forms = bases.flatMap(base => [base, base.replace(/\/\S*/g, ''), base.replace(/\S*\//g, '')])
  return [...new Set(forms.map(normalizeName).filter(Boolean))]
}

/**
 * Search BinderByte cost locations. Labels look like "Kunciran Indah, Pinang (penang), Tangerang, Banten, 15144".
 */
async function searchLocations(search) {
  const json = await binderbyteGet('/v1/locations', { search })
  return (Array.isArray(json?.data) ? json.data : [])
    .filter(loc => loc.type === 'village' && COSTABLE_LOCATION_ID.test(loc.id))
    .map(loc => {
      const [villageName, districtName, regencyName] = String(loc.label || '').split(',')
      return { id: loc.id, villages: nameForms(villageName), districts: nameForms(districtName), regency: normalizeName(regencyName) }
    })
}

// "bunyu" vs "pulaubunyu": BinderByte's cost dataset sometimes adds/drops words like "Pulau"
const sameOrContains = (a, b) => Boolean(a && b) && (a === b || a.includes(b) || b.includes(a))
const isNamed = (forms, target) => forms.includes(target)
const isNearlyNamed = (forms, target) => forms.some(form => sameOrContains(form, target))

/**
 * Pick the cost location for a kelurahan. Courier tariffs are set per kecamatan (verified on live data:
 * every kelurahan in a kecamatan returns identical prices), so when the kelurahan itself is spelled
 * differently or has no postal code, another kelurahan in the same kecamatan gives the same exact tariff.
 * The cost dataset can differ from the wilayah dataset in postal code, spelling ("Klumbayan" vs
 * "Kelumbayan", "Pusako" vs "Pusaka (pusako)") and kecamatan splits ("Lumbis Hulu" vs "Lumbis Ogong"),
 * hence three lookups.
 */
export async function findLocationId(village) {
  const name = normalizeName(village.name)
  const district = normalizeName(village.districtName)
  const regency = normalizeName(village.regencyName)
  const pick = list => (list.find(l => isNamed(l.villages, name)) || list[0])?.id

  // 1. Postal code, same kecamatan
  if (village.postalCode) {
    const id = pick((await searchLocations(village.postalCode)).filter(l => isNamed(l.districts, district)))
    if (id) return id
  }

  // 2. Kelurahan name in the same kabupaten: exact name, or near name in a near-named kecamatan
  const byName = (await searchLocations(village.name)).filter(l =>
    l.regency === regency &&
    (isNamed(l.villages, name) || (isNearlyNamed(l.villages, name) && isNearlyNamed(l.districts, district)))
  )
  if (byName.length) return pick(byName)

  // 3. Any kelurahan of the same kecamatan (search results are capped at 20, so this can miss)
  const byDistrict = await searchLocations(village.districtName)
  return byDistrict.find(l => isNamed(l.districts, district) && l.regency === regency)?.id || null
}

/**
 * Map a wilayah kelurahan to its BinderByte cost location ID (e.g. "village_73328").
 * Wilayah IDs cannot be used by /v1/cost. Never guesses outside the kelurahan's own kecamatan.
 */
async function resolveDestinationLocation(village) {
  const locationId = await getOrLoad(`location:${LOCATION_MAPPING_VERSION}:${village.id}`, LOCATION_CACHE_TTL_MS, () =>
    village.districtName ? findLocationId(village) : null
  )
  if (!locationId) {
    // Searchable in logs to add a mapping rule for spellings BinderByte's cost data does not match yet
    logWarn('BinderByte cost location not found for kelurahan', {
      villageId: village.id,
      village: village.name,
      district: village.districtName,
      regency: village.regencyName,
      postalCode: village.postalCode,
    })
    throw new ServiceUnavailableError(
      'Ongkos kirim ke kelurahan ini belum bisa dihitung. Silakan coba lagi atau hubungi kami.'
    )
  }
  return locationId
}

function formatEstimate(estimated) {
  const days = String(estimated || '').replace(/days?/i, '').trim()
  if (!days || days === '-') return 'Estimasi tidak tersedia'
  return days === '0' ? 'Estimasi tiba hari ini' : `Estimasi ${days} hari`
}

function toOption(courierCode, cost) {
  const courier = COURIERS[courierCode]
  const fee = Number(cost.price)
  if (!courier || !cost.service || EXCLUDED_SERVICE.test(cost.service)) return null
  if (!Number.isInteger(fee) || fee <= 0) return null

  return {
    id: `${courier}:${cost.service}`,
    courier,
    service: String(cost.service),
    // Avoid "POS Pos Reguler" when the service name already contains the courier
    name: String(cost.service).toUpperCase().startsWith(courier) ? String(cost.service) : `${courier} ${cost.service}`,
    fee,
    desc: `${cost.type || cost.service} · ${formatEstimate(cost.estimated)}`,
    available: true,
  }
}

/**
 * Tariffs for one destination + weight. Only successful results are cached (shared across instances,
 * so the rate lookup and the order created right after it usually cost a single BinderByte call).
 */
function fetchCostOptions(destinationId, weightKg) {
  return getOrLoad(`cost:${destinationId}|${weightKg}`, COST_CACHE_TTL_MS, () => loadCostOptions(destinationId, weightKg))
}

async function loadCostOptions(destinationId, weightKg) {
  const json = await binderbyteGet('/v1/cost', {
    origin: ORIGIN_LOCATION_ID,
    destination: destinationId,
    weight: String(weightKg),
    courier: Object.keys(COURIERS).join(','),
  })
  const results = String(json?.code) === '200' && Array.isArray(json.data?.results) ? json.data.results : []
  const options = results
    .flatMap(r => (Array.isArray(r.costs) ? r.costs.map(cost => toOption(r.code, cost)) : []))
    .filter(Boolean)
  // BinderByte answers code 200 with empty results for unknown destinations, so empty = failure
  if (options.length === 0) {
    throw new ServiceUnavailableError('Tidak ada tarif kurir untuk alamat ini saat ini. Silakan coba lagi.')
  }

  return options.sort((a, b) => a.fee - b.fee)
}

/**
 * Exact courier tariffs for a kelurahan (wilayah ID, e.g. "36.71.11.1005") and total weight in grams.
 */
export async function calculateShippingRates({ villageId, weightGrams }) {
  const grams = Number(weightGrams)
  if (!Number.isFinite(grams) || grams <= 0 || grams > MAX_WEIGHT_GRAMS) {
    throw new BadRequestError('Berat paket tidak valid')
  }

  const village = await getVillageById(villageId)
  if (!village) throw new BadRequestError('Kelurahan tujuan tidak ditemukan. Silakan pilih ulang alamat.')

  const destinationId = await resolveDestinationLocation(village)
  const weightKg = Math.ceil(grams) / 1000
  const options = await fetchCostOptions(destinationId, weightKg)
  return { weightKg, options }
}

/**
 * Server-side fee for the courier + service chosen at checkout.
 * Throws if that exact service is not offered for the route — never substitutes another fee.
 */
export async function calculateOrderShippingFee({ villageId, courier, service, weightGrams }) {
  const { options } = await calculateShippingRates({ villageId, weightGrams })
  const matched = options.find(o => o.courier === courier && o.service === service)
  if (!matched) {
    throw new BadRequestError('Layanan kurir yang dipilih tidak tersedia untuk alamat ini. Silakan pilih ulang kurir.')
  }
  return matched.fee
}
