import { describe, it, before, after, afterEach } from 'node:test'
import assert from 'node:assert/strict'

// server.js validates env on import and must not start its own listener / crons
process.env.VERCEL = '1'
process.env.DATABASE_URL ||= 'postgresql://x:x@localhost:1/x'
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) process.env.JWT_SECRET = 'x'.repeat(32)
process.env.FRONTEND_URL = 'https://shop.example.com'

const { default: app } = await import('../src/server.js')
const { default: prisma } = await import('../src/config/database.js')
const { processCustomerMessage } = await import('../src/services/chatbotService.js')
const { verifyFonnteWebhook } = await import('../src/controllers/webhookController.js')

const OTHER_ORDER_ID = '11111111-2222-3333-4444-555555555555'

describe('CORS', () => {
  let server
  let base
  before(async () => {
    server = app.listen(0)
    await new Promise(resolve => server.once('listening', resolve))
    base = `http://127.0.0.1:${server.address().port}`
  })
  after(() => server.close())

  const preflight = origin =>
    fetch(`${base}/api/health`, {
      method: 'OPTIONS',
      headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' },
    })

  it('rejects an arbitrary *.vercel.app origin', async () => {
    const res = await preflight('https://attacker.vercel.app')
    assert.equal(res.headers.get('access-control-allow-origin'), null)
  })

  it('allows an origin listed in FRONTEND_URL', async () => {
    const res = await preflight('https://shop.example.com')
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://shop.example.com')
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true')
  })
})

describe('verifyFonnteWebhook', () => {
  const env = { ...process.env }
  afterEach(() => { process.env = { ...env } })

  const run = query => {
    const res = { code: 200, status(c) { this.code = c; return this }, json() { return this } }
    let passed = false
    verifyFonnteWebhook({ query, ip: '127.0.0.1' }, res, () => { passed = true })
    return { passed, code: res.code }
  }

  it('rejects a missing or wrong secret', () => {
    process.env.FONNTE_WEBHOOK_SECRET = 'correct-secret'
    assert.deepEqual(run({}), { passed: false, code: 401 })
    assert.deepEqual(run({ secret: 'wrong' }), { passed: false, code: 401 })
    assert.deepEqual(run({ secret: ['correct-secret'] }), { passed: false, code: 401 })
  })

  it('accepts the correct secret', () => {
    process.env.FONNTE_WEBHOOK_SECRET = 'correct-secret'
    assert.equal(run({ secret: 'correct-secret' }).passed, true)
  })

  it('fails closed outside development when no secret is configured', () => {
    delete process.env.FONNTE_WEBHOOK_SECRET
    process.env.NODE_ENV = 'production'
    assert.deepEqual(run({}), { passed: false, code: 503 })
  })
})

describe('chatbot order lookup', () => {
  const originalOrder = prisma.order
  let queries
  afterEach(() => { prisma.order = originalOrder })

  // Fake order table: one order that belongs to 6281111111111
  const useFakeOrders = () => {
    queries = []
    const order = { id: OTHER_ORDER_ID, shippingPhone: '6281111111111', userPhone: '6281111111111' }
    const matches = where => {
      if (where.id && where.id !== order.id) return false
      return where.OR.some(c => c.shippingPhone?.in.includes(order.shippingPhone) || c.user?.phone.in.includes(order.userPhone))
    }
    prisma.order = {
      async findFirst({ where }) {
        queries.push(where)
        return matches(where)
          ? { ...order, status: 'PROCESSING', paymentStatus: 'PAID', items: [{ quantity: 1 }], totalAmount: 1000, shippingAddress: 'Budi | Jl. Rahasia 1', paymentMethod: 'QRIS' }
          : null
      },
      async findUnique() { throw new Error('lookup by id alone must not be used') },
    }
  }

  it('does not reveal another customer\'s order by UUID', async () => {
    useFakeOrders()
    const reply = await processCustomerMessage('6289999999999', `cek ${OTHER_ORDER_ID}`)
    assert.doesNotMatch(reply, /Rahasia/)
    assert.match(reply, /belum ada riwayat pesanan/)
  })

  it('does not match orders for a too-short sender number', async () => {
    useFakeOrders()
    const reply = await processCustomerMessage('08', 'pesanan')
    assert.match(reply, /belum ada riwayat pesanan/)
    assert.equal(queries.length, 0)
  })

  it('never uses substring matching on shippingPhone', async () => {
    useFakeOrders()
    await processCustomerMessage('6289999999999', 'pesanan')
    assert.doesNotMatch(JSON.stringify(queries), /contains/)
  })

  it('still shows the sender their own order', async () => {
    useFakeOrders()
    const reply = await processCustomerMessage('081111111111', `cek ${OTHER_ORDER_ID}`)
    assert.match(reply, /Sedang Dikemas/)
  })
})
