import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateCategory() {
  console.log('🔄 Updating category name...')

  try {
    // Update category name from "Kebutuhan Sehari Hari" to "Peralatan Rumah Tangga"
    const updated = await prisma.category.updateMany({
      where: {
        OR: [
          { name: 'Kebutuhan Sehari Hari' },
          { name: 'kebutuhan sehari hari' },
          { slug: 'household' },
        ],
      },
      data: {
        name: 'Peralatan Rumah Tangga',
        description: 'Peralatan rumah tangga lengkap dan berkualitas',
      },
    })

    console.log(`✅ Updated ${updated.count} category/categories`)
    console.log('✅ Category name updated to: Peralatan Rumah Tangga')
  } catch (error) {
    console.error('❌ Error updating category:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateCategory()
  .catch((e) => {
    console.error('❌ Update failed:', e)
    process.exit(1)
  })

