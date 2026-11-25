import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import prisma from '../src/config/database.js'
import { checkIdempotency } from '../src/middleware/idempotency.js'
import { HTTP_STATUS } from '../src/constants/index.js'

// In-memory stand-in for the idempotency_keys table, including its unique constraint on cacheKey.
// Lets the tests run without a database and exercise the concurrent path deterministically.
function createFakeStore() {
  const rows = new Map()
  const tick = () => new Promise(resolve => setImmediate(resolve))
  return {
    rows,
    async create({ data }) {
      await tick()
      if (rows.has(data.cacheKey)) throw Object.assign(new Error('Unique constraint'), { code: 'P2002' })
      rows.set(data.cacheKey, { ...data, updatedAt: new Date() })
      return rows.get(data.cacheKey)
    },
    async findUnique({ where }) {
      await tick()
      return rows.get(where.cacheKey) || null
    },
    async update({ where, data }) {
      await tick()
      rows.set(where.cacheKey, { ...rows.get(where.cacheKey), ...data })
    },
    async delete({ where }) {
      await tick()
      rows.delete(where.cacheKey)
    },
  }
}

function createRes() {
  return {
    statusCode: 200,
    sent: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.sent = body
      return this
    },
  }
}

// Runs the middleware and resolves once it either calls next() or sends a response
async function run(key, userId = 'user-1') {
  const req = { headers: key ? { 'x-idempotency-key': key } : {}, userId }
  const res = createRes()
  let nextCalled = false
  await checkIdempotency(req, res, () => { nextCalled = true })
  return { res, nextCalled }
}

describe('Idempotency Middleware Tests', () => {
  const realDelegate = Object.getOwnPropertyDescriptor(prisma, 'idempotencyKey')
  let store

  before(() => {
    store = createFakeStore()
    Object.defineProperty(prisma, 'idempotencyKey', { value: store, configurable: true, writable: true })
  })
  after(() => {
    if (realDelegate) Object.defineProperty(prisma, 'idempotencyKey', realDelegate)
    else delete prisma.idempotencyKey
  })

  it('calls next() when no idempotency key is provided', async () => {
    const { nextCalled } = await run(null)
    assert.equal(nextCalled, true)
  })

  it('lets exactly one of two concurrent identical requests through (other gets 409)', async () => {
    const [a, b] = await Promise.all([run('race-key'), run('race-key')])
    assert.equal([a, b].filter(r => r.nextCalled).length, 1)
    const blocked = a.nextCalled ? b : a
    assert.equal(blocked.res.statusCode, HTTP_STATUS.CONFLICT)
    assert.match(blocked.res.sent.error, /sedang diproses/)
  })

  it('replays the stored response once the first request completed', async () => {
    const first = await run('done-key')
    assert.equal(first.nextCalled, true)
    const payload = { id: 'order-123', status: 'PENDING', totalAmount: 50000 }
    await first.res.status(201).json(payload)
    assert.deepEqual(first.res.sent, payload)

    const second = await run('done-key')
    assert.equal(second.nextCalled, false)
    assert.equal(second.res.statusCode, 201)
    assert.deepEqual(second.res.sent, payload)
  })

  it('releases the key after a 5xx so the client can retry', async () => {
    const first = await run('error-key')
    await first.res.status(503).json({ error: 'down' })
    assert.equal(store.rows.has('user-1:error-key'), false)

    const retry = await run('error-key')
    assert.equal(retry.nextCalled, true)
  })

  it('tells the client to check its orders (and does not re-run) when a key is stuck in PROCESSING', async () => {
    const first = await run('stuck-key')
    assert.equal(first.nextCalled, true)
    // Simulate the first request crashing: it never responded, 3 minutes ago
    store.rows.get('user-1:stuck-key').updatedAt = new Date(Date.now() - 3 * 60 * 1000)

    const retry = await run('stuck-key')
    assert.equal(retry.nextCalled, false, 'must not create the order a second time')
    assert.equal(retry.res.statusCode, HTTP_STATUS.CONFLICT)
    assert.equal(retry.res.sent.code, 'IDEMPOTENCY_STALE')
  })

  it('scopes keys per user', async () => {
    await run('shared-key', 'user-a')
    const other = await run('shared-key', 'user-b')
    assert.equal(other.nextCalled, true)
  })
})
