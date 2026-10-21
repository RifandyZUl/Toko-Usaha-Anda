import prisma from '../config/database.js'
import { logInfo, logError } from '../utils/logger.js'

// 2 days in milliseconds: 2 * 24 * 60 * 60 * 1000 = 172,800,000 ms
export const AUTO_COMPLETE_DELAY_MS = 2 * 24 * 60 * 60 * 1000

/**
 * Check if a shipped order has passed 2 days window since delivery or shipment
 * @param {Object} order - Order object
 * @returns {boolean}
 */
export const isOrderEligibleForAutoComplete = (order) => {
  if (!order || order.status !== 'SHIPPED') {
    return false
  }

  // Do not auto-complete if order is currently under customer dispute / complaint review
  if (order.paymentDetails?.disputeDetails?.status === 'PENDING_REVIEW') {
    return false
  }

  const shippingDetails = order.paymentDetails?.shippingDetails || {}
  const now = Date.now()

  // 1. If deliveredAt is recorded (courier delivered package), check 2 days from deliveredAt
  if (shippingDetails.deliveredAt) {
    const deliveredTime = new Date(shippingDetails.deliveredAt).getTime()
    if (!isNaN(deliveredTime)) {
      return now >= deliveredTime + AUTO_COMPLETE_DELAY_MS
    }
  }

  // 2. If shippedAt is recorded, fallback to 2 days from shippedAt
  if (shippingDetails.shippedAt) {
    const shippedTime = new Date(shippingDetails.shippedAt).getTime()
    if (!isNaN(shippedTime)) {
      return now >= shippedTime + AUTO_COMPLETE_DELAY_MS
    }
  }

  // 3. Fallback: 2 days from order updatedAt when it was marked SHIPPED
  const updatedTime = new Date(order.updatedAt).getTime()
  if (!isNaN(updatedTime)) {
    return now >= updatedTime + AUTO_COMPLETE_DELAY_MS
  }

  return false
}

/**
 * Atomically marks an order as DELIVERED (auto-completed)
 * @param {string} orderId - ID of order to complete
 * @returns {Promise<Object|null>}
 */
export const autoCompleteOrder = async (orderId) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order || order.status !== 'SHIPPED') {
      return null
    }

    logInfo('Auto-completing shipped order after 2 days', { orderId: order.id })

    const existingDetails = (typeof order.paymentDetails === 'object' && order.paymentDetails !== null)
      ? order.paymentDetails
      : {}

    const newPaymentDetails = {
      ...existingDetails,
      shippingDetails: {
        ...(existingDetails.shippingDetails || {}),
        deliveredAt: existingDetails.shippingDetails?.deliveredAt || new Date().toISOString(),
        completedAt: new Date().toISOString(),
        completedBy: 'SYSTEM_AUTO_2_DAYS',
      },
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        paymentStatus: order.paymentMethod === 'COD' ? 'PAID' : order.paymentStatus,
        paymentDetails: newPaymentDetails,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return updatedOrder
  } catch (error) {
    logError('Error auto-completing order', { orderId, error: error.message })
    return null
  }
}

/**
 * Scan database for SHIPPED orders and auto-complete those older than 2 days
 */
export const checkAndAutoCompleteShippedOrders = async () => {
  try {
    const shippedOrders = await prisma.order.findMany({
      where: {
        status: 'SHIPPED',
      },
      take: 50,
    })

    for (const order of shippedOrders) {
      if (isOrderEligibleForAutoComplete(order)) {
        await autoCompleteOrder(order.id)
      }
    }
  } catch (error) {
    logError('Error during periodic order auto-complete check', error)
  }
}

/**
 * Start background cron interval for auto-completing delivered/shipped orders
 * @param {number} intervalMs - Check interval in milliseconds (default: 5 minutes)
 */
export const startOrderAutoCompleteCron = (intervalMs = 5 * 60 * 1000) => {
  checkAndAutoCompleteShippedOrders()
  const intervalId = setInterval(checkAndAutoCompleteShippedOrders, intervalMs)
  logInfo('📦 Order auto-complete background service started (2 days window)', { intervalSeconds: intervalMs / 1000 })
  return intervalId
}
