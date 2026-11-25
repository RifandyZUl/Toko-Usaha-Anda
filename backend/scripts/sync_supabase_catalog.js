import { PrismaClient } from '@prisma/client'

import 'dotenv/config'

// Never hardcode database credentials: this file is in a public repository.
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL
if (!SUPABASE_DB_URL) {
  console.error('Set SUPABASE_DB_URL in backend/.env before running this script.')
  process.exit(1)
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: SUPABASE_DB_URL
    }
  }
})

async function main() {
  console.log('📡 Checking products on Supabase database...')
  const existing = await prisma.product.findMany({ select: { id: true, name: true, slug: true } })
  console.log('Found existing products on Supabase:', existing)

  const dummySlugs = ['sapu', 'wajan', 'palu', 'gergaji', 'cakram-rem']
  for (const slug of dummySlugs) {
    const p = existing.find(x => x.slug === slug)
    if (p) {
      await prisma.productVariant.deleteMany({ where: { productId: p.id } })
      await prisma.cartItem.deleteMany({ where: { productId: p.id } })
      await prisma.product.delete({ where: { id: p.id } })
      console.log(`✅ Deleted dummy product: ${slug} (${p.name})`)
    }
  }
}

main()
  .catch((err) => console.error('Error on Supabase:', err))
  .finally(() => prisma.$disconnect())
