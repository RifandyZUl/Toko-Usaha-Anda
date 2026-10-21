/**
 * Postal Code Service
 * Integrates with external postal directory, performs fuzzy-filtering,
 * caches results in-memory, and provides graceful fallbacks.
 */

const postalCache = new Map()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_CACHE_SIZE = 3000

/**
 * Strips administrative prefixes (Kel., Kec., Kota, etc.) for accurate search
 */
export function cleanLocationName(name) {
  if (!name || typeof name !== 'string') return ''
  return name
    .replace(/^(desa|kelurahan|kel\.|ds\.|kecamatan|kec\.|kota adm\.|kab\. adm\.|kota|kabupaten|kab\.)\s+/i, '')
    .trim()
}

/**
 * Normalizes strings by lowercasing, stripping special chars and duplicate consonants
 */
function normalizeName(str) {
  if (!str || typeof str !== 'string') return ''
  return cleanLocationName(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(.)\1+/g, (match, p1) => p1)
}

/**
 * Checks for exact, partial, or spelling-variant matches between two location names
 */
function isFuzzyMatch(a, b) {
  const normA = normalizeName(a)
  const normB = normalizeName(b)
  if (!normA || !normB) return false
  return normA === normB || normA.includes(normB) || normB.includes(normA)
}

/**
 * Performs HTTP fetch to external postal API with a timeout
 */
async function fetchFromExternal(query, limit = 15) {
  if (!query) return []
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 4000)

  try {
    const url = `https://carikodepos.id/api/search?q=${encodeURIComponent(query)}&limit=${limit}`
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json.data) ? json.data : []
  } catch (err) {
    return []
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Calculates similarity / match score for postal code candidates
 */
function calculateMatchScore(item, filters) {
  const isVillageMatch = isFuzzyMatch(item.village?.name, filters.kName)
  const isDistrictMatch = isFuzzyMatch(item.district?.name, filters.sName)
  const isCityMatch = isFuzzyMatch(item.city?.name, filters.cName)
  const isProvinceMatch = isFuzzyMatch(item.province?.name, filters.pName)

  let score = 0
  if (isVillageMatch && isDistrictMatch) score += 6
  else if (isVillageMatch) score += 3
  else if (isDistrictMatch) score += 2

  if (isCityMatch) score += 2
  if (isProvinceMatch) score += 1
  return score
}

/**
 * Formats a raw postal item into a structured client-ready object
 */
function formatPostalOption(code, item, score) {
  const vil = item.village?.name || ''
  const dist = item.district?.name ? `, Kec. ${item.district.name}` : ''
  const city = item.city?.name ? `, ${cleanLocationName(item.city.name)}` : ''

  return {
    postalCode: code,
    label: `${code} - ${vil || 'Wilayah'}${dist}${city}`,
    village: item.village?.name || '',
    district: item.district?.name || '',
    city: item.city?.name || '',
    province: item.province?.name || '',
    score,
  }
}

/**
 * Resolves postal codes for given geographic criteria with in-memory caching
 */
export async function searchPostalCodes({ kelurahan, subdistrict, city, province, q }) {
  const cleanKel = cleanLocationName(kelurahan)
  const cleanSub = cleanLocationName(subdistrict)
  const cleanCity = cleanLocationName(city)
  const cleanProv = cleanLocationName(province)
  const queryStr = q?.trim() || cleanKel || cleanSub

  if (!queryStr) return []

  const cacheKey = `${cleanKel}|${cleanSub}|${cleanCity}|${cleanProv}|${queryStr}`.toLowerCase()
  const cached = postalCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  // Fetch using primary query (kelurahan or general query)
  let rawItems = await fetchFromExternal(queryStr, 15)

  // Fallback: If no valid postal items found and subdistrict is available, query by subdistrict
  const hasPostal = rawItems.some(i => i.type === 'postal' && i.postalCode)
  if (!hasPostal && cleanSub && cleanSub !== queryStr) {
    const subItems = await fetchFromExternal(cleanSub, 25)
    rawItems = rawItems.concat(subItems)
  }

  const filters = {
    kName: cleanKel,
    sName: cleanSub,
    cName: cleanCity,
    pName: cleanProv,
  }

  const resultMap = new Map()
  for (const item of rawItems) {
    if (item.type !== 'postal' || !item.postalCode) continue
    const code = item.postalCode.trim()
    if (!/^\d{5}$/.test(code)) continue

    const score = calculateMatchScore(item, filters)
    const formatted = formatPostalOption(code, item, score)

    if (!resultMap.has(code) || score > resultMap.get(code).score) {
      resultMap.set(code, formatted)
    }
  }

  let candidates = Array.from(resultMap.values())

  // If we have strong matches (village matched, or district+city matched), filter out noise
  const hasExactVillageMatch = candidates.some(c => c.score >= 5)
  if (hasExactVillageMatch) {
    candidates = candidates.filter(c => c.score >= 5)
  }

  const sortedResults = candidates
    .sort((a, b) => b.score - a.score || a.postalCode.localeCompare(b.postalCode))
    .map(({ score, ...rest }) => rest)

  // Save to cache
  if (postalCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = postalCache.keys().next().value
    postalCache.delete(oldestKey)
  }
  postalCache.set(cacheKey, { data: sortedResults, timestamp: Date.now() })

  return sortedResults
}
