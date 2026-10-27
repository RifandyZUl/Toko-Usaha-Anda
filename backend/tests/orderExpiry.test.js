import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isOrderExpired } from '../src/services/orderExpiryService.js'

describe('Order Expiry Rules Tests', () => {
  it('should not expire COD orders regardless of age', () => {
    const oldCodOrder = {
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: 'COD',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days old
    }

    assert.equal(isOrderExpired(oldCodOrder), false)
  })

  it('should not expire already paid or completed orders', () => {
    const paidOrder = {
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      paymentMethod: 'MIDTRANS',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    }

    assert.equal(isOrderExpired(paidOrder), false)
  })

  it('should respect QRIS 15-minute expiration window', () => {
    const recentQris = {
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: 'QRIS',
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    }
    assert.equal(isOrderExpired(recentQris), false, 'Recent QRIS within 15 min should not be expired')

    const expiredQris = {
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: 'QRIS',
      createdAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(), // 16 minutes ago
    }
    assert.equal(isOrderExpired(expiredQris), true, 'QRIS older than 15 min should be expired')
  })

  it('should respect Virtual Account / Midtrans 24-hour window', () => {
    const recentVa = {
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: 'TRANSFER_BCA',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    }
    assert.equal(isOrderExpired(recentVa), false, 'VA within 24h should not be expired')

    const expiredVa = {
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: 'TRANSFER_BCA',
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
    }
    assert.equal(isOrderExpired(expiredVa), true, 'VA older than 24h should be expired')
  })

  it('should respect explicit expiredAt from gateway details', () => {
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const pastExpiry = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const order1 = {
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: 'MIDTRANS',
      createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), // Old created date
      paymentDetails: { expiredAt: futureExpiry }, // But gateway allowed extension
    }
    assert.equal(isOrderExpired(order1), false)

    const order2 = {
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: 'MIDTRANS',
      createdAt: new Date().toISOString(),
      paymentDetails: { expiredAt: pastExpiry },
    }
    assert.equal(isOrderExpired(order2), true)
  })
})
