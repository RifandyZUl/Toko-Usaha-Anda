import prisma from '../config/database.js'
import { validateOrder } from '../utils/validators.js'

/**
 * Create order
 */
export const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, shippingPhone, paymentMethod } = req.body

    // Validate input
    const validation = validateOrder({ shippingAddress, shippingPhone, paymentMethod })
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors })
    }

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
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: req.userId,
          totalAmount,
          shippingAddress,
          shippingPhone,
          paymentMethod,
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

      // Update product stock
      for (const cartItem of cartItems) {
        await tx.product.update({
          where: { id: cartItem.productId },
          data: {
            stock: {
              decrement: cartItem.quantity,
            },
          },
        })
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { userId: req.userId },
      })

      return newOrder
    })

    res.status(201).json({
      message: 'Order created successfully',
      order,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get user orders
 */
export const getOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId },
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
      orderBy: { createdAt: 'desc' },
    })

    res.json({ orders })
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

    res.json({ order })
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

