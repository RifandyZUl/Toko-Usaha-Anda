import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { checkIdempotency } from '../src/middleware/idempotency.js'
import { HTTP_STATUS } from '../src/constants/index.js'

describe('Idempotency Middleware Tests', () => {
  it('should call next() when no idempotency key is provided', () => {
    let nextCalled = false
    const req = { headers: {}, userId: 'user-1' }
    const res = {}
    const next = () => { nextCalled = true }

    checkIdempotency(req, res, next)
    assert.equal(nextCalled, true)
  })

  it('should block concurrent requests with identical idempotency key (HTTP 409 Conflict)', () => {
    const key = `test-key-${Date.now()}`
    const req1 = { headers: { 'x-idempotency-key': key }, userId: 'user-lock' }
    let req1NextCalled = false
    const res1 = {
      json(body) { return body },
      status() { return this },
    }
    const next1 = () => { req1NextCalled = true }

    // First request begins processing
    checkIdempotency(req1, res1, next1)
    assert.equal(req1NextCalled, true)

    // Second concurrent request with same key
    const req2 = { headers: { 'x-idempotency-key': key }, userId: 'user-lock' }
    let res2Status = null
    let res2Body = null
    const res2 = {
      status(code) {
        res2Status = code
        return this
      },
      json(data) {
        res2Body = data
        return this
      },
    }
    let req2NextCalled = false
    const next2 = () => { req2NextCalled = true }

    checkIdempotency(req2, res2, next2)
    assert.equal(req2NextCalled, false, 'Next should not be called for duplicate concurrent request')
    assert.equal(res2Status, HTTP_STATUS.CONFLICT)
    assert.match(res2Body.error, /sedang diproses/)
  })

  it('should return cached response when request was completed previously', () => {
    const key = `completed-key-${Date.now()}`
    const req1 = { headers: { 'x-idempotency-key': key }, userId: 'user-cache' }
    let capturedBody = null
    let originalJsonCalled = false
    const res1 = {
      statusCode: 201,
      status(code) {
        this.statusCode = code
        return this
      },
      json(data) {
        originalJsonCalled = true
        capturedBody = data
        return this
      },
    }

    checkIdempotency(req1, res1, () => {})

    // Simulate completion
    const mockOrderPayload = { id: 'order-123', status: 'PENDING', totalAmount: 50000 }
    res1.json(mockOrderPayload)
    assert.equal(originalJsonCalled, true)

    // Subsequent request with the same idempotency key
    const req2 = { headers: { 'x-idempotency-key': key }, userId: 'user-cache' }
    let res2Status = null
    let res2Body = null
    const res2 = {
      status(code) {
        res2Status = code
        return this
      },
      json(data) {
        res2Body = data
        return this
      },
    }
    let req2NextCalled = false

    checkIdempotency(req2, res2, () => { req2NextCalled = true })
    assert.equal(req2NextCalled, false, 'Next should not be called when cached')
    assert.equal(res2Status, 201)
    assert.deepEqual(res2Body, mockOrderPayload)
  })
})
