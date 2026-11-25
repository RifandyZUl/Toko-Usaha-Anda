import { describe, it, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { calculateOrderShippingFee, calculateShippingRates } from '../src/services/shippingService.js'
import { installFakeBinderbyteCache } from './helpers/fakeBinderbyteCache.js'

// BinderByte is mocked: these tests never hit the network or consume quota.
const realFetch = globalThis.fetch
process.env.BINDERBYTE_API_KEY = 'test-key'

const VILLAGE_ID = '36.71.11.1005'
const loc = (id, label) => ({ id, type: 'village', label })
// Keyed by "<path>?<first query value>" so each test can hit a different kelurahan (services cache per ID)
const fixtures = {
  '/wilayah/kabupaten?36': { code: '200', value: [{ id: '36.71', name: 'KOTA TANGERANG' }] },
  '/wilayah/kecamatan?36.71': { code: '200', value: [{ id: '36.71.11', name: 'Pinang' }, { id: '36.71.12', name: 'Larangan' }] },
  '/wilayah/kelurahan?36.71.11': {
    code: '200',
    value: [
      { id: VILLAGE_ID, name: 'Kunciran Indah', postal_code: '15144' },
      { id: '36.71.11.1006', name: 'Kunciran Jaya Baru', postal_code: '15144' }, // spelled differently at BinderByte
      { id: '36.71.11.1009', name: 'Desa Baru', postal_code: null }, // no postal code
    ],
  },
  '/wilayah/kelurahan?36.71.12': { code: '200', value: [{ id: '36.71.12.1001', name: 'Larangan Utara', postal_code: '15154' }] },
  '/v1/locations?15144': {
    code: '200',
    data: [
      loc('village_73327', 'Kunciran, Pinang (penang), Tangerang, Banten, 15144'),
      loc('village_73328', 'Kunciran Indah, Pinang (penang), Tangerang, Banten, 15144'),
    ],
  },
  '/v1/locations?Pinang': {
    code: '200',
    data: [
      loc('village_90001', 'Pinang, Pinang, Pinrang, Sulawesi Selatan, 91200'), // same kecamatan name, other kabupaten
      loc('village_73326', 'Pinang, Pinang (penang), Tangerang, Banten, 15145'),
    ],
  },
  // Postal code only returns a kelurahan from another kecamatan, and the kecamatan search finds nothing
  '/v1/locations?15154': { code: '200', data: [loc('village_70001', 'Larangan Utara, Ciledug, Tangerang, Banten, 15154')] },
  '/v1/locations?Larangan': { code: '200', data: [] },
}
let costResponse
let lastCostParams

function mockFetch(url) {
  const { pathname, searchParams } = new URL(url)
  if (pathname === '/v1/cost') {
    lastCostParams = searchParams
    return Promise.resolve({ json: async () => costResponse })
  }
  const firstValue = [...searchParams.entries()].find(([key]) => key !== 'api_key')?.[1] || ''
  return Promise.resolve({ json: async () => fixtures[`${pathname}?${firstValue}`] || { code: '404' } })
}

const costOk = {
  code: '200',
  data: {
    results: [
      { code: 'jne', costs: [{ service: 'REG', type: 'Layanan Reguler', price: '12000', estimated: '1 day' }] },
      { code: 'pos', costs: [{ service: 'Pos Reguler', type: 'Reguler', price: '10500', estimated: '2 day' }] },
    ],
  },
}

describe('Shipping Fee Server Integrity (BinderByte, mocked)', () => {
  const cache = installFakeBinderbyteCache()
  beforeEach(() => {
    globalThis.fetch = mockFetch
    costResponse = costOk
  })
  after(() => {
    globalThis.fetch = realFetch
    cache.restore()
  })

  it('returns the exact tariff for the chosen courier + service', async () => {
    const fee = await calculateOrderShippingFee({ villageId: VILLAGE_ID, courier: 'JNE', service: 'REG', weightGrams: 1000 })
    assert.equal(fee, 12000)
  })

  it('maps the kelurahan to the right BinderByte location and sends weight in kg', async () => {
    await calculateShippingRates({ villageId: VILLAGE_ID, weightGrams: 700 })
    assert.equal(lastCostParams.get('destination'), 'village_73328')
    assert.equal(lastCostParams.get('weight'), '0.7')
  })

  it('rejects a courier service that is not offered for the route (no substitute fee)', async () => {
    await assert.rejects(
      calculateOrderShippingFee({ villageId: VILLAGE_ID, courier: 'JNE', service: 'YES', weightGrams: 1100 }),
      { statusCode: 400 }
    )
  })

  it('fails instead of estimating when BinderByte cannot price the route', async () => {
    costResponse = { code: '400', message: 'Invalid origin or destination prefix IDs' }
    await assert.rejects(calculateShippingRates({ villageId: VILLAGE_ID, weightGrams: 1200 }), { statusCode: 503 })
  })

  it('falls back to another kelurahan in the same kecamatan when the name is spelled differently', async () => {
    await calculateShippingRates({ villageId: '36.71.11.1006', weightGrams: 1300 })
    assert.equal(lastCostParams.get('destination'), 'village_73327')
  })

  it('finds the kecamatan by name (matching kabupaten/kota) when the kelurahan has no postal code', async () => {
    await calculateShippingRates({ villageId: '36.71.11.1009', weightGrams: 1400 })
    assert.equal(lastCostParams.get('destination'), 'village_73326')
  })

  it('never prices a kelurahan using a location from another kecamatan', async () => {
    lastCostParams = null
    await assert.rejects(calculateShippingRates({ villageId: '36.71.12.1001', weightGrams: 1500 }), { statusCode: 503 })
    assert.equal(lastCostParams, null)
  })

  it('stores the kelurahan → location mapping under a versioned cache key', async () => {
    await calculateShippingRates({ villageId: VILLAGE_ID, weightGrams: 1600 })
    assert.ok([...cache.rows.keys()].some(key => /^location:v\d+:36\.71\.11\.1005$/.test(key)))
  })

  it('rejects a well-formed but non-existent kelurahan with 400', async () => {
    await assert.rejects(calculateShippingRates({ villageId: '36.71.99.1001', weightGrams: 1000 }), { statusCode: 400 })
  })

  it('rejects invalid weight and malformed village IDs', async () => {
    await assert.rejects(calculateShippingRates({ villageId: VILLAGE_ID, weightGrams: 0 }), { statusCode: 400 })
    await assert.rejects(calculateShippingRates({ villageId: '../../x', weightGrams: 1000 }), { statusCode: 400 })
  })
})
