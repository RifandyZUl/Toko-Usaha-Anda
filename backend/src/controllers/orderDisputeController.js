import prisma from '../config/database.js'
import { restockItems, updateOrderIfStatus, updateOrderIfUnchanged } from '../services/orderStockService.js'

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

    // Conditional write: if auto-complete or another writer changed the order since we read it, answer 409
    // instead of silently erasing their data (or having ours erased)
    const written = await updateOrderIfUnchanged(order, {
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
    })
    if (!written) {
      return res.status(409).json({ error: 'Pesanan baru saja diperbarui. Silakan muat ulang halaman dan coba lagi.' })
    }
    const updatedOrder = await prisma.order.findUnique({ where: { id } })

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
    if (decision === 'ACCEPT_RETURN' && order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Pesanan sudah berstatus dibatalkan' })
    }
    const existingDetails =
      typeof order.paymentDetails === 'object' && order.paymentDetails !== null
        ? order.paymentDetails
        : {}

    const updatedOrder = await prisma.$transaction(async tx => {
      if (decision === 'ACCEPT_RETURN') {
        // Cancel only if the order is unchanged since we read it, so a double submit cannot restock twice
        await updateOrderIfStatus(tx, order, {
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
        })
        await restockItems(tx, order.items)
        return tx.order.findUnique({ where: { id } })
      }

      // If rejected, restore dispute status (same unchanged-since-read guard as the accept path)
      await updateOrderIfStatus(tx, order, {
        paymentDetails: {
          ...existingDetails,
          disputeDetails: {
            ...(existingDetails.disputeDetails || {}),
            status: 'REJECTED',
            adminNotes,
            resolvedAt: new Date().toISOString(),
          },
        },
      })
      return tx.order.findUnique({ where: { id } })
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
