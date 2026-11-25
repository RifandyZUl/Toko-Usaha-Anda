import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import prisma from '../src/config/database.js'
import { trackOrderShipping } from '../src/services/shippingTrackingService.js'
import { updateOrderStatus } from '../src/controllers/orderController.js'
import productService from '../src/services/productService.js'
import { binderbyteGet } from '../src/services/binderbyteClient.js'

const env = { ...process.env }
const realFetch = globalThis.fetch
const saved = {}
const fake = (key, value) => {
  if (!(key in saved)) saved[key] = prisma[key]
  prisma[key] = value
}
afterEach(() => {
  process.env = { ...env }
  globalThis.fetch = realFetch
  Object.assign(prisma, saved)
})

// getOrLoad's DB cache layer: always a miss, writes ignored
const noDbCache = () => fake('binderbyteCache', { async findUnique() { return null }, async upsert() {} })

describe('order tracking never invents checkpoints', () => {
  const order = waybill => ({
    id: 'o1',
    shippingCourier: 'JNE REG',
    shippingAddress: 'Budi | Jl. Mawar 1, Kel, Kec, Kota Tangerang, Banten 15144',
    paymentDetails: { shippingDetails: { trackingNumber: waybill } },
  })

  it('reports "not available" when no waybill was entered', async () => {
    const result = await trackOrderShipping(order(undefined))
    assert.equal(result.available, false)
    assert.deepEqual(result.history, [])
  })

  it('treats the old server-made RESI- placeholder as no waybill', async () => {
    let called = false
    globalThis.fetch = async () => { called = true; return { json: async () => ({}) } }
    const result = await trackOrderShipping(order('RESI-JNE-ABCDEF12'))
    assert.equal(result.available, false)
    assert.equal(result.waybillNumber, null)
    assert.equal(called, false, 'no courier quota spent on a placeholder')
  })

  it('reports "not available" (not a fake timeline) when the courier has no data', async () => {
    process.env.BINDERBYTE_API_KEY = 'test-key'
    noDbCache()
    globalThis.fetch = async () => ({ status: 200, json: async () => ({ status: 400, message: 'Not found' }) })
    const result = await trackOrderShipping(order('JP1111111111'))
    assert.equal(result.available, false)
    assert.equal(result.waybillNumber, 'JP1111111111')
    assert.deepEqual(result.history, [])
  })

  it('returns courier history when BinderByte has it', async () => {
    process.env.BINDERBYTE_API_KEY = 'test-key'
    noDbCache()
    const data = { summary: { status: 'ON PROCESS', waybill_number: 'JP2222222222' }, history: [{ date: '2026-11-20 10:00', desc: 'Paket diterima', location: 'TANGERANG' }] }
    globalThis.fetch = async () => ({ status: 200, json: async () => ({ status: 200, data }) })
    const result = await trackOrderShipping(order('JP2222222222'))
    assert.equal(result.available, true)
    assert.equal(result.history[0].desc, 'Paket diterima')
  })
})

describe('admin marks an order as shipped', () => {
  const call = async body => {
    fake('order', { async findUnique() { return { id: 'o1', status: 'PROCESSING', paymentStatus: 'PAID', items: [], paymentDetails: null } } })
    const res = { code: 200, body: null, status(c) { this.code = c; return this }, json(b) { this.body = b; return this } }
    await updateOrderStatus({ params: { id: 'o1' }, body }, res, err => { throw err })
    return res
  }

  it('requires a real courier waybill', async () => {
    const res = await call({ status: 'SHIPPED' })
    assert.equal(res.code, 400)
    assert.match(res.body.error, /resi/i)
  })
})

describe('admin product save keeps sales made while the form was open', () => {
  // Fake product/variant tables honoring updateMany({ where: { stock: { gte } }, data: { stock: { increment } } })
  const useStore = ({ productStock, variants = [] }) => {
    const product = { id: 'p1', slug: 'p', stock: productStock }
    const rows = new Map(variants.map(v => [v.id, { productId: 'p1', deletedAt: null, ...v }]))
    const applyData = (row, data) => {
      for (const [k, v] of Object.entries(data)) row[k] = v?.increment !== undefined ? row[k] + v.increment : v
    }
    const okStock = (row, where) => !where.stock || row.stock >= where.stock.gte
    const tx = {
      product: {
        async updateMany({ where, data }) {
          if (!okStock(product, where)) return { count: 0 }
          applyData(product, data)
          return { count: 1 }
        },
        async update({ data }) { applyData(product, data); return { ...product, variants: [...rows.values()] } },
      },
      productVariant: {
        async updateMany({ where, data }) {
          let count = 0
          for (const row of rows.values()) {
            if (where.id && where.id !== row.id) continue
            if (where.id?.notIn) continue
            if (where.productId && where.productId !== row.productId) continue
            if (!okStock(row, where)) continue
            applyData(row, data)
            count++
          }
          return { count }
        },
        async create({ data }) { rows.set('new', { id: 'new', ...data }) },
        async aggregate() {
          return { _sum: { stock: [...rows.values()].filter(r => r.deletedAt === null).reduce((s, r) => s + r.stock, 0) } }
        },
      },
    }
    fake('product', { ...tx.product, async findUnique() { return { ...product, variants: [...rows.values()] } } })
    fake('$transaction', fn => fn(tx))
    return { product, rows }
  }

  it('applies a simple-product edit as a change (form 10 -> 12 while 3 sold = 9)', async () => {
    const { product } = useStore({ productStock: 7 })
    await productService.updateProduct('p1', { name: 'X', stock: 12, originalStock: 10 })
    assert.equal(product.stock, 9)
  })

  it('refuses an edit that would go below zero because of those sales', async () => {
    useStore({ productStock: 2 })
    await assert.rejects(productService.updateProduct('p1', { stock: 3, originalStock: 10 }), err => err.statusCode === 409)
  })

  it('applies variant edits as changes and sums the product stock afterwards', async () => {
    const { product, rows } = useStore({ productStock: 7, variants: [{ id: 'v1', stock: 7 }] })
    await productService.updateProduct('p1', {
      variants: [{ id: 'v1', name: 'Kecil', price: 1000, stock: 15, originalStock: 10 }],
    })
    assert.equal(rows.get('v1').stock, 12)
    assert.equal(product.stock, 12)
  })
})

describe('BinderByte rate limit (60 req/min)', () => {
  it('retries once after a 429 and returns the data', async () => {
    process.env.BINDERBYTE_API_KEY = 'test-key'
    let calls = 0
    globalThis.fetch = async () => {
      calls++
      return calls === 1
        ? { status: 429, json: async () => { throw new SyntaxError('HTML') } }
        : { status: 200, json: async () => ({ code: '200', value: [] }) }
    }
    const json = await binderbyteGet('/wilayah/provinsi')
    assert.equal(json.code, '200')
    assert.equal(calls, 2)
  })

  it('gives a clear "busy" error if still rate limited', async () => {
    process.env.BINDERBYTE_API_KEY = 'test-key'
    globalThis.fetch = async () => ({ status: 429, json: async () => { throw new SyntaxError('HTML') } })
    await assert.rejects(binderbyteGet('/wilayah/provinsi'), err => err.statusCode === 503 && /sibuk/.test(err.message))
  })
})
