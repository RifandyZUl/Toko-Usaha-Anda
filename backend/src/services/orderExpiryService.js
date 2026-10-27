import prisma from '../config/database.js'
import paymentService from './paymentService.js'
import { logInfo, logError, logWarn } from '../utils/logger.js'

/**
 * Check if a pending order has passed its expiration time
 * @param {Object} order - Order object
 * @returns {boolean}
 */
export const isOrderExpired = (order) => {
  if (!order || order.status !== 'PENDING' || order.paymentStatus !== 'PENDING') {
    return false
  }

  // COD orders do not auto-expire on timer
  if (order.paymentMethod === 'COD') {
    return false
  }

  const now = Date.now()

  // 1. Check explicit expiredAt in paymentDetails
  if (order.paymentDetails && order.paymentDetails.expiredAt) {
    const expiryTime = new Date(order.paymentDetails.expiredAt).getTime()
    if (!isNaN(expiryTime)) {
      return now > expiryTime
    }
  }

  // 2. Default fallback expiration times
  const createdTime = new Date(order.createdAt).getTime()
  if (isNaN(createdTime)) return false

  if (order.paymentMethod === 'QRIS') {
    // QRIS expiry: 15 minutes
    return now > createdTime + 15 * 60 * 1000
  }

  // Virtual Account / Midtrans Snap expiry: 24 hours
  return now > createdTime + 24 * 60 * 60 * 1000
}

/**
 * Atomically expire an order and revert product stock
 * @param {string} orderId - ID of order to expire
 * @returns {Promise<Object|null>} Expired order or null
 */
export const expireOrder = async (orderId) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order || order.status !== 'PENDING' || !isOrderExpired(order)) {
      return null
    }

    logInfo('Expiring pending order automatically', { orderId: order.id, method: order.paymentMethod })

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Re-verify status inside transaction to prevent race conditions
      const current = await tx.order.findUnique({
        where: { id: orderId },
      })

      if (!current || current.status !== 'PENDING') {
        return current
      }

      // Revert product and variant stocks atomically
      for (const item of order.items) {
        if (item.variantId) {
          try {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            })
          } catch (e) {
            // Variant might have been deleted, continue safely
          }
        }
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }

      // Mark order as CANCELLED and payment as FAILED
      return await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })
    })

    // Cancel transaction with Midtrans if applicable
    try {
      await paymentService.cancelTransaction(order.id)
    } catch (cancelErr) {
      logWarn('Midtrans cancel failed for auto-expired order', { orderId: order.id, error: cancelErr.message })
    }

    return updatedOrder
  } catch (error) {
    logError('Error expiring order', { orderId, error: error.message })
    return null
  }
}

/**
 * Scan database for expired pending orders and process them
 */
export const checkAndExpirePendingOrders = async () => {
  try {
    // Find candidate pending orders (excluding COD)
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: { not: 'COD' },
      },
      include: { items: true },
    })

    for (const order of pendingOrders) {
      if (isOrderExpired(order)) {
        await expireOrder(order.id)
      }
    }
  } catch (error) {
    logError('Error during periodic order expiry check', error)
  }
}

/**
 * Start background cron interval for auto-expiring pending orders
 * @param {number} intervalMs - Check interval in milliseconds (default: 60s)
 */
export const startOrderExpiryCron = (intervalMs = 60 * 1000) => {
  // Run initial check on startup
  checkAndExpirePendingOrders()

  // Schedule periodic checks
  const intervalId = setInterval(checkAndExpirePendingOrders, intervalMs)
  logInfo('⏱️ Order expiry background service started', { intervalSeconds: intervalMs / 1000 })

  return intervalId
}
