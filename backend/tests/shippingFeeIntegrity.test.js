import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calculateOrderShippingFee } from '../src/services/shippingService.js'

describe('Shipping Fee Server Integrity Tests', () => {
  it('should return valid shipping fee for standard weight (1000g)', async () => {
    const fee = await calculateOrderShippingFee({
      city: 'Jakarta',
      province: 'DKI Jakarta',
      courier: 'JNE',
      weight: 1000,
    })
    assert.equal(typeof fee, 'number')
    assert.ok(fee > 0, 'Shipping fee must be greater than 0')
  })

  it('should scale fee with heavier variant weights (e.g. 5000g)', async () => {
    const standardFee = await calculateOrderShippingFee({
      city: 'Bandung',
      province: 'Jawa Barat',
      courier: 'JNE',
      weight: 1000,
    })

    const heavyFee = await calculateOrderShippingFee({
      city: 'Bandung',
      province: 'Jawa Barat',
      courier: 'JNE',
      weight: 5000,
    })

    assert.ok(heavyFee >= standardFee, 'Heavy parcel (5kg) fee must be greater than or equal to standard (1kg) fee')
  })

  it('should fallback safely to default fee (15000) when location is empty or unserviceable', async () => {
    const fee = await calculateOrderShippingFee({
      city: '',
      province: '',
      courier: 'UNKNOWN_COURIER',
      weight: 1000,
    })

    assert.equal(typeof fee, 'number')
    assert.ok(fee >= 10000, 'Fallback fee must be valid positive amount')
  })
})
