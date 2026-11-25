import prisma from '../../src/config/database.js'

/**
 * Replace prisma.binderbyteCache with an in-memory table so tests never read/write the real database.
 * Returns { rows, restore }.
 */
export function installFakeBinderbyteCache() {
  const rows = new Map()
  const fake = {
    async findUnique({ where }) {
      return rows.get(where.key) || null
    },
    async upsert({ where, create, update }) {
      rows.set(where.key, { ...(rows.get(where.key) || create), ...update })
    },
    async deleteMany({ where }) {
      let count = 0
      for (const [key, row] of rows) {
        if (row.expiresAt < where.expiresAt.lt) {
          rows.delete(key)
          count++
        }
      }
      return { count }
    },
  }
  const original = Object.getOwnPropertyDescriptor(prisma, 'binderbyteCache')
  Object.defineProperty(prisma, 'binderbyteCache', { value: fake, configurable: true, writable: true })
  const restore = () => {
    if (original) Object.defineProperty(prisma, 'binderbyteCache', original)
    else delete prisma.binderbyteCache
  }
  return { rows, fake, restore }
}
