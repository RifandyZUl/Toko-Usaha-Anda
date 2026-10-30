import prisma from '../config/database.js'
import { normalizePhoneNumber } from './otpService.js'

/**
 * Format currency to Indonesian Rupiah
 */
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number)
}

/**
 * Menu Utama - Ramah, bersahabat, dan jelas
 */
const buildMainMenuResponse = (customerName) => {
  const greetingName = customerName ? `Kak ${customerName}` : 'Kak'
  return (
    `Halo ${greetingName}! 👋 Selamat datang di *Toko Usaha Anda*.\n\n` +
    `Ada yang bisa kami bantu hari ini? Kakak cukup balas chat ini dengan angka atau kata kunci di bawah ya:\n\n` +
    `1️⃣ *Katalog* — Lihat daftar produk & promo terbaru\n` +
    `2️⃣ *Cek Pesanan* — Cek status & resi pengiriman pesanan Kakak\n` +
    `3️⃣ *Cara Bayar & COD* — Info pembayaran, ongkir & bayar di tempat\n` +
    `4️⃣ *Admin / CS* — Ngobrol langsung dengan tim admin kami\n\n` +
    `_Silakan ketik angka *1*, *2*, *3*, atau *4* ya Kak 😊_`
  )
}

/**
 * Respon Opsi 1: Info Katalog & Kategori
 */
const handleCatalogResponse = async () => {
  try {
    const categories = await prisma.category.findMany({
      take: 5,
      select: { name: true },
    })

    const categoryList = categories.length > 0
      ? categories.map(c => `• ${c.name}`).join('\n')
      : '• Semua Kategori Produk'

    const shopUrl = process.env.FRONTEND_URL?.split(',')[0] || 'https://tokousahaanda.com'

    return (
      `Siap Kak! Ini beberapa kategori produk favorit kami:\n\n` +
      `${categoryList}\n\n` +
      `Untuk lihat foto produk lengkap, varian, dan harga diskon, Kakak bisa langsung cek di website kami:\n` +
      `👉 ${shopUrl}/shop\n\n` +
      `_Pesan langsung di web cepat dan praktis ya Kak! Butuh info lain? Ketik *Menu*._`
    )
  } catch {
    return `Katalog lengkap produk kami bisa dicek langsung di: https://tokousahaanda.com/shop ya Kak 😊`
  }
}

/**
 * Terjemahan status pesanan ramah pelanggan
 */
const getStatusLabel = (status, paymentStatus) => {
  if (status === 'PENDING') {
    return paymentStatus === 'PAID' ? '⏳ Sedang Diverifikasi' : '💳 Menunggu Pembayaran'
  }
  if (status === 'PROCESSING') return '📦 Sedang Dikemas'
  if (status === 'SHIPPED') return '🚚 Sedang Dikirim'
  if (status === 'DELIVERED') return '✅ Pesanan Sampai / Selesai'
  if (status === 'CANCELLED') return '❌ Pesanan Dibatalkan'
  return status
}

/**
 * Respon Opsi 2: Cek Status Pesanan Terbaru
 */
const handleOrderCheckResponse = async (senderPhone, customOrderId = null) => {
  try {
    const cleanPhone = normalizePhoneNumber(senderPhone)
    const localPhone = cleanPhone.startsWith('62') ? '0' + cleanPhone.slice(2) : cleanPhone

    let order = null

    if (customOrderId) {
      order = await prisma.order.findUnique({
        where: { id: customOrderId },
        include: { items: true },
      })
    } else {
      order = await prisma.order.findFirst({
        where: {
          OR: [
            { shippingPhone: cleanPhone },
            { shippingPhone: localPhone },
            { shippingPhone: { contains: localPhone.slice(2) } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      })
    }

    if (!order) {
      return (
        `Halo Kak! Kami cek belum ada riwayat pesanan dengan nomor WhatsApp ini ya 😊\n\n` +
        `Kalau Kakak memesan dengan nomor lain atau punya nomor ID Pesanan (Invoice), silakan ketik nomor pesanannya langsung di sini ya Kak, nanti kami bantu lacak!`
      )
    }

    const statusText = getStatusLabel(order.status, order.paymentStatus)
    const itemsCount = order.items.reduce((acc, curr) => acc + curr.quantity, 0)
    const shortId = order.id.slice(0, 8).toUpperCase()

    return (
      `Ini detail pesanan terakhir Kakak:\n\n` +
      `📋 *ID Pesanan:* #${shortId}\n` +
      `📌 *Status:* *${statusText}*\n` +
      `🛍️ *Jumlah Barang:* ${itemsCount} pcs\n` +
      `💰 *Total Belanja:* ${formatRupiah(Number(order.totalAmount))}\n` +
      `🚚 *Kurir:* ${order.shippingCourier || 'JNE'}\n` +
      `💳 *Metode Bayar:* ${order.paymentMethod}\n\n` +
      `Alamat kirim: ${order.shippingAddress?.slice(0, 45)}...\n\n` +
      `_Ada kendala dengan pesanan ini? Ketik *CS* untuk bicara dengan admin ya Kak._`
    )
  } catch (err) {
    return 'Maaf ya Kak, sistem kami sedang sibuk mengecek pesanan. Kakak bisa coba beberapa saat lagi atau ketik *CS* ya.'
  }
}

/**
 * Respon Opsi 3: Bantuan Pembayaran, COD & Ongkir
 */
const handlePaymentHelpResponse = () => {
  return (
    `Belanja di *Toko Usaha Anda* gampang dan aman Kak! Ini pilihan pembayarannya:\n\n` +
    `1. *Transfer Bank & QRIS:* Pembayaran otomatis diverifikasi langsung via Midtrans.\n` +
    `2. *COD (Bayar di Tempat):* Bayar tunai ke kurir saat barang sampai di rumah Kakak (aman dengan verifikasi WhatsApp).\n` +
    `3. *Ongkir:* Dihitung otomatis sesuai kota & kecamatan tujuan (didukung JNE, J&T, SiCepat, POS).\n\n` +
    `_Ketik *Menu* untuk kembali ke pilihan utama ya Kak 😊_`
  )
}

/**
 * Respon Opsi 4: Sambungkan ke Admin Manusia
 */
const handleHumanCsResponse = () => {
  return (
    `Siap Kak! Chat Kakak sudah kami teruskan ke tim admin toko ya. 🙏\n\n` +
    `Admin kami akan segera membalas langsung di sini. Mohon ditunggu sebentar ya Kak. Terima kasih banyak atas kesabarannya! 😊`
  )
}

/**
 * Respon Default / Fallback saat pesan tidak cocok
 */
const handleDefaultResponse = () => {
  return (
    `Halo Kak! Maaf ya, saya belum begitu paham maksud pesan Kakak 🙏\n\n` +
    `Biar kami bantu dengan cepat, Kakak bisa ketik:\n` +
    `• *Menu* — untuk lihat pilihan menu bantuan\n` +
    `• *Katalog* — untuk lihat produk\n` +
    `• *Pesanan* — untuk cek status paket\n` +
    `• *CS* — kalau mau ngobrol langsung dengan tim admin kami 😊`
  )
}

/**
 * Router Pengolah Pesan Chatbot Masuk
 */
export async function processCustomerMessage(sender, rawMessage, senderName = '') {
  const text = (rawMessage || '').trim().toLowerCase()

  // 1. Deteksi apakah customer mengirim UUID / ID pesanan spesifik
  const uuidMatch = rawMessage?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  if (uuidMatch) {
    return await handleOrderCheckResponse(sender, uuidMatch[0])
  }

  // 2. Greeting & Menu
  if (
    text === 'menu' ||
    text === 'halo' ||
    text === 'hai' ||
    text === 'p' ||
    text === 'assalamualaikum' ||
    text === 'pagi' ||
    text === 'siang' ||
    text === 'sore' ||
    text === 'malam' ||
    text === 'bantuan' ||
    text === 'help'
  ) {
    return buildMainMenuResponse(senderName)
  }

  // 3. Opsi 1: Katalog
  if (text === '1' || text.includes('katalog') || text.includes('produk') || text.includes('barang') || text.includes('daftar')) {
    return await handleCatalogResponse()
  }

  // 4. Opsi 2: Cek Pesanan
  if (text === '2' || text.includes('pesanan') || text.includes('resi') || text.includes('paket') || text.includes('order')) {
    return await handleOrderCheckResponse(sender)
  }

  // 5. Opsi 3: Cara Bayar / COD / Ongkir
  if (text === '3' || text.includes('bayar') || text.includes('cod') || text.includes('ongkir') || text.includes('qris') || text.includes('transfer')) {
    return handlePaymentHelpResponse()
  }

  // 6. Opsi 4: CS / Admin
  if (text === '4' || text.includes('cs') || text.includes('admin') || text.includes('komplain') || text.includes('orang') || text.includes('manusia')) {
    return handleHumanCsResponse()
  }

  // 7. Fallback ramah
  return handleDefaultResponse()
}
