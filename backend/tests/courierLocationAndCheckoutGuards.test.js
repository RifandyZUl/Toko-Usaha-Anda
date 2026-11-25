import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import prisma from '../src/config/database.js'
import { findLocationId } from '../src/services/shippingService.js'
import paymentService from '../src/services/paymentService.js'
import { addToCart } from '../src/controllers/cartController.js'
import { validateCreateOrder } from '../src/middleware/validate.js'

const env = { ...process.env }
const realFetch = globalThis.fetch
afterEach(() => {
  process.env = { ...env }
  globalThis.fetch = realFetch
})

// Fake BinderByte /v1/locations: search text -> rows (shapes copied from live responses)
const useLocations = table => {
  process.env.BINDERBYTE_API_KEY = 'test-key'
  const searches = []
  globalThis.fetch = async url => {
    const search = new URL(url).searchParams.get('search')
    searches.push(search)
    return { json: async () => ({ code: '200', data: table[search] || [] }) }
  }
  return searches
}
const loc = (id, label) => ({ id, type: 'village', label })

describe('findLocationId (kelurahan -> BinderByte cost location)', () => {
  it('ignores Kemendagri-coded IDs that /v1/cost rejects (Kalimantan Barat case)', async () => {
    useLocations({
      79460: [loc('village_61.01.01.2001', 'Dalam Kaum, Sambas, Sambas (79460)')],
      'Dalam Kaum': [loc('village_59456', 'Dalam Kaum, Sambas, Sambas, Kalimantan Barat, 79462')],
    })
    const id = await findLocationId({ name: 'Dalam Kaum', postalCode: '79460', districtName: 'Sambas', regencyName: 'KAB. SAMBAS' })
    assert.equal(id, 'village_59456')
  })

  it('finds a kelurahan whose kecamatan is spelled differently (Klumbayan vs Kelumbayan)', async () => {
    useLocations({
      Lengkukai: [loc('village_76229', 'Lengkukai, Kelumbayan Barat, Tanggamus, Lampung, 35379')],
    })
    const id = await findLocationId({ name: 'Lengkukai', postalCode: '35389', districtName: 'Klumbayan Barat', regencyName: 'KAB. TANGGAMUS' })
    assert.equal(id, 'village_76229')
  })

  it('accepts an added word like "Pulau" only when the kecamatan also matches', async () => {
    useLocations({
      'Bunyu Barat': [
        loc('village_76984', 'Liang Bunyu, Sebatik Barat, Nunukan, Kalimantan Utara, 77483'),
        loc('village_76675', 'Pulau Bunyu Barat, Pulau Bunyu, Bulungan, Kalimantan Utara, 77281'),
      ],
    })
    const id = await findLocationId({ name: 'Bunyu Barat', districtName: 'Bunyu', regencyName: 'KAB. BULUNGAN' })
    assert.equal(id, 'village_76675')
  })

  it('matches the alternative spelling BinderByte puts in brackets (Bangko Pusaka (pusako))', async () => {
    useLocations({
      28993: [],
      'Bangko Pusako': [
        loc('village_50636', 'Bangko Bakti, Bangko Pusaka (pusako), Rokan Hilir, Riau, 28992'),
        loc('village_50646', 'Bangko Pusaka (pusako), Bangko Pusaka (pusako), Rokan Hilir, Riau, 28983'),
      ],
    })
    const id = await findLocationId({ name: 'Bangko Pusako', postalCode: '28993', districtName: 'Bangko Pusako', regencyName: 'KAB. ROKAN HILIR' })
    assert.equal(id, 'village_50646')
  })

  it('never picks a same-named kelurahan in another kabupaten', async () => {
    useLocations({
      Sukamaju: [loc('village_1', 'Sukamaju, Sukamaju, Bogor, Jawa Barat, 16000')],
      Sukaraja: [loc('village_2', 'Sukamaju, Sukaraja, Bogor, Jawa Barat, 16000')],
    })
    const id = await findLocationId({ name: 'Sukamaju', districtName: 'Sukaraja', regencyName: 'KAB. LAMPUNG SELATAN' })
    assert.equal(id, null)
  })
})

describe('payment mock fallback', () => {
  const order = { id: 'o1', totalAmount: 100000, shippingFee: 20000 }

  for (const nodeEnv of ['production', 'test']) {
    it(`throws instead of returning a fake QRIS / VA when NODE_ENV=${nodeEnv}`, async () => {
      process.env.NODE_ENV = nodeEnv
      paymentService.serverKey = 'test-server-key'
      const body = { status_code: '402', status_message: 'Payment channel is not activated.' }
      globalThis.fetch = async () => ({ ok: false, status: 402, json: async () => body, text: async () => JSON.stringify(body) })
      const notTypeError = err => !(err instanceof TypeError)
      await assert.rejects(paymentService.chargeQris(order, [], {}, '0812', 'Alamat'), notTypeError)
      await assert.rejects(paymentService.chargeVirtualAccount(order, [], {}, '0812', 'Alamat', 'BCA'), notTypeError)
    })
  }

  it('still returns mock codes in development', async () => {
    process.env.NODE_ENV = 'development'
    globalThis.fetch = async () => { throw new Error('offline') }
    const result = await paymentService.chargeQris(order, [], {}, '0812', 'Alamat')
    assert.equal(result.isMock, true)
  })
})

describe('checkout guards', () => {
  const originalProduct = prisma.product
  beforeEach(() => { prisma.product = originalProduct })
  afterEach(() => { prisma.product = originalProduct })

  it('refuses to add an inactive product to the cart', async () => {
    prisma.product = { async findUnique() { return { id: 'p1', isActive: false, stock: 10, variants: [] } } }
    const res = { code: 200, status(c) { this.code = c; return this }, json() { return this } }
    await addToCart({ body: { productId: 'p1', quantity: 1 }, userId: 'u1' }, res, err => { throw err })
    assert.equal(res.code, 404)
  })

  for (const method of ['CASH', 'TRANSFER']) {
    it(`rejects payment method ${method}`, async () => {
      const req = {
        body: {
          receiverName: 'Budi', shippingPhone: '081234567890', addressDetail: 'Jl. Mawar No. 1 RT 01',
          province: 'Banten', city: 'Tangerang', villageId: '36.71.11.1005', shippingCourier: 'JNE',
          shippingService: 'REG', shippingFee: 10000, paymentMethod: method,
          items: [{ productId: '11111111-2222-4333-8444-555555555555' }],
        },
      }
      const res = { code: 200, body: null, status(c) { this.code = c; return this }, json(b) { this.body = b; return this } }
      let reachedController = false
      for (const step of validateCreateOrder) {
        let next = false
        await step(req, res, () => { next = true })
        if (!next) break
        if (step === validateCreateOrder.at(-1)) reachedController = true
      }
      assert.equal(reachedController, false)
      assert.equal(res.code, 400)
      assert.match(JSON.stringify(res.body), /Metode pembayaran tidak valid/)
    })
  }
})
