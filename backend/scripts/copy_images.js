import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcDir = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\ffa98226-0cba-40b1-8d7e-5e00bdd440df'
const dstDir = path.join(__dirname, '../public/uploads/products')

if (!fs.existsSync(dstDir)) {
  fs.mkdirSync(dstDir, { recursive: true })
}

const mapping = {
  'alat_pel_katun': 'alat_pel_katun.jpg',
  'botol_spray': 'botol_spray.jpg',
  'dudukan_plat_motor': 'dudukan_plat_motor.jpg',
  'gantungan_baju_bulat': 'gantungan_baju_bulat.jpg',
  'gantungan_motor': 'gantungan_motor.jpg',
  'gembok_cakram': 'gembok_cakram.jpg',
  'keranjang_pakaian': 'keranjang_pakaian.jpg',
  'sapu_ijuk_dragon': 'sapu_ijuk_dragon.jpg',
  'sapu_nilon_warna': 'sapu_nilon_warna.jpg',
  'sikat_lantai_gagang': 'sikat_lantai_gagang.jpg',
  'tali_bagasi_motor': 'tali_bagasi_motor.jpg',
  'tali_tambang_pe': 'tali_tambang_pe.jpg',
  'toples_kerupuk_plastik': 'toples_kerupuk_plastik.jpg',
  'wiper_dorongan_air': 'wiper_dorongan_air.jpg'
}

const files = fs.readdirSync(srcDir)

for (const [key, targetName] of Object.entries(mapping)) {
  const match = files.find(f => f.startsWith(key) && f.endsWith('.jpg'))
  if (match) {
    const srcFile = path.join(srcDir, match)
    const dstFile = path.join(dstDir, targetName)
    fs.copyFileSync(srcFile, dstFile)
    console.log(`Copied ${match} -> ${targetName}`)
  } else {
    console.warn(`No match found for ${key}`)
  }
}
