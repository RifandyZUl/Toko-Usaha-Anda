import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@toko.com' },
    update: {},
    create: {
      email: 'admin@toko.com',
      name: 'Admin Toko',
      password: hashedPassword,
      phone: '081234567890',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create categories
  const categories = [
    {
      name: 'Kebutuhan Sehari Hari',
      slug: 'household',
      description: 'Peralatan rumah tangga dan kebutuhan sehari-hari',
    },
    {
      name: 'Perkakas',
      slug: 'tools',
      description: 'Perkakas tukang dan alat konstruksi',
    },
    {
      name: 'Alat Motor',
      slug: 'motorcycle',
      description: 'Spare part dan aksesoris motor',
    },
  ]

  const createdCategories = []
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
    createdCategories.push(created)
    console.log(`✅ Category created: ${created.name}`)
  }

  // Create sample products
  const products = [
    {
      name: 'Sapu',
      slug: 'sapu',
      description: 'Sapu berkualitas tinggi untuk membersihkan lantai dengan efektif',
      price: 25000,
      stock: 50,
      categoryId: createdCategories[0].id,
      image: '/assets/sapu.png',
      images: ['/assets/sapu.png'],
    },
    {
      name: 'Wajan',
      slug: 'wajan',
      description: 'Wajan anti lengket untuk memasak dengan hasil maksimal',
      price: 75000,
      stock: 30,
      categoryId: createdCategories[0].id,
      image: '/assets/wajan.jpg',
      images: ['/assets/wajan.jpg'],
    },
    {
      name: 'Palu',
      slug: 'palu',
      description: 'Palu untuk pekerjaan konstruksi dan perbaikan',
      price: 45000,
      stock: 25,
      categoryId: createdCategories[1].id,
      image: '/assets/Palu.png',
      images: ['/assets/Palu.png'],
    },
    {
      name: 'Gergaji',
      slug: 'gergaji',
      description: 'Gergaji untuk memotong kayu dan bahan lainnya dengan presisi',
      price: 85000,
      stock: 20,
      categoryId: createdCategories[1].id,
      image: '/assets/gergaji.jpg',
      images: ['/assets/gergaji.jpg'],
    },
    {
      name: 'Cakram Rem',
      slug: 'cakram-rem',
      description: 'Cakram rem berkualitas untuk performa pengereman optimal',
      price: 150000,
      stock: 15,
      categoryId: createdCategories[2].id,
      image: '/assets/cakram.jpg',
      images: ['/assets/cakram.jpg'],
    },
  ]

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    })
    console.log(`✅ Product created: ${created.name}`)
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

