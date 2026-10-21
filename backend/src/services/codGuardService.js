import prisma from '../config/database.js'

/**
 * Service to protect and guard COD (Cash On Delivery) transactions against fraud/fake orders.
 */

const MAX_NEW_USER_COD_AMOUNT = 500000 // Rp 500.000 for first-time buyers

/**
 * Check if a phone or user has a previous cancelled/rejected COD order
 */
export async function hasCodRejectionHistory(userId, shippingPhone) {
  const queryConditions = []
  if (userId) queryConditions.push({ userId })
  if (shippingPhone) queryConditions.push({ shippingPhone })

  if (queryConditions.length === 0) return false

  const rejectedOrder = await prisma.order.findFirst({
    where: {
      OR: queryConditions,
      paymentMethod: { equals: 'cod', mode: 'insensitive' },
      status: 'CANCELLED',
    },
    select: {
      id: true,
      paymentDetails: true,
    },
  })

  if (!rejectedOrder) return false

  // Check if cancellation was due to COD rejection at doorstep
  const details = rejectedOrder.paymentDetails
  return Boolean(details && details.codReturn)
}

/**
 * Check if customer currently has an active ongoing COD order
 */
export async function hasActiveCodOrder(userId, shippingPhone) {
  const queryConditions = []
  if (userId) queryConditions.push({ userId })
  if (shippingPhone) queryConditions.push({ shippingPhone })

  if (queryConditions.length === 0) return false

  const activeOrder = await prisma.order.findFirst({
    where: {
      OR: queryConditions,
      paymentMethod: { equals: 'cod', mode: 'insensitive' },
      status: { in: ['PENDING', 'PROCESSING', 'SHIPPED'] },
    },
    select: {
      id: true,
    },
  })

  return activeOrder
}

/**
 * Check if user is a trusted customer with at least 1 delivered order
 */
export async function isTrustedCustomer(userId) {
  if (!userId) return false

  const deliveredCount = await prisma.order.count({
    where: {
      userId,
      status: 'DELIVERED',
    },
  })

  return deliveredCount > 0
}

/**
 * Comprehensive COD eligibility check
 */
export async function validateCodEligibility({ userId, shippingPhone, totalAmount }) {
  // 1. Blacklist check
  const isBlacklisted = await hasCodRejectionHistory(userId, shippingPhone)
  if (isBlacklisted) {
    return {
      eligible: false,
      reason: 'BLACKLISTED',
      message:
        'Metode pembayaran COD dinonaktifkan untuk akun/nomor ini karena terdapat riwayat penolakan paket COD sebelumnya. Silakan pilih metode pembayaran Transfer Bank, Virtual Account, atau QRIS.',
    }
  }

  // 2. Active ongoing COD order check
  const activeOrder = await hasActiveCodOrder(userId, shippingPhone)
  if (activeOrder) {
    return {
      eligible: false,
      reason: 'ACTIVE_ORDER_EXISTS',
      message:
        'Anda masih memiliki 1 pesanan COD yang sedang diproses atau dalam pengiriman. Mohon selesaikan pesanan tersebut terlebih dahulu sebelum membuat pesanan COD baru.',
    }
  }

  // 3. Amount limit for new customers
  const isTrusted = await isTrustedCustomer(userId)
  const numericTotal = Number(totalAmount) || 0

  if (!isTrusted && numericTotal > MAX_NEW_USER_COD_AMOUNT) {
    const formattedMax = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(MAX_NEW_USER_COD_AMOUNT)

    return {
      eligible: false,
      reason: 'LIMIT_EXCEEDED',
      message: `Untuk pelanggan baru, transaksi COD dibatasi maksimal ${formattedMax}. Silakan gunakan metode pembayaran Transfer Bank, Virtual Account, atau QRIS untuk pesanan ini.`,
    }
  }

  return {
    eligible: true,
    isTrusted,
    maxAmount: isTrusted ? null : MAX_NEW_USER_COD_AMOUNT,
  }
}
