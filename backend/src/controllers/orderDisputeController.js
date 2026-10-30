import prisma from '../config/database.js'

/**
 * Customer files a dispute / complaint for a shipped or delivered order
 * POST /api/orders/:id/dispute
 */
export const createOrderDispute = async (req, res, next) => {
  try {
    const { id } = req.params
    const { reason, description, solutionExpected } = req.body

    if (!reason || !description) {
      return res.status(400).json({ error: 'Alasan dan deskripsi komplain wajib diisi' })
    }

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) return res.status(404).json({ error: 'Order not found' })

    if (order.userId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    if (!['SHIPPED', 'DELIVERED'].includes(order.status)) {
      return res
        .status(400)
        .json({ error: 'Komplain hanya dapat diajukan saat barang dikirim atau diterima' })
    }

    const existingDetails =
      typeof order.paymentDetails === 'object' && order.paymentDetails !== null
        ? order.paymentDetails
        : {}

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paymentDetails: {
          ...existingDetails,
          disputeDetails: {
            isDisputed: true,
            reason,
            description,
            solutionExpected,
            disputedAt: new Date().toISOString(),
            status: 'PENDING_REVIEW',
          },
        },
      },
    })

    res.json({
      success: true,
      message:
        'Komplain berhasil diajukan. Timer selesai otomatis ditangguhkan selama peninjauan admin.',
      order: updatedOrder,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Resolve an order dispute (Admin only)
 * POST /api/orders/:id/resolve-dispute
 */
export const resolveOrderDispute = async (req, res, next) => {
  try {
    const { id } = req.params
    const { decision, adminNotes } = req.body // ACCEPT_RETURN or REJECT_DISPUTE

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) return res.status(404).json({ error: 'Order not found' })
    const existingDetails =
      typeof order.paymentDetails === 'object' && order.paymentDetails !== null
        ? order.paymentDetails
        : {}

    const updatedOrder = await prisma.$transaction(async tx => {
      if (decision === 'ACCEPT_RETURN') {
        // Return product stock
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }

        return await tx.order.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : 'FAILED',
            paymentDetails: {
              ...existingDetails,
              disputeDetails: {
                ...(existingDetails.disputeDetails || {}),
                status: 'ACCEPTED_RETURN',
                adminNotes,
                resolvedAt: new Date().toISOString(),
              },
            },
          },
        })
      }

      // If rejected, restore dispute status
      return await tx.order.update({
        where: { id },
        data: {
          paymentDetails: {
            ...existingDetails,
            disputeDetails: {
              ...(existingDetails.disputeDetails || {}),
              status: 'REJECTED',
              adminNotes,
              resolvedAt: new Date().toISOString(),
            },
          },
        },
      })
    })

    res.json({
      success: true,
      message: `Komplain berhasil diselesaikan dengan keputusan: ${decision}`,
      order: updatedOrder,
    })
  } catch (error) {
    next(error)
  }
}
