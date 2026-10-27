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
            variants: {
              where: { isActive: true },
              orderBy: { price: 'asc' },
            },
          },
        },
        variant: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform products to ensure image URLs are complete and variant price/stock is reflected
    const transformedCartItems = await Promise.all(
      cartItems.map(async item => {
        const transformedProduct = await transformProduct(item.product)
        const effectivePrice = item.variant ? Number(item.variant.price) : Number(item.product.price)
        const effectiveStock = item.variant ? item.variant.stock : item.product.stock

        return {
          ...item,
          product: transformedProduct,
          price: effectivePrice,
          effectivePrice,
          effectiveStock,
          variantName: item.variant ? item.variant.name : null,
        }
      })
    )

    const total = transformedCartItems.reduce((sum, item) => {
      return sum + item.effectivePrice * item.quantity
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
    const { productId, variantId = null, quantity = 1 } = req.body

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' })
    }

    const qty = parseInt(quantity, 10) || 1
    if (qty < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' })
    }

    // Check if product exists with its variants
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          where: { isActive: true },
        },
      },
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    let selectedVariant = null
    if (product.variants && product.variants.length > 0) {
      if (!variantId) {
        return res.status(400).json({ error: 'Silakan pilih varian produk terlebih dahulu' })
      }
      selectedVariant = product.variants.find(v => v.id === variantId)
      if (!selectedVariant) {
        return res.status(400).json({ error: 'Varian produk yang dipilih tidak valid' })
      }
      if (selectedVariant.stock < qty) {
        return res.status(400).json({
          error: `Stok varian ${selectedVariant.name} tidak mencukupi (tersisa ${selectedVariant.stock})`,
        })
      }
    } else {
      if (product.stock < qty) {
        return res.status(400).json({ error: 'Insufficient stock' })
      }
    }

    // Check if item already in cart for this user, product, and variant
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: req.userId,
        productId,
        variantId: variantId || null,
      },
    })

    const maxStock = selectedVariant ? selectedVariant.stock : product.stock

    if (existingItem) {
      const newQuantity = existingItem.quantity + qty
      if (maxStock < newQuantity) {
        return res.status(400).json({
          error: `Stok tidak mencukupi (maksimal ${maxStock})`,
        })
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
          variant: true,
        },
      })

      const transformedItem = {
        ...updatedItem,
        product: await transformProduct(updatedItem.product),
        price: updatedItem.variant ? Number(updatedItem.variant.price) : Number(updatedItem.product.price),
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
        variantId: variantId || null,
        quantity: qty,
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
        variant: true,
      },
    })

    const transformedItem = {
      ...cartItem,
      product: await transformProduct(cartItem.product),
      price: cartItem.variant ? Number(cartItem.variant.price) : Number(cartItem.product.price),
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
      include: { product: true, variant: true },
    })

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' })
    }

    if (cartItem.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const maxStock = cartItem.variant ? cartItem.variant.stock : cartItem.product.stock
    if (maxStock < quantity) {
      return res.status(400).json({ error: `Insufficient stock (max: ${maxStock})` })
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
        variant: true,
      },
    })

    // Transform product to ensure image URLs are complete
    const transformedItem = {
      ...updatedItem,
      product: await transformProduct(updatedItem.product),
      price: updatedItem.variant ? Number(updatedItem.variant.price) : Number(updatedItem.product.price),
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
 * Synchronize local cart to database atomically (Supports Smart Merge or Replace)
 * POST /api/cart/sync
 * Body: { items: Array, mode: 'merge' | 'replace' }
 */
export const syncCart = async (req, res, next) => {
  try {
    const { items, mode = 'merge' } = req.body

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' })
    }

    if (items.length === 0) {
      if (mode === 'replace') {
        await prisma.cartItem.deleteMany({
          where: { userId: req.userId },
        })
      }
      return res.json({ success: true, message: 'Cart synced' })
    }

    let syncedCount = 0

    await prisma.$transaction(async (tx) => {
      // If replace mode, clear old items first
      if (mode === 'replace') {
        await tx.cartItem.deleteMany({
          where: { userId: req.userId },
        })
      }

      // Fetch existing DB cart items to handle smart merge
      const existingDbItems = await tx.cartItem.findMany({
        where: { userId: req.userId },
      })

      // Insert or merge valid items with stock & variant validation
      for (const item of items) {
        if (!item?.id && !item?.productId) continue

        const pId = String(item.productId || item.id)
        const vId = item.variantId ? String(item.variantId) : null
        const qty = parseInt(item.quantity, 10) || 1
        if (qty < 1) continue

        const product = await tx.product.findUnique({
          where: { id: pId },
          include: {
            variants: {
              where: { isActive: true },
            },
          },
        })

        if (!product) continue

        let maxStock = product.stock
        if (vId) {
          const variant = product.variants?.find(v => v.id === vId)
          if (!variant || variant.stock < 1) continue
          maxStock = variant.stock
        } else if (product.variants?.length > 0) {
          // If product requires variant but none specified, skip
          continue
        }

        if (maxStock < 1) continue

        // Check if item already exists in user's DB cart
        const existingMatch = existingDbItems.find(
          dbItem => dbItem.productId === pId && (dbItem.variantId || null) === (vId || null)
        )

        if (existingMatch && mode === 'merge') {
          // Smart merge: increment quantity, capped at available stock
          const mergedQty = Math.min(existingMatch.quantity + qty, maxStock)
          await tx.cartItem.update({
            where: { id: existingMatch.id },
            data: { quantity: mergedQty },
          })
          syncedCount++
        } else if (!existingMatch || mode === 'replace') {
          const safeQty = Math.min(qty, maxStock)
          await tx.cartItem.create({
            data: {
              userId: req.userId,
              productId: pId,
              variantId: vId,
              quantity: safeQty,
            },
          })
          syncedCount++
        }
      }
    })

    if (syncedCount === 0 && items.length > 0) {
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

