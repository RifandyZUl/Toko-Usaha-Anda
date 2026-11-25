import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import prisma from '../src/config/database.js'
import { authenticate, passwordVersion } from '../src/middleware/auth.js'
import { verifyPasswordResetOtp, findVerifiedPhoneOwner } from '../src/services/otpService.js'
import { maskPersonal } from '../src/utils/logger.js'

const env = { ...process.env }
const saved = {}
const fake = (key, value) => {
  if (!(key in saved)) saved[key] = prisma[key]
  prisma[key] = value
}
afterEach(() => {
  process.env = { ...env }
  Object.assign(prisma, saved)
})

describe('session revocation', () => {
  const SECRET = 'x'.repeat(32)
  const run = async (token, user) => {
    process.env.JWT_SECRET = SECRET
    fake('user', { async findUnique() { return user } })
    const res = { code: 200, status(c) { this.code = c; return this }, json() { return this } }
    let passed = false
    const req = { headers: { authorization: `Bearer ${token}` }, cookies: {} }
    await authenticate(req, res, () => { passed = true })
    return { passed, code: res.code, req }
  }
  const tokenFor = (hash, role = 'CUSTOMER') => jwt.sign({ userId: 'u1', role, pwv: passwordVersion(hash) }, SECRET)

  it('accepts a token issued for the current password', async () => {
    const { passed } = await run(tokenFor('$2b$hash-1'), { id: 'u1', role: 'CUSTOMER', password: '$2b$hash-1' })
    assert.equal(passed, true)
  })

  it('rejects every older token once the password changed (reset kicks out a thief)', async () => {
    const { passed, code } = await run(tokenFor('$2b$hash-1'), { id: 'u1', role: 'CUSTOMER', password: '$2b$hash-2' })
    assert.equal(passed, false)
    assert.equal(code, 401)
  })

  it('rejects tokens issued before this change (no pwv) and tokens of deleted users', async () => {
    process.env.JWT_SECRET = SECRET
    const legacy = jwt.sign({ userId: 'u1', role: 'ADMIN' }, SECRET)
    assert.equal((await run(legacy, { id: 'u1', role: 'ADMIN', password: 'h' })).passed, false)
    assert.equal((await run(tokenFor('h'), null)).passed, false)
  })

  it('takes the role from the database, not the token (demoted admin loses access)', async () => {
    const { req } = await run(tokenFor('h', 'ADMIN'), { id: 'u1', role: 'CUSTOMER', password: 'h' })
    assert.equal(req.userRole, 'CUSTOMER')
  })
})

describe('OTP guesses sent in parallel', () => {
  it('compare at most 5 guesses even when 50 arrive at once', async () => {
    const session = { id: 's1', identifier: 'a@b.co', channel: 'EMAIL', otpHash: 'f'.repeat(64), attempts: 0, expiresAt: new Date(Date.now() + 60_000) }
    let compared = 0
    fake('passwordResetSession', {
      async findFirst() { return { ...session } },
      async updateMany({ where }) {
        await new Promise(resolve => setImmediate(resolve))
        if (session.attempts >= where.attempts.lt) return { count: 0 }
        session.attempts++
        compared++
        return { count: 1 }
      },
    })
    const results = await Promise.all(Array.from({ length: 50 }, () => verifyPasswordResetOtp('a@b.co', 'EMAIL', '123456')))
    assert.equal(compared, 5)
    assert.equal(results.filter(r => /Batas percobaan/.test(r.message)).length, 45)
  })
})

describe('phone ownership', () => {
  it('only an OTP-verified number identifies an account', async () => {
    let where
    fake('user', { async findFirst(args) { where = args.where; return null } })
    await findVerifiedPhoneOwner('0812-3456-7890')
    assert.equal(where.isPhoneVerified, true)
    assert.ok(where.phone.in.includes('6281234567890'))
    assert.ok(where.phone.in.includes('081234567890'))
  })
})

describe('log masking', () => {
  it('hides most of emails and phone numbers', () => {
    assert.equal(maskPersonal('budi.santoso@gmail.com'), 'bu***@gmail.com')
    assert.equal(maskPersonal('6281234567890'), '62*******7890')
    assert.equal(maskPersonal('123'), '***')
  })
})
