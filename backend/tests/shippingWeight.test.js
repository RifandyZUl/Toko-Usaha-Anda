import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import prisma from '../src/config/database.js'
import { getItemsWeightGrams, itemWeightGrams } from '../src/services/shippingService.js'

const PRODUCT_A = '11111111-1111-4111-8111-111111111111'
const PRODUCT_B = '22222222-2222-4222-8222-222222222222'
const VARIANT_B1 = '33333333-3333-4333-8333-333333333333'

// Fake product table so the weight rule is tested without a database
const products = [
  { id: PRODUCT_A, weight: 180, variants: [] },
  { id: PRODUCT_B, weight: null, variants: [{ id: VARIANT_B1, weight: 2500 }] },
]

describe('Shipping weight (server-side, shared with order creation)', () => {
  const realDelegate = Object.getOwnPropertyDescriptor(prisma, 'product')
  before(() => {
    const fake = { findMany: async ({ where }) => products.filter(p => where.id.in.includes(p.id)) }
    Object.defineProperty(prisma, 'product', { value: fake, configurable: true, writable: true })
  })
  after(() => {
    if (realDelegate) Object.defineProperty(prisma, 'product', realDelegate)
    else delete prisma.product
  })

  it('prefers variant weight, then product weight, then 1 kg', () => {
    assert.equal(itemWeightGrams({ weight: 180 }, { weight: 2500 }), 2500)
    assert.equal(itemWeightGrams({ weight: 180 }, null), 180)
    assert.equal(itemWeightGrams({ weight: null }, null), 1000)
  })

  it('sums database weights × quantity (ignores any client-side weight)', async () => {
    const grams = await getItemsWeightGrams([
      { productId: PRODUCT_A, variantId: null, quantity: 3, weight: 1 },
      { productId: PRODUCT_B, variantId: VARIANT_B1, quantity: 2 },
    ])
    assert.equal(grams, 3 * 180 + 2 * 2500)
  })

  it('rejects unknown products or variants that do not belong to the product', async () => {
    await assert.rejects(getItemsWeightGrams([{ productId: PRODUCT_B, quantity: 1, variantId: '44444444-4444-4444-8444-444444444444' }]), { statusCode: 400 })
    await assert.rejects(getItemsWeightGrams([{ productId: '55555555-5555-4555-8555-555555555555', quantity: 1 }]), { statusCode: 400 })
  })
})
