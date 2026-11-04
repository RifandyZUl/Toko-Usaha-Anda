import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pickSelectedCartItems } from '../src/controllers/orderController.js'

const cart = [
  { id: 'c1', productId: 'p1', variantId: null, quantity: 1 },
  { id: 'c2', productId: 'p2', variantId: 'v1', quantity: 2 },
  { id: 'c3', productId: 'p2', variantId: 'v2', quantity: 1 },
]

describe('Selective checkout - pickSelectedCartItems', () => {
  it('returns only the selected cart rows (other cart items untouched)', () => {
    const picked = pickSelectedCartItems(cart, [{ productId: 'p2', variantId: 'v1' }])
    assert.deepEqual(picked.map(i => i.id), ['c2'])
  })

  it('distinguishes variants of the same product', () => {
    const picked = pickSelectedCartItems(cart, [{ productId: 'p2', variantId: 'v2' }])
    assert.deepEqual(picked.map(i => i.id), ['c3'])
  })

  it('treats missing/undefined variantId as no-variant product', () => {
    const picked = pickSelectedCartItems(cart, [{ productId: 'p1' }])
    assert.deepEqual(picked.map(i => i.id), ['c1'])
  })

  it('returns null when a selected item is not in the server cart', () => {
    assert.equal(pickSelectedCartItems(cart, [{ productId: 'p1' }, { productId: 'p9' }]), null)
  })

  it('ignores duplicate selections of the same item', () => {
    const picked = pickSelectedCartItems(cart, [{ productId: 'p1' }, { productId: 'p1', variantId: null }])
    assert.deepEqual(picked.map(i => i.id), ['c1'])
  })
})
