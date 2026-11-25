/**
 * Wilayah Service
 * Indonesian administrative regions (provinsi → kabupaten/kota → kecamatan → kelurahan)
 * sourced from BinderByte, cached (memory + database) because the data is effectively static.
 */

import { binderbyteGet } from './binderbyteClient.js'
import { getOrLoad } from './binderbyteCache.js'
import { BadRequestError, ServiceUnavailableError } from '../utils/errors.js'

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const PROVINCE_ID = /^\d{2}$/
const REGENCY_ID = /^\d{2}\.\d{2}$/
const DISTRICT_ID = /^\d{2}\.\d{2}\.\d{2}$/
const VILLAGE_ID = /^\d{2}\.\d{2}\.\d{2}\.\d{4}$/

function assertId(id, pattern, label) {
  if (typeof id !== 'string' || !pattern.test(id)) {
    throw new BadRequestError(`ID ${label} tidak valid`)
  }
}

function toRegion(item) {
  return {
    id: String(item.id),
    name: String(item.name),
    ...(item.postal_code && { postalCode: String(item.postal_code) }),
  }
}

/**
 * Fetch a region list from BinderByte with caching. Only successful, non-empty answers are cached.
 */
async function fetchRegionList(path, params = {}) {
  const regions = await getOrLoad(`wilayah:${path}?${new URLSearchParams(params)}`, CACHE_TTL_MS, async () => {
    const json = await binderbyteGet(path, params)
    // 404 = parent region has no children / does not exist: not an outage, and not cached
    if (String(json?.code) === '404') return null
    if (String(json?.code) !== '200' || !Array.isArray(json.value)) {
      throw new ServiceUnavailableError('Data wilayah gagal dimuat. Silakan coba lagi.')
    }
    return json.value.map(toRegion)
  })
  return regions ?? []
}

export function getProvinces() {
  return fetchRegionList('/wilayah/provinsi')
}

export function getRegencies(provinceId) {
  assertId(provinceId, PROVINCE_ID, 'provinsi')
  return fetchRegionList('/wilayah/kabupaten', { id_provinsi: provinceId })
}

export function getDistricts(regencyId) {
  assertId(regencyId, REGENCY_ID, 'kabupaten/kota')
  return fetchRegionList('/wilayah/kecamatan', { id_kabupaten: regencyId })
}

export function getVillages(districtId) {
  assertId(districtId, DISTRICT_ID, 'kecamatan')
  return fetchRegionList('/wilayah/kelurahan', { id_kecamatan: districtId })
}

/**
 * Resolve one kelurahan (with its kecamatan, kabupaten/kota & provinsi names) from its full ID, e.g. "36.71.11.1005".
 * Returns null when the ID does not exist.
 */
export async function getVillageById(villageId) {
  assertId(villageId, VILLAGE_ID, 'kelurahan')
  const [provinceId, regencyCode, districtCode] = villageId.split('.')
  const regencyId = `${provinceId}.${regencyCode}`
  const districtId = `${regencyId}.${districtCode}`

  const [villages, districts, regencies, provinces] = await Promise.all([
    getVillages(districtId),
    getDistricts(regencyId),
    getRegencies(provinceId),
    getProvinces(),
  ])
  const village = villages.find(v => v.id === villageId)
  if (!village) return null

  return {
    ...village,
    districtName: districts.find(d => d.id === districtId)?.name || '',
    regencyName: regencies.find(r => r.id === regencyId)?.name || '',
    provinceName: provinces.find(p => p.id === provinceId)?.name || '',
  }
}
