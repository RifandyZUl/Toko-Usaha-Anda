import prisma from '../config/database.js'
import { transformProduct } from '../utils/productUtils.js'
import paymentService from '../services/paymentService.js'

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
      },
    })

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' })
    }

    // Calculate total and validate stock
    let totalAmount = 0
    const orderItems = []

    for (const cartItem of cartItems) {
      if (cartItem.product.stock < cartItem.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${cartItem.product.name}`,
        })
      }

      const itemTotal = Number(cartItem.product.price) * cartItem.quantity
      totalAmount += itemTotal

      orderItems.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: cartItem.product.price,
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
          shippingCourier,
          shippingFee,
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

      // 2. Atomically check and decrement product stock to prevent race conditions
      for (const cartItem of cartItems) {
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

    // If admin, get all orders. Otherwise, get only user's orders
    const where = req.userRole === 'ADMIN' ? {} : { userId: req.userId }

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

    const order = await prisma.order.findUnique({
      where: { id },
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

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Check if order belongs to user (unless admin)
    if (order.userId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' })
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
 * Update order status (Admin only)
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

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    res.json({
      message: 'Order status updated',
      order,
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
      // Revert product stocks
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
      console.error('Failed to cancel Midtrans transaction during order cancellation:', midtransError)
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

