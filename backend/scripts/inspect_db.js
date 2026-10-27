import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      products: {
        select: { id: true, name: true, slug: true }
      }
    }
  })

  console.log('=== KATEGORI DAN PRODUK DI DATABASE ===')
  for (const cat of categories) {
    console.log(`\n📁 Kategori: ${cat.name} (slug: ${cat.slug}) [${cat.products.length} produk]`)
    cat.products.forEach(p => console.log(`   - ${p.name}`))
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
