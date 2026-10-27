import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('Smart Cart Merge Unit Tests', () => {
  it('should merge quantities when guest item already exists in user cart', () => {
    const existingDbItems = [
      { id: 'item-1', productId: 'p1', variantId: 'v1', quantity: 2 },
      { id: 'item-2', productId: 'p2', variantId: null, quantity: 1 },
    ]

    const guestItems = [
      { productId: 'p1', variantId: 'v1', quantity: 3 }, // Same product & variant
      { productId: 'p3', variantId: null, quantity: 1 }, // New product
    ]

    const maxStockMap = {
      'p1:v1': 10,
      'p3:null': 5,
    }

    const merged = [...existingDbItems]

    for (const gItem of guestItems) {
      const match = merged.find(
        m => m.productId === gItem.productId && (m.variantId || null) === (gItem.variantId || null)
      )
      const stockKey = `${gItem.productId}:${gItem.variantId || null}`
      const maxStock = maxStockMap[stockKey] || 99

      if (match) {
        match.quantity = Math.min(match.quantity + gItem.quantity, maxStock)
      } else {
        merged.push({
          id: `item-${Date.now()}-${Math.random()}`,
          productId: gItem.productId,
          variantId: gItem.variantId,
          quantity: Math.min(gItem.quantity, maxStock),
        })
      }
    }

    // Item p1:v1 should have 2 + 3 = 5
    const p1Item = merged.find(m => m.productId === 'p1' && m.variantId === 'v1')
    assert.equal(p1Item.quantity, 5)

    // Pre-existing item p2:null should still remain intact with quantity 1
    const p2Item = merged.find(m => m.productId === 'p2')
    assert.ok(p2Item)
    assert.equal(p2Item.quantity, 1)

    // New item p3 should be appended
    const p3Item = merged.find(m => m.productId === 'p3')
    assert.ok(p3Item)
    assert.equal(p3Item.quantity, 1)

    // Total items in cart should be 3
    assert.equal(merged.length, 3)
  })

  it('should cap merged quantity at maximum available variant stock', () => {
    const existingItem = { productId: 'p1', variantId: 'v1', quantity: 4 }
    const incomingQty = 5
    const variantStock = 6

    const safeQty = Math.min(existingItem.quantity + incomingQty, variantStock)
    assert.equal(safeQty, 6, 'Merged quantity must not exceed maximum variant stock (6)')
  })
})
