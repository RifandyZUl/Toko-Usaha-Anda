import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Konsolidasi Kategori ke Tepat 3 Kategori Utama ---')

  // 1. Pastikan / Upsert 3 Kategori Utama
  const catRumahTangga = await prisma.category.upsert({
    where: { slug: 'kebutuhan-rumah-tangga' },
    update: {
      name: 'Kebutuhan Rumah Tangga',
      description: 'Perlengkapan kebersihan dan kebutuhan harian rumah tangga berkualitas',
    },
    create: {
      name: 'Kebutuhan Rumah Tangga',
      slug: 'kebutuhan-rumah-tangga',
      description: 'Perlengkapan kebersihan dan kebutuhan harian rumah tangga berkualitas',
    },
  })
  console.log(`✓ Kategori 1: ${catRumahTangga.name} (${catRumahTangga.id})`)

  const catPerkakas = await prisma.category.upsert({
    where: { slug: 'perkakas-tukang' },
    update: {
      name: 'Perkakas Tukang',
      description: 'Peralatan pertukangan, kunci, palu, dan perkakas teknik lengkap',
    },
    create: {
      name: 'Perkakas Tukang',
      slug: 'perkakas-tukang',
      description: 'Peralatan pertukangan, kunci, palu, dan perkakas teknik lengkap',
    },
  })
  console.log(`✓ Kategori 2: ${catPerkakas.name} (${catPerkakas.id})`)

  const catMotor = await prisma.category.upsert({
    where: { slug: 'alat-motor' },
    update: {
      name: 'Alat Alat Motor',
      description: 'Aksesoris motor, gembok cakram, tali bagasi, dan perlengkapan motor pilihan',
    },
    create: {
      name: 'Alat Alat Motor',
      slug: 'alat-motor',
      description: 'Aksesoris motor, gembok cakram, tali bagasi, dan perlengkapan motor pilihan',
    },
  })
  console.log(`✓ Kategori 3: ${catMotor.name} (${catMotor.id})`)

  // 2. Petakan Kategori Lama ke Kategori Baru
  // Daftar slug/nama kategori lama yang harus masuk ke Kebutuhan Rumah Tangga
  const householdKeywords = [
    'alat-pel',
    'sapu',
    'pembersih-lantai',
    'toples-wadah-makanan',
    'tali-tambang',
    'gantungan-jemuran',
    'botol-semprot',
    'keranjang-pakaian',
    'household',
    'peralatan-rumah-tangga',
  ]

  // Daftar slug/nama kategori lama yang harus masuk ke Alat Alat Motor
  const motorKeywords = [
    'aksesoris-motor',
    'gembok-cakram',
    'tali-bagasi-motor',
    'motorcycle',
    'alat-alat-motor',
  ]

  // Daftar slug/nama kategori lama yang harus masuk ke Perkakas Tukang
  const toolsKeywords = [
    'perkakas',
    'tools',
  ]

  const allCategories = await prisma.category.findMany()

  for (const cat of allCategories) {
    if (cat.id === catRumahTangga.id || cat.id === catPerkakas.id || cat.id === catMotor.id) {
      continue
    }

    let targetCatId = null
    const lowerSlug = cat.slug.toLowerCase()
    const lowerName = cat.name.toLowerCase()

    if (
      householdKeywords.some(k => lowerSlug.includes(k) || lowerName.includes(k)) ||
      lowerName.includes('rumah') || lowerName.includes('pel') || lowerName.includes('sapu')
    ) {
      targetCatId = catRumahTangga.id
    } else if (
      motorKeywords.some(k => lowerSlug.includes(k) || lowerName.includes(k)) ||
      lowerName.includes('motor')
    ) {
      targetCatId = catMotor.id
    } else if (
      toolsKeywords.some(k => lowerSlug.includes(k) || lowerName.includes(k)) ||
      lowerName.includes('tukang') || lowerName.includes('perkakas')
    ) {
      targetCatId = catPerkakas.id
    } else {
      // Default fallback ke Kebutuhan Rumah Tangga
      targetCatId = catRumahTangga.id
    }

    // Pindahkan semua produk dari kategori ini ke targetCatId
    const updated = await prisma.product.updateMany({
      where: { categoryId: cat.id },
      data: { categoryId: targetCatId }
    })
    console.log(`Memindahkan ${updated.count} produk dari '${cat.name}' -> ID target: ${targetCatId}`)

    // Hapus kategori lama setelah kosong
    try {
      await prisma.category.delete({ where: { id: cat.id } })
      console.log(`✓ Kategori lama '${cat.name}' (${cat.slug}) berhasil dihapus.`)
    } catch (err) {
      console.warn(`Gagal menghapus kategori '${cat.name}':`, err.message)
    }
  }

  // 3. Verifikasi Jumlah Kategori & Produk
  const remainingCats = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    }
  })

  console.log('\n--- Hasil Akhir Kategori di Database ---')
  console.log(`Total Kategori: ${remainingCats.length}`)
  remainingCats.forEach(c => {
    console.log(`- ${c.name} (slug: ${c.slug}) -> ${c._count.products} produk`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
