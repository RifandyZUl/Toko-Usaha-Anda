import prisma from '../config/database.js'
import { transformProduct } from '../utils/productUtils.js'
import paymentService from '../services/paymentService.js'
import { isOrderExpired, expireOrder } from '../services/orderExpiryService.js'
import { isOrderEligibleForAutoComplete, autoCompleteOrder } from '../services/orderAutoCompleteService.js'
import { trackOrderShipping } from '../services/shippingTrackingService.js'
import { validateCodEligibility } from '../services/codGuardService.js'
import { isPhoneNumberVerified, normalizePhoneNumber } from '../services/otpService.js'
import { calculateOrderShippingFee } from '../services/shippingService.js'
import { logWarn, logError } from '../utils/logger.js'

/**
 * Create order
 */
export const createOrder = async (req, res, next) => {
  try {
    const {
      receiverName,
      shippingPhone,
      addressDetail,
      province,
      city,
      subdistrict,
      kelurahan,
      postalCode,
      latitude,
      longitude,
      shippingCourier,
      shippingFee,
      paymentMethod,
    } = req.body

    const shippingAddress = `${receiverName} | ${addressDetail}, ${kelurahan}, ${subdistrict}, ${city}, ${province} ${postalCode}`

    // Get user cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.userId },
      include: {
        product: true,
        variant: true,
      },
    })

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' })
    }

    // Calculate total and validate stock
    let totalAmount = 0
    const orderItems = []

    for (const cartItem of cartItems) {
      const isVariant = Boolean(cartItem.variantId && cartItem.variant)
      const currentStock = isVariant ? cartItem.variant.stock : cartItem.product.stock
      const currentPrice = isVariant ? Number(cartItem.variant.price) : Number(cartItem.product.price)
      const itemName = isVariant ? `${cartItem.product.name} (${cartItem.variant.name})` : cartItem.product.name

      if (cartItem.variantId && (!cartItem.variant || cartItem.variant.deletedAt !== null || !cartItem.variant.isActive)) {
        return res.status(400).json({
          error: `Varian untuk produk "${cartItem.product.name}" sudah tidak tersedia atau telah dihapus dari katalog. Silakan sesuaikan keranjang belanja Anda.`,
        })
      }

      if (currentStock < cartItem.quantity) {
        return res.status(400).json({
          error: `Stok tidak mencukupi untuk ${itemName} (tersedia ${currentStock})`,
        })
      }

      const itemTotal = currentPrice * cartItem.quantity
      totalAmount += itemTotal

      orderItems.push({
        productId: cartItem.productId,
        variantId: cartItem.variantId || null,
        variantName: isVariant ? cartItem.variant.name : null,
        quantity: cartItem.quantity,
        price: currentPrice,
      })
    }

    // Verify and calculate shipping fee on server (never trust client shipping fee directly)
    let totalWeight = 0
    for (const cartItem of cartItems) {
      const itemWeight = Number(cartItem.variant?.weight ?? cartItem.product.weight ?? 1000)
      totalWeight += itemWeight * cartItem.quantity
    }
    const verifiedShippingFee = await calculateOrderShippingFee({
      city,
      province,
      courier: shippingCourier || 'JNE',
      weight: totalWeight,
    })

    // Strict integrity check: Verify that client shipping fee matches server-calculated fee
    // Prevents checkout discrepancy if admin updated variant weight or rates while user was on checkout page
    const clientShippingFee = Number(shippingFee)
    if (!isNaN(clientShippingFee) && Math.abs(clientShippingFee - verifiedShippingFee) > 1) {
      logWarn('Shipping fee discrepancy detected at checkout', {
        userId: req.userId,
        clientShippingFee,
        verifiedShippingFee,
        totalWeight,
      })
      return res.status(409).json({
        error: `Tarif pengiriman telah diperbarui dari Rp${clientShippingFee.toLocaleString('id-ID')} menjadi Rp${verifiedShippingFee.toLocaleString('id-ID')} karena penyesuaian bobot atau kurir. Total pesanan telah disesuaikan. Silakan periksa kembali dan klik Bayar Sekarang.`,
        code: 'SHIPPING_FEE_CHANGED',
        oldShippingFee: clientShippingFee,
        newShippingFee: verifiedShippingFee,
      })
    }

    // Reject COD payment method (disabled for security)
    if (paymentMethod && paymentMethod.toLowerCase() === 'cod') {
      return res.status(400).json({
        error:
          'Metode pembayaran COD (Bayar di Tempat) telah dinonaktifkan demi keamanan transaksi. Silakan pilih metode pembayaran Transfer Bank, Virtual Account, atau QRIS.',
        code: 'COD_DISABLED',
      })
    }

    // Create order with items (transaction)
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const newOrder = await tx.order.create({
        data: {
          userId: req.userId,
          totalAmount,
          shippingAddress,
          shippingPhone,
          shippingCourier: shippingCourier || 'JNE',
          shippingFee: verifiedShippingFee,
          paymentMethod,
          latitude,
          longitude,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      // 2. Atomically check and decrement product and variant stock to prevent race conditions
      for (const cartItem of cartItems) {
        if (cartItem.variantId) {
          const updateVariant = await tx.productVariant.updateMany({
            where: {
              id: cartItem.variantId,
              stock: { gte: cartItem.quantity },
            },
            data: {
              stock: {
                decrement: cartItem.quantity,
              },
            },
          })

          if (updateVariant.count === 0) {
            throw new Error(`Stok tidak mencukupi untuk varian ${cartItem.variant?.name || ''}`)
          }

          // Also keep parent product total stock in sync
          await tx.product.update({
            where: { id: cartItem.productId },
            data: {
              stock: {
                decrement: cartItem.quantity,
              },
            },
          })
        } else {
          const updateResult = await tx.product.updateMany({
            where: {
              id: cartItem.productId,
              stock: { gte: cartItem.quantity },
            },
            data: {
              stock: {
                decrement: cartItem.quantity,
              },
            },
          })

          if (updateResult.count === 0) {
            throw new Error(`Stok tidak mencukupi untuk ${cartItem.product.name}`)
          }
        }
      }

      // 3. Clear cart
      await tx.cartItem.deleteMany({
        where: { userId: req.userId },
      })

      return newOrder
    })

    // Transform products in order items to ensure image URLs are complete
    const transformedOrder = {
      ...order,
      items: await Promise.all(
        order.items.map(async item => ({
          ...item,
          product: await transformProduct(item.product),
        }))
      ),
    }

    let snapToken = null
    let redirectUrl = null
    let paymentDetails = null

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
      })

      if (paymentMethod === 'MIDTRANS') {
        const snapResult = await paymentService.createSnapToken(
          order,
          cartItems,
          user,
          shippingPhone,
          shippingAddress
        )
        snapToken = snapResult.snapToken
        redirectUrl = snapResult.redirectUrl
        
        // Save snapToken as paymentId in the database
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentId: snapToken },
        })
        transformedOrder.paymentId = snapToken
      } else if (paymentMethod.startsWith('TRANSFER_')) {
        const bankName = paymentMethod.split('_')[1]
        const chargeResult = await paymentService.chargeVirtualAccount(
          order,
          cartItems,
          user,
          shippingPhone,
          shippingAddress,
          bankName
        )
        paymentDetails = chargeResult

        // Save details in order
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentId: chargeResult.transactionId,
            paymentDetails: chargeResult,
          },
        })
        transformedOrder.paymentId = chargeResult.transactionId
        transformedOrder.paymentDetails = chargeResult
      } else if (paymentMethod === 'QRIS') {
        const chargeResult = await paymentService.chargeQris(
          order,
          cartItems,
          user,
          shippingPhone,
          shippingAddress
        )
        paymentDetails = chargeResult

        // Save details in order
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentId: chargeResult.transactionId,
            paymentDetails: chargeResult,
          },
        })
        transformedOrder.paymentId = chargeResult.transactionId
        transformedOrder.paymentDetails = chargeResult
      }
    } catch (paymentError) {
      console.error('Failed to create payment transaction:', paymentError)

      // Rollback order status and restore product stock if payment gateway call failed
      try {
        await prisma.$transaction(async (tx) => {
          for (const cartItem of cartItems) {
            await tx.product.update({
              where: { id: cartItem.productId },
              data: {
                stock: {
                  increment: cartItem.quantity,
                },
              },
            })
          }
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'CANCELLED',
              paymentStatus: 'FAILED',
            },
          })
        })
      } catch (rollbackError) {
        console.error('Failed to rollback order after payment failure:', rollbackError)
      }

      return res.status(500).json({
        error: 'Gagal memproses transaksi pembayaran. Silakan coba beberapa saat lagi.',
      })
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: transformedOrder,
      snapToken,
      redirectUrl,
      paymentDetails,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get user orders (or all orders if admin)
 */
export const getOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const skip = (page - 1) * limit

    // Allow ADMIN to see all orders by default unless explicit self query is passed
    const showAllOrders = req.userRole === 'ADMIN' && req.query.self !== 'true'
    const where = showAllOrders ? {} : { userId: req.userId }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              variant: true,
              product: {
                include: {
                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ])

    // Transform products in order items to ensure image URLs are complete
    const transformedOrders = await Promise.all(
      orders.map(async order => ({
        ...order,
        items: await Promise.all(
          order.items.map(async item => ({
            ...item,
            product: await transformProduct(item.product),
          }))
        ),
      }))
    )

    res.json({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get order by ID
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params

    let order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: true,
            product: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Check if order belongs to user (unless admin)
    if (order.userId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Check and trigger lazy expiry if order is past expiration window
    if (isOrderExpired(order)) {
      const expired = await expireOrder(order.id)
      if (expired) {
        order = expired
      }
    }

    // Check and trigger lazy auto-complete if shipped order passed 2 days window
    if (isOrderEligibleForAutoComplete(order)) {
      const completed = await autoCompleteOrder(order.id)
      if (completed) {
        order = completed
      }
    }

    // Transform products in order items to ensure image URLs are complete
    const transformedOrder = {
      ...order,
      items: await Promise.all(
        order.items.map(async item => ({
          ...item,
          product: await transformProduct(item.product),
        }))
      ),
    }

    res.json({ order: transformedOrder })
  } catch (error) {
    next(error)
  }
}

/**
 * Get shipping tracking info for an order
 * GET /api/orders/:id/tracking
 */
export const getOrderTracking = async (req, res, next) => {
  try {
    const { id } = req.params

    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (order.userId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const tracking = await trackOrderShipping(order)
    res.json({ success: true, tracking })
  } catch (error) {
    next(error)
  }
}

/**
 * Update order status (Admin only)
 * Atomically handles stock reversion on cancellation (e.g. COD return)
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({ error: 'Status is required' })
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // 1. Fetch current order with items
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // 2. Adjust paymentStatus according to workflow
    let paymentStatus = existingOrder.paymentStatus

    // For COD: Delivered implies cash collected (PAID)
    if (existingOrder.paymentMethod === 'COD' && status === 'DELIVERED') {
      paymentStatus = 'PAID'
    }

    // For Cancelled: Mark FAILED if not already paid
    if (status === 'CANCELLED' && paymentStatus !== 'PAID') {
      paymentStatus = 'FAILED'
    }

    // 3. Atomically update status and revert product stock if cancelled (e.g. COD return)
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Revert product and variant stock when moving to CANCELLED from non-cancelled
      // Uses updateMany so it never throws error or aborts transaction if variant/product was deleted by admin
      if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
        for (const item of existingOrder.items) {
          if (item.variantId) {
            await tx.productVariant.updateMany({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            })
          }
          await tx.product.updateMany({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          })
        }
      }

      // Re-decrement stock if un-cancelling an order
      if (existingOrder.status === 'CANCELLED' && status !== 'CANCELLED') {
        for (const item of existingOrder.items) {
          if (item.variantId) {
            const variantExists = await tx.productVariant.findUnique({
              where: { id: item.variantId },
            })
            if (!variantExists) {
              throw new Error(`Varian "${item.variantName || 'Produk'}" telah dihapus secara permanen dari katalog, pesanan tidak dapat diaktifkan kembali`)
            }
            const vResult = await tx.productVariant.updateMany({
              where: {
                id: item.variantId,
                stock: { gte: item.quantity },
              },
              data: { stock: { decrement: item.quantity } },
            })
            if (vResult.count === 0) {
              throw new Error(`Stok varian "${item.variantName || 'Produk'}" tidak mencukupi untuk mengembalikan pesanan`)
            }
          }
          const updateResult = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })

          if (updateResult.count === 0) {
            throw new Error('Stok tidak mencukupi untuk mengembalikan pesanan')
          }
        }
      }

      const existingDetails = (typeof existingOrder.paymentDetails === 'object' && existingOrder.paymentDetails !== null)
        ? existingOrder.paymentDetails
        : {}

      let newPaymentDetails = existingOrder.paymentDetails
      if (req.body.trackingNumber || status === 'SHIPPED') {
        const trackingNum = req.body.trackingNumber?.trim() || existingDetails.shippingDetails?.trackingNumber || `RESI-${(req.body.courier || existingOrder.shippingCourier || 'JNE').toUpperCase()}-${existingOrder.id.slice(0, 8).toUpperCase()}`
        const courier = req.body.courier?.trim() || existingOrder.shippingCourier || 'JNE'
        newPaymentDetails = {
          ...existingDetails,
          shippingDetails: {
            ...(existingDetails.shippingDetails || {}),
            trackingNumber: trackingNum,
            courier,
            shippedAt: status === 'SHIPPED' ? new Date().toISOString() : existingDetails.shippingDetails?.shippedAt,
            deliveredAt: status === 'DELIVERED' ? new Date().toISOString() : existingDetails.shippingDetails?.deliveredAt,
          },
        }
      }

      return await tx.order.update({
        where: { id },
        data: {
          status,
          paymentStatus,
          paymentDetails: newPaymentDetails,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    })

    // If cancelled and was linked to Midtrans, cancel on Midtrans gateway
    if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
      try {
        await paymentService.cancelTransaction(existingOrder.id)
      } catch (cancelErr) {
        logWarn('Failed to cancel Midtrans transaction in updateOrderStatus', {
          orderId: existingOrder.id,
          error: cancelErr.message,
        })
      }
    }

    const transformedOrder = {
      ...updatedOrder,
      items: await Promise.all(
        updatedOrder.items.map(async item => ({
          ...item,
          product: await transformProduct(item.product),
        }))
      ),
    }

    res.json({
      message: 'Order status updated successfully',
      order: transformedOrder,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Cancel pending order (User / Admin)
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params

    // 1. Find the order with items
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // 2. Validate user ownership
    if (order.userId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // 3. Verify order is PENDING and not already PAID
    if (order.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Hanya pesanan berstatus PENDING yang dapat dibatalkan',
      })
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({
        error: 'Pesanan yang sudah dibayar tidak dapat dibatalkan secara otomatis',
      })
    }

    // 4. Cancel order and revert product stocks in a Prisma transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Revert product and variant stocks safely (gracefully ignores if deleted by admin)
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.updateMany({
            where: { id: item.variantId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          })
        }
        await tx.product.updateMany({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }

      // Update order status to CANCELLED and paymentStatus to FAILED
      return await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    })

    // 5. Call Midtrans cancel transaction API
    try {
      await paymentService.cancelTransaction(order.id)
    } catch (midtransError) {
      logError('Failed to cancel Midtrans transaction during order cancellation', midtransError, {
        orderId: order.id,
      })
    }

    // 6. Transform products in order items to ensure image URLs are complete
    const transformedOrder = {
      ...updatedOrder,
      items: await Promise.all(
        updatedOrder.items.map(async item => ({
          ...item,
          product: await transformProduct(item.product),
        }))
      ),
    }

    res.json({
      message: 'Pesanan berhasil dibatalkan dan stok telah diperbarui',
      order: transformedOrder,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Confirm order received / complete order (Customer / Admin)
 * POST /api/orders/:id/complete
 */
export const completeOrder = async (req, res, next) => {
  try {
    const { id } = req.params

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (order.userId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    if (order.status !== 'SHIPPED') {
      return res.status(400).json({
        error: 'Hanya pesanan yang sedang dikirim (SHIPPED) yang dapat dikonfirmasi selesai',
      })
    }

    const existingDetails = (typeof order.paymentDetails === 'object' && order.paymentDetails !== null)
      ? order.paymentDetails
      : {}

    const newPaymentDetails = {
      ...existingDetails,
      shippingDetails: {
        ...(existingDetails.shippingDetails || {}),
        deliveredAt: existingDetails.shippingDetails?.deliveredAt || new Date().toISOString(),
        completedAt: new Date().toISOString(),
        completedBy: 'CUSTOMER',
      },
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        paymentStatus: order.paymentMethod === 'COD' ? 'PAID' : order.paymentStatus,
        paymentDetails: newPaymentDetails,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
      },
    })

    const transformedOrder = {
      ...updatedOrder,
      items: await Promise.all(
        updatedOrder.items.map(async item => ({
          ...item,
          product: await transformProduct(item.product),
        }))
      ),
    }

    res.json({
      message: 'Pesanan berhasil diselesaikan. Terima kasih telah berbelanja!',
      order: transformedOrder,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handle COD Return / Package rejected by customer at door
 * Atomically cancels order, marks FAILED, and returns product stock to warehouse
 * POST /api/orders/:id/reject-cod (Admin only)
 */
export const rejectCodOrder = async (req, res, next) => {
  try {
    const { id } = req.params
    const { reason = 'Paket ditolak oleh pembeli saat pengiriman COD' } = req.body

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.paymentMethod !== 'COD') {
      return res.status(400).json({ error: 'Hanya pesanan metode COD yang dapat diproses sebagai Retur COD' })
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Pesanan sudah berstatus dibatalkan' })
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Revert product stocks to warehouse
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }

      // 2. Update order status and record COD rejection metadata
      const existingDetails = (typeof order.paymentDetails === 'object' && order.paymentDetails !== null)
        ? order.paymentDetails
        : {}

      return await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
          paymentDetails: {
            ...existingDetails,
            codReturn: {
              isCodRejected: true,
              reason,
              rejectedAt: new Date().toISOString(),
              processedBy: req.userId,
              returnedToWarehouse: true,
            },
          },
        },
      })
    })

    res.json({
      success: true,
      message: 'Retur COD berhasil diproses. Stok produk telah dikembalikan ke gudang.',
      order: updatedOrder,
    })
  } catch (error) {
    next(error)
  }
}

// Re-export dispute and review handlers from dedicated modular controllers
export { createOrderDispute, resolveOrderDispute } from './orderDisputeController.js'
export { createOrderReview, getProductReviews } from './orderReviewController.js'


/**
 * GET /api/orders/cod-eligibility
 * Check if the current user and phone number are eligible for COD payment
 */
export const checkCodEligibility = async (req, res, next) => {
  try {
    const phone = req.query.phone || ''
    const amount = Number(req.query.amount) || 0

    const eligibility = await validateCodEligibility({
      userId: req.userId,
      shippingPhone: phone,
      totalAmount: amount,
    })

    let isVerified = isPhoneNumberVerified(phone)
    if (!isVerified && req.userId && phone) {
      const userRecord = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { phone: true },
      })
      if (
        userRecord?.phone &&
        normalizePhoneNumber(userRecord.phone) === normalizePhoneNumber(phone)
      ) {
        isVerified = true
      }
    }

    return res.status(200).json({
      success: true,
      ...eligibility,
      isPhoneVerified: isVerified,
    })
  } catch (error) {
    next(error)
  }
}



