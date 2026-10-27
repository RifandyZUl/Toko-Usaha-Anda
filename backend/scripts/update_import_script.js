import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const filePath = path.join(__dirname, 'import_excel_products.js')
let content = fs.readFileSync(filePath, 'utf8')

// Replace categories for household items
const householdCategories = [
  'Alat Pel', 'Sapu', 'Pembersih Lantai', 'Toples & Wadah Makanan',
  'Tali Tambang', 'Gantungan Jemuran', 'Botol Semprot', 'Keranjang Pakaian'
]

householdCategories.forEach(cat => {
  const reg = new RegExp(`category:\\s*'${cat}',\\s*categorySlug:\\s*'[^']+'`, 'g')
  content = content.replace(reg, "category: 'Kebutuhan Rumah Tangga',\n    categorySlug: 'household'")
})

// Replace categories for motor items
const motorCategories = ['Aksesoris Motor', 'Gembok Cakram', 'Tali Bagasi Motor']
motorCategories.forEach(cat => {
  const reg = new RegExp(`category:\\s*'${cat}',\\s*categorySlug:\\s*'[^']+'`, 'g')
  content = content.replace(reg, "category: 'Alat Alat Motor',\n    categorySlug: 'motorcycle'")
})

fs.writeFileSync(filePath, content, 'utf8')
console.log('✅ import_excel_products.js successfully updated!')
