import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user — credentials come from env so no usable password lives in the repo
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (!adminEmail || !adminPassword || adminPassword.length < 12) {
    throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (min. 12 characters) before seeding.')
  }
  const hashedPassword = await bcrypt.hash(adminPassword, 12)
  // update: {} — never overwrite an existing admin's password on re-seed
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin Toko',
      password: hashedPassword,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create categories
  const categories = [
    {
      name: 'Kebutuhan Rumah Tangga',
      slug: 'household',
      description: 'Perlengkapan kebersihan dan kebutuhan harian rumah tangga berkualitas',
    },
    {
      name: 'Perkakas Tukang',
      slug: 'tools',
      description: 'Peralatan pertukangan, kunci, palu, dan perkakas teknik lengkap',
    },
    {
      name: 'Alat Alat Motor',
      slug: 'motorcycle',
      description: 'Aksesoris motor, gembok cakram, tali bagasi, dan perlengkapan motor pilihan',
    },
  ]

  const createdCategories = []
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
    })
    createdCategories.push(created)
    console.log(`✅ Category created/updated: ${created.name}`)
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

