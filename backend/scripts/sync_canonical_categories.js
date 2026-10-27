import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Sinkronisasi 3 Kategori Utama dengan Slug Standar ---')

  // Cari kategori rumah tangga (baik slug 'kebutuhan-rumah-tangga' maupun 'household')
  let catRumah = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: 'household' },
        { slug: 'kebutuhan-rumah-tangga' }
      ]
    }
  })

  if (catRumah) {
    catRumah = await prisma.category.update({
      where: { id: catRumah.id },
      data: {
        name: 'Kebutuhan Rumah Tangga',
        slug: 'household',
        description: 'Perlengkapan kebersihan dan kebutuhan harian rumah tangga berkualitas'
      }
    })
    console.log(`✓ Updated: ${catRumah.name} (slug: ${catRumah.slug})`)
  }

  // Cari kategori perkakas
  let catPerkakas = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: 'tools' },
        { slug: 'perkakas-tukang' }
      ]
    }
  })

  if (catPerkakas) {
    catPerkakas = await prisma.category.update({
      where: { id: catPerkakas.id },
      data: {
        name: 'Perkakas Tukang',
        slug: 'tools',
        description: 'Peralatan pertukangan, kunci, palu, dan perkakas teknik lengkap'
      }
    })
    console.log(`✓ Updated: ${catPerkakas.name} (slug: ${catPerkakas.slug})`)
  }

  // Cari kategori motor
  let catMotor = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: 'motorcycle' },
        { slug: 'alat-motor' }
      ]
    }
  })

  if (catMotor) {
    catMotor = await prisma.category.update({
      where: { id: catMotor.id },
      data: {
        name: 'Alat Alat Motor',
        slug: 'motorcycle',
        description: 'Aksesoris motor, gembok cakram, tali bagasi, dan perlengkapan motor pilihan'
      }
    })
    console.log(`✓ Updated: ${catMotor.name} (slug: ${catMotor.slug})`)
  }

  // Pastikan tidak ada kategori lain
  const allCats = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    }
  })

  console.log('\n--- Status Kategori Final ---')
  for (const c of allCats) {
    console.log(`[ID: ${c.id}] ${c.name} | slug: ${c.slug} | ${c._count.products} produk`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
