import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function toSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// 20 Master Products covering all 41 items from Daftar_Produk.xlsx
const productCatalog = [
  // --- KATEGORI: ALAT PEL ---
  {
    category: 'Alat Pel',
    categorySlug: 'alat-pel',
    name: 'Alat Pel Lantai Katun Dragon',
    slug: 'alat-pel-lantai-katun-dragon',
    description: 'Alat pel lantai berkualitas dari merek Dragon dengan sumbu benang katun pilihan berdaya serap air tinggi. Gagang kokoh dan nyaman digenggam, efektif membersihkan kotoran dan noda di segala permukaan lantai.',
    image: '/uploads/products/alat_pel_katun.jpg',
    baseWeight: 600,
    variants: [
      { name: 'Kecil', sku: 'PEL-DRG-KCL', price: 25000, stock: 45, weight: 500 },
      { name: 'Sedang', sku: 'PEL-DRG-SDG', price: 30000, stock: 50, weight: 650 },
      { name: 'Jumbo', sku: 'PEL-DRG-JMB', price: 35000, stock: 40, weight: 800 }
    ]
  },
  {
    category: 'Alat Pel',
    categorySlug: 'alat-pel',
    name: 'Alat Pel Lantai Sumbu Bom Bom',
    slug: 'alat-pel-lantai-sumbu-bom-bom',
    description: 'Alat pel lantai ekonomis merek Bom Bom dengan kepala pel serat sumbu tebal dan daya serap optimal. Ringan digunakan untuk kebutuhan pembersihan rumah tangga sehari-hari.',
    image: '/uploads/products/alat_pel_katun.jpg',
    baseWeight: 500,
    variants: [
      { name: 'Kecil', sku: 'PEL-BB-KCL', price: 20000, stock: 35, weight: 450 },
      { name: 'Besar', sku: 'PEL-BB-BSR', price: 25000, stock: 40, weight: 600 }
    ]
  },

  // --- KATEGORI: SAPU ---
  {
    category: 'Sapu',
    categorySlug: 'sapu',
    name: 'Sapu Ijuk Dragon Asli',
    slug: 'sapu-ijuk-dragon-asli',
    description: 'Sapu ijuk asli merek Dragon terkenal awet, tidak mudah rontok, dan memiliki anyaman ijuk rapat berkualitas tinggi. Gagang dilapisi seal rapi dan ergonomis.',
    image: '/uploads/products/sapu_ijuk_dragon.jpg',
    baseWeight: 500,
    variants: [
      { name: 'Standar Dragon', sku: 'SPU-IJK-DRG', price: 30000, stock: 60, weight: 500 }
    ]
  },
  {
    category: 'Sapu',
    categorySlug: 'sapu',
    name: 'Sapu Nilon Dragon Warna',
    slug: 'sapu-nilon-dragon-warna',
    description: 'Sapu nilon sintetis Dragon dengan bulu nilon halus dan rapat yang efektif menyapu debu mikro dan rambut tanpa meninggalkan goresan pada lantai granit/keramik.',
    image: '/uploads/products/sapu_nilon_warna.jpg',
    baseWeight: 450,
    variants: [
      { name: 'Standar Nilon Dragon', sku: 'SPU-NLN-DRG', price: 30000, stock: 55, weight: 450 }
    ]
  },
  {
    category: 'Sapu',
    categorySlug: 'sapu',
    name: 'Sapu Ijuk Bom Bom Ekonomis',
    slug: 'sapu-ijuk-bom-bom-ekonomis',
    description: 'Sapu ijuk tipe ekonomis merek Bom Bom yang cocok untuk menyapu halaman maupun dalam rumah. Serat ijuk alami dengan harga ramah kantong.',
    image: '/uploads/products/sapu_ijuk_dragon.jpg',
    baseWeight: 450,
    variants: [
      { name: 'Standar Bom Bom', sku: 'SPU-IJK-BB', price: 25000, stock: 40, weight: 450 }
    ]
  },
  {
    category: 'Sapu',
    categorySlug: 'sapu',
    name: 'Sapu Nilon Panda Warna Cerah',
    slug: 'sapu-nilon-panda-warna-cerah',
    description: 'Sapu nilon merek Panda dengan kombinasi warna cerah menarik. Bulu sapu fleksibel, kuat, tidak mudah rontok, dan mudah dibersihkan setelah digunakan.',
    image: '/uploads/products/sapu_nilon_warna.jpg',
    baseWeight: 400,
    variants: [
      { name: 'Standar Panda', sku: 'SPU-NLN-PND', price: 30000, stock: 50, weight: 400 }
    ]
  },
  {
    category: 'Sapu',
    categorySlug: 'sapu',
    name: 'Sapu Ijuk Cap 2 Udang Tradisional',
    slug: 'sapu-ijuk-cap-2-udang-tradisional',
    description: 'Sapu ijuk cap 2 Udang asli buatan pengrajin lokal dengan ikatan ijuk tradisional yang tebal dan tahan lama untuk area luar maupun dalam ruangan.',
    image: '/uploads/products/sapu_ijuk_dragon.jpg',
    baseWeight: 450,
    variants: [
      { name: 'Standar 2 Udang', sku: 'SPU-IJK-UDG', price: 20000, stock: 35, weight: 450 }
    ]
  },

  // --- KATEGORI: PEMBERSIH LANTAI LAINNYA ---
  {
    category: 'Pembersih Lantai',
    categorySlug: 'pembersih-lantai',
    name: 'Dorongan Air Karet Lantai (Floor Wiper)',
    slug: 'dorongan-air-karet-lantai-floor-wiper',
    description: 'Alat serokan pendorong air lantai berbahan karet elastis tebal dengan gagang panjang anti karat. Sangat efektif mengeringkan genangan air di lantai teras, kamar mandi, atau garasi seketika.',
    image: '/uploads/products/wiper_dorongan_air.jpg',
    baseWeight: 700,
    variants: [
      { name: 'Lebar 40cm', sku: 'WIP-KRT-40', price: 25000, stock: 40, weight: 700 }
    ]
  },
  {
    category: 'Pembersih Lantai',
    categorySlug: 'pembersih-lantai',
    name: 'Sikat Lantai Gagang Panjang Dragon',
    slug: 'sikat-lantai-gagang-panjang-dragon',
    description: 'Sikat lantai kamar mandi gagang panjang merek Dragon dengan bulu nilon kaku dan kuat untuk menyikat noda membandel dan lumut tanpa perlu membungkuk.',
    image: '/uploads/products/sikat_lantai_gagang.jpg',
    baseWeight: 600,
    variants: [
      { name: 'Standar Dragon', sku: 'SKT-DRG-01', price: 30000, stock: 45, weight: 600 }
    ]
  },

  // --- KATEGORI: TOPLES & WADAH MAKANAN ---
  {
    category: 'Toples & Wadah Makanan',
    categorySlug: 'toples-wadah-makanan',
    name: 'Toples Kerupuk Plastik Polos Bening',
    slug: 'toples-kerupuk-plastik-polos-bening',
    description: 'Toples kerupuk dan wadah makanan serbaguna berbahan plastik tebal food-grade, kedap udara dengan tutup putar rapat yang menjaga kerenyahan makanan tahan lama.',
    image: '/uploads/products/toples_kerupuk_plastik.jpg',
    baseWeight: 500,
    variants: [
      { name: '5 Liter', sku: 'TPLS-5L', price: 15000, stock: 50, weight: 400 },
      { name: '10 Liter', sku: 'TPLS-10L', price: 25000, stock: 40, weight: 700 },
      { name: '15 Liter', sku: 'TPLS-15L', price: 35000, stock: 35, weight: 1000 }
    ]
  },

  // --- KATEGORI: TALI TAMBANG ---
  {
    category: 'Tali Tambang',
    categorySlug: 'tali-tambang',
    name: 'Tali Tambang Nilon Plastik PE Rol',
    slug: 'tali-tambang-nilon-plastik-pe-rol',
    description: 'Tali tambang PE (Polyethylene) berkualitas tinggi, ulet, kuat, tahan air dan cuaca. Sangat cocok untuk mengikat barang muatan, konstruksi, tenda, tambak, jemuran, dan tali-temali serbaguna.',
    image: '/uploads/products/tali_tambang_pe.jpg',
    baseWeight: 400,
    variants: [
      { name: 'Diameter 3mm', sku: 'TBG-PE-3MM', price: 15000, stock: 50, weight: 300 },
      { name: 'Diameter 4mm', sku: 'TBG-PE-4MM', price: 20000, stock: 45, weight: 450 },
      { name: 'Diameter 5mm', sku: 'TBG-PE-5MM', price: 28000, stock: 40, weight: 650 },
      { name: 'Diameter 6mm', sku: 'TBG-PE-6MM', price: 38000, stock: 35, weight: 900 }
    ]
  },

  // --- KATEGORI: GANTUNGAN JEMURAN ---
  {
    category: 'Gantungan Jemuran',
    categorySlug: 'gantungan-jemuran',
    name: 'Gantungan Baju Bulat Putar Lion Star Folding Hanger',
    slug: 'gantungan-baju-bulat-putar-lion-star',
    description: 'Folding hanger bulat merek Lion Star terkenal tebal, kokoh, dan tahan panas matahari tanpa mudah getas. Dilengkapi jepitan kuat dan gantungan putar 360 derajat untuk menjemur pakaian bayi, kaos kaki, dan pakaian dalam.',
    image: '/uploads/products/gantungan_baju_bulat.jpg',
    baseWeight: 500,
    variants: [
      { name: '20 Stick', sku: 'HGR-LS-20', price: 38000, stock: 40, weight: 450 },
      { name: '24 Stick', sku: 'HGR-LS-24', price: 45000, stock: 40, weight: 550 },
      { name: '30 Stick', sku: 'HGR-LS-30', price: 55000, stock: 35, weight: 700 }
    ]
  },
  {
    category: 'Gantungan Jemuran',
    categorySlug: 'gantungan-jemuran',
    name: 'Gantungan Baju Bulat Folding Hanger Standar',
    slug: 'gantungan-baju-bulat-folding-hanger-standar',
    description: 'Gantungan baju jemuran model bulat lipat tipe standar ekonomis. Praktis disimpan saat tidak digunakan dan hemat tempat saat menjemur.',
    image: '/uploads/products/gantungan_baju_bulat.jpg',
    baseWeight: 400,
    variants: [
      { name: '20 Stick', sku: 'HGR-STD-20', price: 18000, stock: 50, weight: 350 },
      { name: '24 Stick', sku: 'HGR-STD-24', price: 22000, stock: 45, weight: 450 },
      { name: '30 Stick', sku: 'HGR-STD-30', price: 27000, stock: 40, weight: 550 }
    ]
  },

  // --- KATEGORI: BOTOL SEMPROT ---
  {
    category: 'Botol Semprot',
    categorySlug: 'botol-semprot',
    name: 'Botol Semprotan Spray Serbaguna Trigger',
    slug: 'botol-semprotan-spray-serbaguna-trigger',
    description: 'Botol spray dengan kepala trigger semprotan adjustable (bisa kabut halus / stream lurus). Cocok untuk semprotan tanaman hias, disinfektan, memandikan burung, atau setrika pakaian.',
    image: '/uploads/products/botol_spray.jpg',
    baseWeight: 150,
    variants: [
      { name: '500 ml', sku: 'BOT-SP-500', price: 10000, stock: 60, weight: 120 },
      { name: '1000 ml (1 Liter)', sku: 'BOT-SP-1000', price: 16000, stock: 50, weight: 180 }
    ]
  },

  // --- KATEGORI: KERANJANG PAKAIAN ---
  {
    category: 'Keranjang Pakaian',
    categorySlug: 'keranjang-pakaian',
    name: 'Keranjang Pakaian Plastik Laundry Serbaguna',
    slug: 'keranjang-pakaian-plastik-laundry-serbaguna',
    description: 'Keranjang pakaian kotor dan bersih berbahan plastik lentur tidak mudah pecah dengan lubang sirkulasi udara agar pakaian tidak lembap dan berbau.',
    image: '/uploads/products/keranjang_pakaian.jpg',
    baseWeight: 900,
    variants: [
      { name: 'Model Kotak', sku: 'KRJ-PK-KTK', price: 35000, stock: 35, weight: 900 },
      { name: 'Model Bulat Tinggi', sku: 'KRJ-PK-BLT', price: 35000, stock: 35, weight: 900 }
    ]
  },

  // --- KATEGORI: AKSESORIS MOTOR ---
  {
    category: 'Aksesoris Motor',
    categorySlug: 'aksesoris-motor',
    name: 'Dudukan Plat Nomor Motor Standar Universal',
    slug: 'dudukan-plat-nomor-motor-standar-universal',
    description: 'Frame wadah pelindung plat nomor motor standar Indonesia (1 set depan & belakang) lengkap dengan baut dan mur pengikat. Bahan plastik ABS tebal tahan getaran dan rapi.',
    image: '/uploads/products/dudukan_plat_motor.jpg',
    baseWeight: 350,
    variants: [
      { name: '1 Set (Depan + Belakang)', sku: 'PLT-MTR-STD', price: 25000, stock: 50, weight: 350 }
    ]
  },
  {
    category: 'Aksesoris Motor',
    categorySlug: 'aksesoris-motor',
    name: 'Busa Handle Rem Motor Universal',
    slug: 'busa-handle-rem-motor-universal',
    description: 'Sarung busa spons pelindung tuas handle rem dan kopling motor. Nyaman digenggam, empuk, mengurangi pegal pada jari saat perjalanan jauh, dan anti selip saat hujan.',
    image: '/uploads/products/gantungan_motor.jpg',
    baseWeight: 50,
    variants: [
      { name: '1 Pasang (Kiri & Kanan)', sku: 'BSA-HDL-REM', price: 6000, stock: 100, weight: 50 }
    ]
  },
  {
    category: 'Aksesoris Motor',
    categorySlug: 'aksesoris-motor',
    name: 'Gantungan Barang Motor (Hook Stang & Bodi)',
    slug: 'gantungan-barang-motor-hook-stang-bodi',
    description: 'Gantungan cantolan barang belanjaan motor kokoh, memudahkan membawa tas belanja di motor matic maupun bebek tanpa takut jatuh.',
    image: '/uploads/products/gantungan_motor.jpg',
    baseWeight: 150,
    variants: [
      { name: 'Model U Standar', sku: 'GNT-MTR-U', price: 8000, stock: 50, weight: 100 },
      { name: 'CNC Bulat Lipat', sku: 'GNT-MTR-CNC', price: 22000, stock: 45, weight: 150 },
      { name: 'Double Hook Robot', sku: 'GNT-MTR-DBL', price: 25000, stock: 40, weight: 180 }
    ]
  },

  // --- KATEGORI: GEMBOK CAKRAM ---
  {
    category: 'Aksesoris Motor',
    categorySlug: 'aksesoris-motor',
    name: 'Gembok Cakram Motor Anti Maling (Disc Lock)',
    slug: 'gembok-cakram-motor-anti-maling-disc-lock',
    description: 'Kunci gembok pengaman piringan cakram rem motor terbuat dari baja hardened steel tahan potong dan congkel. Memberikan proteksi maksimal untuk motor kesayangan Anda di tempat parkir.',
    image: '/uploads/products/gembok_cakram.jpg',
    baseWeight: 400,
    variants: [
      { name: 'Model Mini', sku: 'GBK-CKR-MNI', price: 22000, stock: 40, weight: 280 },
      { name: 'Model Bulat', sku: 'GBK-CKR-BLT', price: 32000, stock: 35, weight: 420 },
      { name: 'Besar Heavy Duty', sku: 'GBK-CKR-BSR', price: 35000, stock: 30, weight: 520 }
    ]
  },

  // --- KATEGORI: TALI BAGASI MOTOR ---
  {
    category: 'Aksesoris Motor',
    categorySlug: 'aksesoris-motor',
    name: 'Tali Bagasi Motor Pengikat Barang (Bungee Cord)',
    slug: 'tali-bagasi-motor-pengikat-barang-bungee-cord',
    description: 'Tali pengikat barang jok bagasi motor elastis kuat dengan kait kawat baja berlapis plastik agar tidak menggores bodi motor. Daya tarik lentur dan tidak mudah kendur.',
    image: '/uploads/products/tali_bagasi_motor.jpg',
    baseWeight: 200,
    variants: [
      { name: 'Pendek 1 Meter', sku: 'TLI-BGS-1M', price: 7000, stock: 60, weight: 150 },
      { name: 'Standar Elastis', sku: 'TLI-BGS-STD', price: 8000, stock: 60, weight: 180 },
      { name: 'Panjang 2 Meter', sku: 'TLI-BGS-2M', price: 12000, stock: 50, weight: 250 },
      { name: 'Premium Kawat Kuningan', sku: 'TLI-BGS-KNG', price: 18000, stock: 40, weight: 300 }
    ]
  }
]

async function main() {
  console.log(`Starting import of ${productCatalog.length} master products...`)

  for (const item of productCatalog) {
    // 1. Upsert Category
    const category = await prisma.category.upsert({
      where: { slug: item.categorySlug },
      update: {
        name: item.category
      },
      create: {
        name: item.category,
        slug: item.categorySlug,
        description: `Koleksi produk berkualitas untuk kategori ${item.category}`
      }
    })

    // Calculate base price & total stock from variants
    const lowestPrice = Math.min(...item.variants.map(v => v.price))
    const totalStock = item.variants.reduce((acc, v) => acc + v.stock, 0)

    // 2. Upsert Product
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        price: lowestPrice,
        stock: totalStock,
        image: item.image,
        images: [item.image],
        categoryId: category.id,
        isActive: true,
        weight: item.baseWeight
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: lowestPrice,
        stock: totalStock,
        image: item.image,
        images: [item.image],
        categoryId: category.id,
        isActive: true,
        weight: item.baseWeight
      }
    })

    console.log(`✓ Product upserted: ${product.name} (ID: ${product.id})`)

    // 3. Upsert Variants
    for (const v of item.variants) {
      // Check if variant already exists by productId and name
      const existing = await prisma.productVariant.findFirst({
        where: {
          productId: product.id,
          name: v.name
        }
      })

      if (existing) {
        await prisma.productVariant.update({
          where: { id: existing.id },
          update: {
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            weight: v.weight,
            image: item.image,
            isActive: true,
            deletedAt: null
          }
        })
      } else {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            weight: v.weight,
            image: item.image,
            isActive: true
          }
        })
      }
      console.log(`   - Variant: ${v.name} @ Rp ${v.price.toLocaleString('id-ID')} (Stock: ${v.stock})`)
    }
  }

  console.log('\n--- Import Summary ---')
  const totalProds = await prisma.product.count()
  const totalVars = await prisma.productVariant.count({ where: { deletedAt: null } })
  const totalCats = await prisma.category.count()
  console.log(`Categories: ${totalCats}`)
  console.log(`Total Active Products: ${totalProds}`)
  console.log(`Total Active Variants: ${totalVars}`)
}

main()
  .catch((e) => {
    console.error('Error importing products:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
