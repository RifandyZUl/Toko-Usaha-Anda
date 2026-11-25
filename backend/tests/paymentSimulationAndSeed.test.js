import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import prisma from '../src/config/database.js'
import { simulatePayment } from '../src/controllers/paymentController.js'

describe('simulatePayment', () => {
  const env = { ...process.env }
  const originalOrder = prisma.order
  afterEach(() => {
    process.env = { ...env }
    prisma.order = originalOrder
  })

  const call = async () => {
    const res = { code: 200, body: null, status(c) { this.code = c; return this }, json(b) { this.body = b; return this } }
    await simulatePayment({ body: { orderId: 'o1' }, userId: 'u1', userRole: 'CUSTOMER' }, res, err => { throw err })
    return res
  }

  // Fake order owned by the caller, so only the environment gate can stop the simulation
  const useFakeOrder = () => {
    const updates = []
    prisma.order = {
      async findUnique() { return { id: 'o1', userId: 'u1', status: 'PENDING' } },
      async update(args) { updates.push(args); return { id: 'o1', ...args.data } },
    }
    return updates
  }

  for (const nodeEnv of ['production', 'test', undefined]) {
    it(`refuses when NODE_ENV=${nodeEnv} even with Midtrans in sandbox`, async () => {
      if (nodeEnv) process.env.NODE_ENV = nodeEnv
      else delete process.env.NODE_ENV
      process.env.MIDTRANS_IS_PRODUCTION = 'false'
      const updates = useFakeOrder()

      const res = await call()
      assert.equal(res.code, 403)
      assert.equal(updates.length, 0, 'order must not be marked paid')
    })
  }

  it('still works in development for the order owner', async () => {
    process.env.NODE_ENV = 'development'
    const updates = useFakeOrder()

    const res = await call()
    assert.equal(res.code, 200)
    assert.equal(updates[0].data.paymentStatus, 'PAID')
  })
})

describe('prisma seed', () => {
  it('refuses to seed an admin without SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD', () => {
    const seed = fileURLToPath(new URL('../prisma/seed.js', import.meta.url))
    const env = { ...process.env, SEED_ADMIN_EMAIL: '', SEED_ADMIN_PASSWORD: '', DATABASE_URL: 'postgresql://x:x@localhost:1/x' }
    // cwd outside backend so dotenv cannot load a real .env
    const result = spawnSync(process.execPath, [seed], { env, cwd: fileURLToPath(new URL('.', import.meta.url)), encoding: 'utf8' })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD/)
  })
})
