import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import { getOrLoad, cleanupExpiredBinderbyteCache } from '../src/services/binderbyteCache.js'
import { installFakeBinderbyteCache } from './helpers/fakeBinderbyteCache.js'

describe('BinderByte shared cache (memory → database → API)', () => {
  const cache = installFakeBinderbyteCache()
  after(() => cache.restore())

  it('calls the loader once, then serves from cache', async () => {
    let calls = 0
    const loader = async () => ++calls
    assert.equal(await getOrLoad('t:once', 60_000, loader), 1)
    assert.equal(await getOrLoad('t:once', 60_000, loader), 1)
    assert.equal(calls, 1)
    assert.ok(cache.rows.has('t:once'), 'value persisted to the database table')
  })

  it('shares one load between concurrent requests for the same key', async () => {
    let calls = 0
    const loader = async () => {
      calls++
      await new Promise(resolve => setTimeout(resolve, 20))
      return 'value'
    }
    const results = await Promise.all(Array.from({ length: 10 }, () => getOrLoad('t:burst', 60_000, loader)))
    assert.equal(calls, 1)
    assert.ok(results.every(v => v === 'value'))
  })

  it('lets the next request retry after a shared load failed', async () => {
    let calls = 0
    const failing = async () => {
      calls++
      throw new Error('down')
    }
    await Promise.allSettled([getOrLoad('t:burst-err', 60_000, failing), getOrLoad('t:burst-err', 60_000, failing)])
    assert.equal(calls, 1)
    assert.equal(await getOrLoad('t:burst-err', 60_000, async () => 'recovered'), 'recovered')
  })

  it('reuses a value another instance stored in the database', async () => {
    cache.rows.set('t:shared', { key: 't:shared', value: ['from-db'], expiresAt: new Date(Date.now() + 60_000) })
    const value = await getOrLoad('t:shared', 60_000, async () => assert.fail('loader must not run'))
    assert.deepEqual(value, ['from-db'])
  })

  it('ignores expired database rows and reloads', async () => {
    cache.rows.set('t:expired', { key: 't:expired', value: 'old', expiresAt: new Date(Date.now() - 1000) })
    assert.equal(await getOrLoad('t:expired', 60_000, async () => 'fresh'), 'fresh')
  })

  it('does not cache null results or loader errors', async () => {
    assert.equal(await getOrLoad('t:null', 60_000, async () => null), null)
    assert.equal(cache.rows.has('t:null'), false)
    await assert.rejects(getOrLoad('t:err', 60_000, async () => { throw new Error('down') }))
    assert.equal(await getOrLoad('t:err', 60_000, async () => 'ok'), 'ok')
  })

  it('falls back to the API when the database is unreachable', async () => {
    const { findUnique, upsert } = cache.fake
    cache.fake.findUnique = async () => { throw new Error('db down') }
    cache.fake.upsert = async () => { throw new Error('db down') }
    try {
      assert.equal(await getOrLoad('t:dbdown', 60_000, async () => 'from-api'), 'from-api')
    } finally {
      Object.assign(cache.fake, { findUnique, upsert })
    }
  })

  it('cleanup removes only expired rows', async () => {
    cache.rows.set('t:old', { key: 't:old', value: 1, expiresAt: new Date(Date.now() - 1000) })
    cache.rows.set('t:new', { key: 't:new', value: 1, expiresAt: new Date(Date.now() + 60_000) })
    const removed = await cleanupExpiredBinderbyteCache()
    assert.ok(removed >= 1)
    assert.equal(cache.rows.has('t:old'), false)
    assert.equal(cache.rows.has('t:new'), true)
  })
})
