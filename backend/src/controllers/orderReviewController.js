import prisma from '../config/database.js'

/**
 * Submit product review & star rating for a completed order
 * POST /api/orders/:id/review
 */
export const createOrderReview = async (req, res, next) => {
  try {
    const { id } = req.params
    const { productId, rating, comment } = req.body

    const parsedRating = parseInt(rating)
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res
        .status(400)
        .json({ error: 'Rating harus bernilai angka antara 1 sampai 5 bintang' })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        items: true,
      },
    })

    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.userId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    if (order.status !== 'DELIVERED') {
      return res
        .status(400)
        .json({ error: 'Ulasan hanya dapat diberikan untuk pesanan yang sudah selesai (DELIVERED)' })
    }

    const isItemInOrder = order.items.some(it => it.productId === productId)
    if (!isItemInOrder) {
      return res.status(400).json({ error: 'Produk tidak ditemukan di dalam pesanan ini' })
    }

    const existingDetails =
      typeof order.paymentDetails === 'object' && order.paymentDetails !== null
        ? order.paymentDetails
        : {}

    const currentReviews = Array.isArray(existingDetails.reviews) ? existingDetails.reviews : []
    const updatedReviews = currentReviews.filter(r => r.productId !== productId)

    const newReview = {
      productId,
      orderId: order.id,
      rating: parsedRating,
      comment: (comment || '').trim(),
      reviewerName: order.user?.name || 'Pelanggan',
      createdAt: new Date().toISOString(),
    }
    updatedReviews.push(newReview)

    await prisma.order.update({
      where: { id },
      data: {
        paymentDetails: {
          ...existingDetails,
          reviews: updatedReviews,
        },
      },
    })

    res.status(201).json({
      success: true,
      message: 'Ulasan berhasil disimpan. Terima kasih atas ulasan Anda!',
      review: newReview,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Fetch verified reviews for a specific product across all completed orders
 * GET /api/products/:id/reviews
 */
export const getProductReviews = async (req, res, next) => {
  try {
    const { id: productId } = req.params

    const completedOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        items: { some: { productId } },
      },
      select: {
        paymentDetails: true,
      },
      take: 100,
    })

    const productReviews = []
    for (const order of completedOrders) {
      const details = order.paymentDetails
      if (details && Array.isArray(details.reviews)) {
        const matching = details.reviews.filter(r => r.productId === productId)
        productReviews.push(...matching)
      }
    }

    // Sort newest first
    productReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const averageRating =
      productReviews.length > 0
        ? Number(
            (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
          )
        : 5.0

    res.json({
      success: true,
      reviews: productReviews,
      averageRating,
      totalReviews: productReviews.length,
    })
  } catch (error) {
    next(error)
  }
}
