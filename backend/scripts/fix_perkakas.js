import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const catPerkakas = await prisma.category.findUnique({
    where: { slug: 'perkakas-tukang' }
  })

  // Pindahkan Palu Karet ke Perkakas Tukang
  const updated = await prisma.product.updateMany({
    where: {
      slug: { in: ['palu-karet-serbaguna', 'palu-karet-serbaguna-pro'] }
    },
    data: {
      categoryId: catPerkakas.id
    }
  })
  console.log(`Palu karet dipindahkan ke Perkakas Tukang: ${updated.count} produk`)

  // Hapus produk lama yang duplikat jika tidak ada order
  const oldDummies = await prisma.product.findMany({
    where: {
      slug: { in: ['pel-dragon-kecil', 'sapu-ijuk-dragon'] }
    },
    include: { orderItems: true }
  })

  for (const p of oldDummies) {
    if (p.orderItems.length === 0) {
      await prisma.cartItem.deleteMany({ where: { productId: p.id } })
      await prisma.productVariant.deleteMany({ where: { productId: p.id } })
      await prisma.product.delete({ where: { id: p.id } })
      console.log(`Produk lama non-aktif ${p.name} (${p.slug}) dibersihkan.`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
