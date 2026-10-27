import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('Product Variant Business Logic Tests', () => {
  it('should auto-compute total stock and minimum price from variants list', () => {
    const rawVariants = [
      { name: 'Kecil', price: '35000', stock: '20', weight: 400 },
      { name: 'Sedang', price: '50000', stock: '15', weight: 700 },
      { name: 'Besar', price: '75000', stock: '10', weight: 1200 },
    ]

    const parsedVariants = rawVariants.map(v => ({
      name: v.name,
      price: parseFloat(v.price) || 0,
      stock: parseInt(v.stock, 10) || 0,
      weight: v.weight ? parseInt(v.weight, 10) : null,
    }))

    const totalStock = parsedVariants.reduce((sum, v) => sum + v.stock, 0)
    const minPrice = Math.min(...parsedVariants.map(v => v.price))
    const maxPrice = Math.max(...parsedVariants.map(v => v.price))

    assert.equal(totalStock, 45, 'Total stock should sum up to 45 (20 + 15 + 10)')
    assert.equal(minPrice, 35000, 'Minimum price should be 35000')
    assert.equal(maxPrice, 75000, 'Maximum price should be 75000')
  })

  it('should generate composite cartKey to prevent collision between variants of same product', () => {
    const productId = 'prod-pel-123'
    const variant1Id = 'var-kecil-001'
    const variant2Id = 'var-besar-002'

    const getCartKey = (pId, vId) => (vId ? `${pId}-${vId}` : pId)

    const key1 = getCartKey(productId, variant1Id)
    const key2 = getCartKey(productId, variant2Id)
    const keySingle = getCartKey(productId, null)

    assert.equal(key1, 'prod-pel-123-var-kecil-001')
    assert.equal(key2, 'prod-pel-123-var-besar-002')
    assert.equal(keySingle, 'prod-pel-123')
    assert.notEqual(key1, key2, 'Keys for different variants must never collide')
  })

  it('should accurately calculate total parcel weight using variant weights when available', () => {
    const orderItems = [
      {
        quantity: 2,
        product: { weight: 1000 },
        variant: { weight: 500 }, // Specific variant weight (500g)
      },
      {
        quantity: 1,
        product: { weight: 1200 },
        variant: null, // No variant, uses base product weight (1200g)
      },
      {
        quantity: 1,
        product: { weight: null },
        variant: null, // Fallback default (1000g)
      },
    ]

    let calculatedWeight = 0
    for (const item of orderItems) {
      const itemWeight = Number(item.variant?.weight ?? item.product?.weight ?? 1000)
      calculatedWeight += itemWeight * item.quantity
    }

    // 2 * 500 = 1000
    // 1 * 1200 = 1200
    // 1 * 1000 = 1000
    // Total = 3200 grams
    assert.equal(calculatedWeight, 3200, 'Total weight should accurately sum to 3200 grams')
  })
})
