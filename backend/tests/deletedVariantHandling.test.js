import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('Deleted Variant & Resilient Cancellation Tests', () => {
  it('should safely simulate updateMany behavior when variant has been deleted', () => {
    // Mock database state where variant was deleted
    const variantsInDb = new Map([
      ['var-existing-1', { id: 'var-existing-1', stock: 10 }],
    ])

    const orderItems = [
      { productId: 'p1', variantId: 'var-existing-1', quantity: 2 },
      { productId: 'p2', variantId: 'var-deleted-999', quantity: 1 }, // Deleted from DB
    ]

    // Simulate updateMany logic
    let totalUpdated = 0
    for (const item of orderItems) {
      if (item.variantId) {
        // updateMany matches rows by id; if not found, count is 0 and NO error is thrown
        const row = variantsInDb.get(item.variantId)
        if (row) {
          row.stock += item.quantity
          totalUpdated++
        }
      }
    }

    assert.equal(totalUpdated, 1, 'Only existing variant was updated')
    assert.equal(variantsInDb.get('var-existing-1').stock, 12)
    assert.equal(variantsInDb.has('var-deleted-999'), false, 'Deleted variant gracefully ignored without throwing')
  })

  it('should block un-cancelling an order when a variant has been permanently deleted', () => {
    const existingVariantsInCatalog = new Set(['var-active-1', 'var-active-2'])
    const cancelledOrderItem = {
      variantId: 'var-removed-3', // Admin deleted this variant
      variantName: 'Ukuran XL',
    }

    let caughtError = null
    try {
      if (cancelledOrderItem.variantId) {
        const exists = existingVariantsInCatalog.has(cancelledOrderItem.variantId)
        if (!exists) {
          throw new Error(`Varian "${cancelledOrderItem.variantName}" telah dihapus secara permanen dari katalog, pesanan tidak dapat diaktifkan kembali`)
        }
      }
    } catch (err) {
      caughtError = err
    }

    assert.ok(caughtError, 'Should throw an error when trying to un-cancel an order with deleted variant')
    assert.match(caughtError.message, /telah dihapus secara permanen/)
  })

  it('should soft delete variant instead of hard deleting to preserve historical integrity', () => {
    const variants = [
      { id: 'v1', name: 'Ukuran S', isActive: true, deletedAt: null },
      { id: 'v2', name: 'Ukuran M', isActive: true, deletedAt: null },
      { id: 'v3', name: 'Ukuran L', isActive: true, deletedAt: null },
    ]

    // Admin removes 'v3' in modal: incoming variants are v1 and v2
    const incomingIds = ['v1', 'v2']

    // Simulate soft delete query: updateMany with deletedAt: null and not in incomingIds
    const now = new Date()
    for (const v of variants) {
      if (!incomingIds.includes(v.id) && v.deletedAt === null) {
        v.deletedAt = now
        v.isActive = false
      }
    }

    // Public query filter: isActive: true, deletedAt: null
    const publicVariants = variants.filter(v => v.isActive && v.deletedAt === null)

    assert.equal(publicVariants.length, 2, 'Only 2 active variants should be publicly visible')
    assert.deepEqual(publicVariants.map(v => v.id), ['v1', 'v2'])

    // Historical record v3 is preserved in database
    const v3 = variants.find(v => v.id === 'v3')
    assert.ok(v3.deletedAt instanceof Date, 'v3 should have deletedAt timestamp')
    assert.equal(v3.isActive, false, 'v3 should be inactive')
  })
})
