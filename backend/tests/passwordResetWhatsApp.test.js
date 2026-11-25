import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import prisma from '../src/config/database.js'
import { sendPasswordResetOtp } from '../src/services/otpService.js'

// In-memory stand-in for password_reset_sessions so the test needs no database.
function fakeSessions() {
  const rows = new Map()
  let nextId = 1
  return {
    rows,
    async findFirst() { return null },
    async deleteMany() { rows.clear() },
    async create({ data }) { const row = { id: nextId++, ...data }; rows.set(row.id, row); return row },
    async delete({ where }) { rows.delete(where.id) },
  }
}

describe('sendPasswordResetOtp via WhatsApp', () => {
  const original = { table: prisma.passwordResetSession, fetch: globalThis.fetch, env: { ...process.env } }
  let sessions

  beforeEach(() => {
    sessions = fakeSessions()
    prisma.passwordResetSession = sessions
  })

  afterEach(() => {
    prisma.passwordResetSession = original.table
    globalThis.fetch = original.fetch
    process.env = { ...original.env }
  })

  it('never returns the OTP in production when Fonnte rejects the number', async () => {
    process.env.NODE_ENV = 'production'
    process.env.FONNTE_TOKEN = 'test-token'
    globalThis.fetch = async () => ({ json: async () => ({ status: false, reason: 'number not on WhatsApp' }) })

    await assert.rejects(sendPasswordResetOtp('081234567890', 'WHATSAPP'), err => {
      assert.equal(err.statusCode, 400)
      assert.equal(err.devOtp, undefined)
      return true
    })
    assert.equal(sessions.rows.size, 0, 'failed delivery must not leave a usable reset session')
  })

  it('never returns the OTP in production when FONNTE_TOKEN is missing', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.FONNTE_TOKEN

    await assert.rejects(sendPasswordResetOtp('081234567890', 'WHATSAPP'), err => err.statusCode === 503)
    assert.equal(sessions.rows.size, 0)
  })

  it('returns no devOtp when Fonnte delivers successfully', async () => {
    process.env.NODE_ENV = 'production'
    process.env.FONNTE_TOKEN = 'test-token'
    globalThis.fetch = async () => ({ json: async () => ({ status: true }) })

    const result = await sendPasswordResetOtp('081234567890', 'WHATSAPP')
    assert.equal(result.simulated, false)
    assert.equal(result.devOtp, undefined)
    assert.equal(result.expiresInSeconds, 900)
    assert.equal(sessions.rows.size, 1)
  })

  it('still simulates (devOtp) in development without a token', async () => {
    process.env.NODE_ENV = 'development'
    delete process.env.FONNTE_TOKEN

    const result = await sendPasswordResetOtp('081234567890', 'WHATSAPP')
    assert.equal(result.simulated, true)
    assert.match(result.devOtp, /^\d{6}$/)
  })
})

describe('forgotPassword over WhatsApp', () => {
  const original = { user: prisma.user, table: prisma.passwordResetSession, fetch: globalThis.fetch, env: { ...process.env } }
  afterEach(() => {
    prisma.user = original.user
    prisma.passwordResetSession = original.table
    globalThis.fetch = original.fetch
    process.env = { ...original.env }
  })

  const callForgot = async (forgotPassword, identifier) =>
    new Promise(resolve => {
      const res = {
        code: 200,
        status(c) { this.code = c; return this },
        json(body) { resolve({ code: this.code, body }) },
      }
      forgotPassword({ body: { identifier, channel: 'WHATSAPP' } }, res, err => resolve({ err }))
    })

  it('answers a registered number with failed delivery exactly like an unknown number', async () => {
    process.env.NODE_ENV = 'production'
    process.env.FONNTE_TOKEN = 'test-token'
    globalThis.fetch = async () => ({ json: async () => ({ status: false, reason: 'not on WhatsApp' }) })
    prisma.passwordResetSession = fakeSessions()
    const { forgotPassword } = await import('../src/controllers/authController.js')

    prisma.user = { async findFirst() { return { id: 'u1', phone: '6281234567890' } } }
    const registered = await callForgot(forgotPassword, '081234567890')
    prisma.user = { async findFirst() { return null } }
    const unknown = await callForgot(forgotPassword, '081299999999')

    assert.equal(registered.code, 200)
    assert.deepEqual(registered.body, unknown.body)
    assert.equal(registered.body.devOtp, undefined)
  })
})
