import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildBuyNowItem } from '../src/controllers/orderController.js'

const activeVariant = { id: 'v1', isActive: true, deletedAt: null }
const deletedVariant = { id: 'v2', isActive: true, deletedAt: new Date() }
const simpleProduct = { id: 'p1', isActive: true, variants: [] }
const variantProduct = { id: 'p2', isActive: true, variants: [activeVariant, deletedVariant] }

describe('Buy Now - buildBuyNowItem', () => {
  it('builds a cart-row-shaped item for a product without variants', () => {
    const { item, error } = buildBuyNowItem(simpleProduct, null, 3)
    assert.equal(error, undefined)
    assert.equal(item.productId, 'p1')
    assert.equal(item.variantId, null)
    assert.equal(item.quantity, 3)
    assert.equal(item.id, undefined)
  })

  it('attaches the selected active variant', () => {
    const { item } = buildBuyNowItem(variantProduct, 'v1', 1)
    assert.equal(item.variantId, 'v1')
    assert.equal(item.variant, activeVariant)
  })

  it('rejects missing or inactive products', () => {
    assert.ok(buildBuyNowItem(null, null, 1).error)
    assert.ok(buildBuyNowItem({ ...simpleProduct, isActive: false }, null, 1).error)
  })

  it('rejects deleted, foreign, or missing variant selection', () => {
    assert.ok(buildBuyNowItem(variantProduct, 'v2', 1).error)
    assert.ok(buildBuyNowItem(variantProduct, 'v-other', 1).error)
    assert.ok(buildBuyNowItem(variantProduct, null, 1).error)
    assert.ok(buildBuyNowItem(simpleProduct, 'v1', 1).error)
  })

  it('rejects invalid quantities', () => {
    for (const qty of [0, -1, 1.5, undefined, '2']) {
      assert.ok(buildBuyNowItem(simpleProduct, null, qty).error, `qty=${qty}`)
    }
  })
})
