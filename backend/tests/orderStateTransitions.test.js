import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import prisma from '../src/config/database.js'
import {
  cancelPendingOrderAndRestock,
  restockItems,
  updateOrderIfStatus,
  updateOrderIfUnchanged,
} from '../src/services/orderStockService.js'
import { applyMidtransStatus } from '../src/controllers/paymentController.js'

// In-memory tables. Each conditional updateMany checks + writes without yielding in between,
// like a row-locked UPDATE ... WHERE in Postgres; the awaited tick before it lets callers interleave.
const tick = () => new Promise(resolve => setImmediate(resolve))
const matches = (row, where) =>
  Object.entries(where).every(([key, cond]) => {
    if (cond === undefined) return true // Prisma ignores undefined filters
    if (cond instanceof Date) return row[key]?.getTime() === cond.getTime()
    return cond && typeof cond === 'object' && 'not' in cond ? row[key] !== cond.not : row[key] === cond
  })
let clock = 1
const nextUpdatedAt = () => new Date(Date.UTC(2026, 0, 1) + clock++) // every write bumps @updatedAt

function fakeDb() {
  const tables = {
    order: new Map(),
    product: new Map([['p1', { id: 'p1', stock: 10 }]]),
    productVariant: new Map([['v1', { id: 'v1', stock: 4 }]]),
  }
  const model = name => ({
    async updateMany({ where, data }) {
      await tick()
      let count = 0
      for (const row of tables[name].values()) {
        if (!matches(row, where)) continue
        for (const [key, value] of Object.entries(data)) {
          row[key] = value?.increment !== undefined ? row[key] + value.increment : value
        }
        if ('updatedAt' in row) row.updatedAt = nextUpdatedAt()
        count++
      }
      return { count }
    },
    async update({ where, data }) {
      await tick()
      return Object.assign(tables[name].get(where.id), data)
    },
    async findUnique({ where }) {
      return tables[name].get(where.id) ?? null
    },
  })
  const db = { tables, order: model('order'), product: model('product'), productVariant: model('productVariant') }
  db.$transaction = fn => fn(db)
  return db
}

const items = [
  { productId: 'p1', variantId: 'v1', quantity: 3 },
]

describe('order state transitions', () => {
  const original = {}
  let db

  beforeEach(() => {
    db = fakeDb()
    for (const key of ['order', 'product', 'productVariant', '$transaction']) {
      original[key] = prisma[key]
      prisma[key] = db[key]
    }
  })
  afterEach(() => Object.assign(prisma, original))

  const addOrder = fields => {
    const order = { id: 'o1', status: 'PENDING', paymentStatus: 'PENDING', totalAmount: 100000, shippingFee: 20000, items, ...fields }
    db.tables.order.set(order.id, order)
    return order
  }
  const stock = () => ({ product: db.tables.product.get('p1').stock, variant: db.tables.productVariant.get('v1').stock })

  it('restocks exactly once when cancel requests race', async () => {
    addOrder()
    const results = await Promise.all(Array.from({ length: 5 }, () => cancelPendingOrderAndRestock('o1', items)))
    assert.equal(results.filter(Boolean).length, 1)
    assert.deepEqual(stock(), { product: 13, variant: 7 })
    assert.equal(db.tables.order.get('o1').status, 'CANCELLED')
  })

  it('restocks variant stock too (payment-failure rollback path)', async () => {
    addOrder()
    await cancelPendingOrderAndRestock('o1', items)
    assert.equal(stock().variant, 7)
  })

  it('never cancels or restocks a paid order', async () => {
    addOrder({ status: 'PROCESSING', paymentStatus: 'PAID' })
    assert.equal(await cancelPendingOrderAndRestock('o1', items), false)
    assert.deepEqual(stock(), { product: 10, variant: 4 })
  })

  it('admin transitions: only one of two concurrent cancels wins and restocks', async () => {
    // Copy = what each request read from the DB before the race
    const order = { ...addOrder({ status: 'PROCESSING', paymentStatus: 'PAID' }) }
    const adminCancel = () =>
      prisma.$transaction(async tx => {
        await updateOrderIfStatus(tx, order, { status: 'CANCELLED' })
        await restockItems(tx, order.items)
      })
    const results = await Promise.allSettled([adminCancel(), adminCancel()])
    assert.deepEqual(results.map(r => r.status).sort(), ['fulfilled', 'rejected'])
    assert.equal(results.find(r => r.status === 'rejected').reason.statusCode, 409)
    assert.deepEqual(stock(), { product: 13, variant: 7 })
  })

  it('a dispute saved during auto-complete is never erased (paymentDetails JSON race)', async () => {
    addOrder({ status: 'SHIPPED', paymentStatus: 'PAID', updatedAt: nextUpdatedAt(), paymentDetails: { shippingDetails: { trackingNumber: 'JP1234567890' } } })
    // Both requests read the same version of the order
    const cronRead = structuredClone(db.tables.order.get('o1'))
    const customerRead = structuredClone(db.tables.order.get('o1'))

    const disputeSaved = await updateOrderIfUnchanged(customerRead, {
      paymentDetails: { ...customerRead.paymentDetails, disputeDetails: { status: 'PENDING_REVIEW' } },
    })
    const autoCompleteSaved = await updateOrderIfUnchanged(cronRead, {
      status: 'DELIVERED',
      paymentDetails: { ...cronRead.paymentDetails, shippingDetails: { completedBy: 'SYSTEM_AUTO_2_DAYS' } },
    })

    assert.equal(disputeSaved, true)
    assert.equal(autoCompleteSaved, false, 'stale writer must lose instead of overwriting')
    const saved = db.tables.order.get('o1')
    assert.equal(saved.status, 'SHIPPED')
    assert.equal(saved.paymentDetails.disputeDetails.status, 'PENDING_REVIEW')
  })

  it('admin transition fails with 409 if the order changed after the admin loaded it', async () => {
    addOrder({ status: 'SHIPPED', paymentStatus: 'PAID', updatedAt: nextUpdatedAt() })
    const adminRead = structuredClone(db.tables.order.get('o1'))
    await updateOrderIfUnchanged(structuredClone(adminRead), { paymentDetails: { reviews: [] } })

    await assert.rejects(
      prisma.$transaction(tx => updateOrderIfStatus(tx, adminRead, { status: 'DELIVERED' })),
      err => err.statusCode === 409
    )
  })

  describe('Midtrans notifications', () => {
    const notify = (order, transaction_status, gross_amount = '120000.00') =>
      applyMidtransStatus(order, { transaction_status, gross_amount, fraud_status: 'accept' })

    it('marks a pending order paid for the exact amount', async () => {
      const order = addOrder()
      assert.equal(await notify(order, 'settlement'), 'paid')
      assert.equal(db.tables.order.get('o1').paymentStatus, 'PAID')
    })

    it('refuses to mark paid when gross_amount does not match', async () => {
      const order = addOrder()
      assert.equal(await notify(order, 'settlement', '1000.00'), 'amount_mismatch')
      assert.equal(db.tables.order.get('o1').paymentStatus, 'PENDING')
      assert.equal(db.tables.order.get('o1').paymentDetails.amountMismatch.grossAmount, '1000.00')
    })

    it('records a late payment on a cancelled order without reopening it', async () => {
      const order = addOrder({ status: 'CANCELLED', paymentStatus: 'FAILED' })
      assert.equal(await notify(order, 'settlement'), 'paid_after_cancel')
      assert.equal(db.tables.order.get('o1').status, 'CANCELLED')
      assert.equal(db.tables.order.get('o1').paymentStatus, 'PAID', 'admin must see the money arrived')
      assert.equal(await notify(order, 'settlement'), 'ignored', 'replay changes nothing more')
      assert.deepEqual(stock(), { product: 10, variant: 4 })
    })

    it('ignores a replayed pending notification on a shipped order', async () => {
      const order = addOrder({ status: 'SHIPPED', paymentStatus: 'PAID' })
      assert.equal(await notify(order, 'pending'), 'ignored')
      assert.equal(db.tables.order.get('o1').status, 'SHIPPED')
    })

    it('restocks only once for repeated expire notifications', async () => {
      const order = addOrder()
      assert.equal(await notify(order, 'expire'), 'cancelled')
      assert.equal(await notify(order, 'expire'), 'ignored')
      assert.deepEqual(stock(), { product: 13, variant: 7 })
    })

    it('does not cancel a paid order on a late expire', async () => {
      const order = addOrder({ status: 'PROCESSING', paymentStatus: 'PAID' })
      assert.equal(await notify(order, 'expire'), 'ignored')
      assert.equal(db.tables.order.get('o1').status, 'PROCESSING')
    })

    it('refunds only a paid order', async () => {
      const unpaid = addOrder()
      assert.equal(await notify(unpaid, 'refund'), 'ignored')
      db.tables.order.get('o1').paymentStatus = 'PAID'
      assert.equal(await notify(unpaid, 'refund'), 'refunded')
      assert.equal(db.tables.order.get('o1').paymentStatus, 'REFUNDED')
    })
  })
})
