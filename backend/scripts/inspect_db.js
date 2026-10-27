import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.category.findMany()
  const products = await prisma.product.findMany({
    include: { variants: true }
  })
  const sample = await prisma.product.findFirst({
    where: { slug: 'alat-pel-lantai-katun-dragon' },
    include: { variants: true, category: true }
  })
  console.log('\n--- Sample Product Detail ---')
  console.log({
    name: sample.name,
    category: sample.category.name,
    price: sample.price.toString(),
    stock: sample.stock,
    image: sample.image,
    variants: sample.variants.map(v => ({ name: v.name, sku: v.sku, price: v.price.toString(), stock: v.stock, weight: v.weight }))
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
