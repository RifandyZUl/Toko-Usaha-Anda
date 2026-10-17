import crypto from 'crypto'
import prisma from '../config/database.js'
import { HTTP_STATUS } from '../constants/index.js'
import { logInfo, logWarn } from '../utils/logger.js'

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
      logWarn('Signature verification failed for Midtrans notification', {
        order_id,
        receivedSignature: signature_key,
        expectedSignature: hash,
      })
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Invalid signature key' })
    }

    // Fetch the order from the database
    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: {
        items: true,
      },
    })

    if (!order) {
      logWarn('Order not found for notification', { order_id })
      return res.status(HTTP_STATUS.OK).json({ success: false, message: 'Order not found, notification ignored' })
    }

    let paymentStatus = 'PENDING'
    let orderStatus = 'PENDING'

    // Map transaction status to local enum states
    if (
      (transaction_status === 'capture' && fraud_status === 'accept') ||
      transaction_status === 'settlement'
    ) {
      paymentStatus = 'PAID'
      orderStatus = 'PROCESSING'
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      paymentStatus = 'FAILED'
      orderStatus = 'CANCELLED'

      // Revert product stocks if order is newly cancelled
      if (order.status !== 'CANCELLED') {
        logInfo('Reverting stock for cancelled/expired order', { order_id })
        await prisma.$transaction(async (tx) => {
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            })
          }
        })
      }
    } else if (transaction_status === 'pending') {
      paymentStatus = 'PENDING'
      orderStatus = 'PENDING'
    } else if (transaction_status === 'refund' || transaction_status === 'partial_refund') {
      paymentStatus = 'REFUNDED'
      orderStatus = 'CANCELLED'
    }

    // Update order status in the database
    const updatedOrder = await prisma.order.update({
      where: { id: order_id },
      data: {
        paymentStatus,
        status: orderStatus,
      },
    })

    logInfo('Order updated successfully from webhook', {
      orderId: order_id,
      paymentStatus: updatedOrder.paymentStatus,
      orderStatus: updatedOrder.status,
    })

    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Notification processed' })
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
    const { orderId } = req.body

    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Only allowed in development mode' })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Order not found' })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'PROCESSING',
      },
    })

    logInfo('Payment simulated successfully for order', { orderId })
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Pembayaran berhasil disimulasikan',
      order: updatedOrder,
    })
  } catch (error) {
    next(error)
  }
}
