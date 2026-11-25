import crypto from 'crypto'
import prisma from '../config/database.js'
import { HTTP_STATUS } from '../constants/index.js'
import { logInfo, logWarn } from '../utils/logger.js'
import { expectedGrossAmount } from '../services/paymentService.js'
import { cancelPendingOrderAndRestock, updateOrderIfUnchanged } from '../services/orderStockService.js'

const isPaidNotification = (status, fraudStatus) =>
  (status === 'capture' && fraudStatus === 'accept') || status === 'settlement'

/**
 * PENDING -> PAID/PROCESSING only, and only for the exact amount charged.
 * A conditional update makes replays and races no-ops.
 */
async function markOrderPaid(order, grossAmount) {
  if (Math.round(Number(grossAmount)) !== expectedGrossAmount(order)) {
    const amountMismatch = { grossAmount, expected: expectedGrossAmount(order), at: new Date().toISOString() }
    logWarn('Midtrans paid amount does not match order total', { orderId: order.id, ...amountMismatch })
    // Kept on the order (logs are short-lived) so the payment is not lost if the order later expires.
    // Conditional write; if the order changed meanwhile, re-read once so other JSON data is not erased.
    let current = order
    for (let attempt = 0; attempt < 2 && current; attempt++) {
      if (await updateOrderIfUnchanged(current, { paymentDetails: { ...(current.paymentDetails || {}), amountMismatch } })) break
      current = await prisma.order.findUnique({ where: { id: order.id } })
    }
    return 'amount_mismatch'
  }

  const { count } = await prisma.order.updateMany({
    where: { id: order.id, status: 'PENDING', paymentStatus: { not: 'PAID' } },
    data: { paymentStatus: 'PAID', status: 'PROCESSING' },
  })
  if (count) return 'paid'

  // Stock was already returned, so don't reopen (would oversell). Record the money as CANCELLED + PAID
  // so it shows up in the admin panel for a refund or a manual un-cancel (which re-takes stock).
  const late = await prisma.order.updateMany({
    where: { id: order.id, status: 'CANCELLED', paymentStatus: { not: 'PAID' } },
    data: { paymentStatus: 'PAID' },
  })
  if (late.count) {
    logWarn('Payment received for an already cancelled order — refund or restore needed', { orderId: order.id })
    return 'paid_after_cancel'
  }
  return 'ignored'
}

/**
 * Apply a verified Midtrans notification. Every transition is conditional on the current
 * state, so old or replayed notifications can never move an order backwards or restock twice.
 * @returns {Promise<string>} outcome label (for logs/tests)
 */
export async function applyMidtransStatus(order, { transaction_status: status, fraud_status, gross_amount }) {
  if (isPaidNotification(status, fraud_status)) return markOrderPaid(order, gross_amount)

  if (['cancel', 'deny', 'expire'].includes(status)) {
    return (await cancelPendingOrderAndRestock(order.id, order.items)) ? 'cancelled' : 'ignored'
  }

  if (status === 'refund') {
    const { count } = await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: 'PAID' },
      data: { paymentStatus: 'REFUNDED', status: 'CANCELLED' },
    })
    return count ? 'refunded' : 'ignored'
  }

  if (status === 'partial_refund') {
    logWarn('Midtrans partial refund received — review order manually', { orderId: order.id })
    return 'needs_review'
  }

  // 'pending' and unknown statuses never change an existing order
  return 'ignored'
}

/**
 * Handle Midtrans Webhook Notification
 * POST /api/payment/notification
 */
export const handleNotification = async (req, res, next) => {
  try {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = req.body

    logInfo('Received Midtrans notification', { order_id, transaction_status })

    const serverKey = process.env.MIDTRANS_SERVER_KEY
    if (!serverKey) {
      logWarn('Midtrans server key is missing in config')
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Server key not configured' })
    }

    // Verify signature key: SHA512(order_id + status_code + gross_amount + ServerKey)
    const payload = order_id + status_code + gross_amount + serverKey
    const hash = crypto.createHash('sha512').update(payload).digest('hex')

    if (hash !== signature_key) {
      // Never log signatures: the expected one is a valid signature for this payload
      logWarn('Signature verification failed for Midtrans notification', { order_id })
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Invalid signature key' })
    }

    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: { items: true },
    })

    if (!order) {
      logWarn('Order not found for notification', { order_id })
      return res.status(HTTP_STATUS.OK).json({ success: false, message: 'Order not found, notification ignored' })
    }

    const outcome = await applyMidtransStatus(order, { transaction_status, fraud_status, gross_amount })
    logInfo('Midtrans notification handled', { orderId: order_id, transaction_status, outcome })

    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Notification processed', outcome })
  } catch (error) {
    next(error)
  }
}

/**
 * Simulate Payment for mock testing in development environment
 * POST /api/payment/simulate
 */
export const simulatePayment = async (req, res, next) => {
  try {
    // Allowlist: lets a buyer mark their own order PAID, so it must never run outside local development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: 'Simulasi pembayaran hanya tersedia di mode development.',
      })
    }

    const { orderId } = req.body

    if (!orderId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Order ID is required' })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Order not found' })
    }

    // Must be an admin or the owner of the order
    if (req.userRole !== 'ADMIN' && order.userId !== req.userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: 'Access denied: You can only simulate payment for your own orders',
      })
    }

    if (order.status === 'CANCELLED' || order.status === 'EXPIRED') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Cannot pay a cancelled or expired order',
      })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'PROCESSING',
      },
    })

    logInfo('Payment simulated successfully for order', { orderId, userId: req.userId })
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Pembayaran berhasil disimulasikan',
      order: updatedOrder,
    })
  } catch (error) {
    next(error)
  }
}
