import { PrismaClient } from '@prisma/client'

const SUPABASE_DB_URL = 'postgresql://postgres.bmgvyczvqvvgiuxdgwma:Zul7!andra123@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres'

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
