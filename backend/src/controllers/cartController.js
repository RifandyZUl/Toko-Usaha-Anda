import prisma from '../config/database.js'
import { transformProduct } from '../utils/productUtils.js'

/**
 * Get user cart
 */
export const getCart = async (req, res, next) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.userId },
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
      orderBy: { createdAt: 'desc' },
    })

    // Transform products to ensure image URLs are complete
    const transformedCartItems = await Promise.all(
      cartItems.map(async item => ({
        ...item,
        product: await transformProduct(item.product),
      }))
    )

    const total = transformedCartItems.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity
    }, 0)

    res.json({
      cartItems: transformedCartItems,
      total,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Add to cart
 */
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' })
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' })
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: req.userId,
          productId,
        },
      },
    })

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity
      if (product.stock < newQuantity) {
        return res.status(400).json({ error: 'Insufficient stock' })
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
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
      })

      // Transform product to ensure image URLs are complete
      const transformedItem = {
        ...updatedItem,
        product: await transformProduct(updatedItem.product),
      }

      return res.json({
        message: 'Cart updated',
        cartItem: transformedItem,
      })
    }

    // Create new cart item
    const cartItem = await prisma.cartItem.create({
      data: {
        userId: req.userId,
        productId,
        quantity,
      },
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
    })

    // Transform product to ensure image URLs are complete
    const transformedItem = {
      ...cartItem,
      product: await transformProduct(cartItem.product),
    }

    res.status(201).json({
      message: 'Item added to cart',
      cartItem: transformedItem,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update cart item
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params
    const { quantity } = req.body

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid quantity is required' })
    }

    // Check if cart item exists and belongs to user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { product: true },
    })

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' })
    }

    if (cartItem.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    if (cartItem.product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' })
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
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
    })

    // Transform product to ensure image URLs are complete
    const transformedItem = {
      ...updatedItem,
      product: await transformProduct(updatedItem.product),
    }

    res.json({
      message: 'Cart item updated',
      cartItem: transformedItem,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Remove from cart
 */
export const removeFromCart = async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if cart item exists and belongs to user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
    })

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' })
    }

    if (cartItem.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    await prisma.cartItem.delete({
      where: { id },
    })

    res.json({ message: 'Item removed from cart' })
  } catch (error) {
    next(error)
  }
}

/**
 * Clear cart
 */
export const clearCart = async (req, res, next) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.userId },
    })

    res.json({ message: 'Cart cleared' })
  } catch (error) {
    next(error)
  }
}

/**
 * Synchronize local cart to database atomically
 * POST /api/cart/sync
 */
export const syncCart = async (req, res, next) => {
  try {
    const { items } = req.body

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' })
    }

    if (items.length === 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: req.userId },
      })
      return res.json({ success: true, message: 'Cart cleared' })
    }

    let syncedCount = 0

    await prisma.$transaction(async (tx) => {
      // 1. Clear existing items
      await tx.cartItem.deleteMany({
        where: { userId: req.userId },
      })

      // 2. Insert valid items with stock validation
      for (const item of items) {
        if (!item?.id && !item?.productId) continue

        const pId = String(item.id || item.productId)
        const qty = parseInt(item.quantity, 10) || 1
        if (qty < 1) continue

        const product = await tx.product.findUnique({
          where: { id: pId },
        })

        if (!product || product.stock < 1) continue

        const safeQty = Math.min(qty, product.stock)

        await tx.cartItem.create({
          data: {
            userId: req.userId,
            productId: pId,
            quantity: safeQty,
          },
        })
        syncedCount++
      }
    })

    if (syncedCount === 0) {
      return res.status(400).json({
        error:
          'Produk dalam keranjang tidak ditemukan di database atau stok habis. Silakan pilih kembali dari katalog.',
      })
    }

    res.json({ success: true, message: 'Cart synchronized successfully' })
  } catch (error) {
    next(error)
  }
}

