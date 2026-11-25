/**
 * Order Stock Service
 * Stock restoration that must happen exactly once per order, even under concurrent requests.
 */

import prisma from '../config/database.js'
import { ConflictError } from '../utils/errors.js'

/**
 * Write to an order only if nobody changed it since it was read (same updatedAt).
 * paymentDetails is one JSON column shared by shipping, dispute, review and payment data, and every
 * writer merges into the copy it read; without this check a parallel write silently erases the other.
 * @returns {Promise<boolean>} false when the order changed meanwhile (caller re-reads or answers 409)
 */
export async function updateOrderIfUnchanged(order, data, db = prisma) {
  const { count } = await db.order.updateMany({ where: { id: order.id, updatedAt: order.updatedAt }, data })
  return count === 1
}

/**
 * Inside a transaction: update the order only if it is unchanged since it was read (status and updatedAt).
 * The conditional UPDATE locks the row, so a concurrent request blocks, then matches 0 rows.
 * Throws ConflictError (409) when someone else changed the order first.
 */
export async function updateOrderIfStatus(tx, order, data) {
  const { count } = await tx.order.updateMany({
    where: { id: order.id, status: order.status, updatedAt: order.updatedAt },
    data,
  })
  if (count === 0) {
    throw new ConflictError('Status pesanan baru saja berubah. Silakan muat ulang halaman.')
  }
}

/**
 * Return each item's quantity to its variant (if any) and product.
 * updateMany never throws when a product/variant was deleted by admin.
 */
export async function restockItems(tx, items) {
  for (const item of items) {
    if (item.variantId) {
      await tx.productVariant.updateMany({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      })
    }
    await tx.product.updateMany({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    })
  }
}

/**
 * Atomically move a PENDING, unpaid order to CANCELLED and restock it.
 * The status change is a conditional update, so of several concurrent callers
 * (user cancel, expiry cron, Midtrans webhook) only one wins and restocks.
 * @returns {Promise<boolean>} true if this call cancelled the order
 */
export async function cancelPendingOrderAndRestock(orderId, items, paymentStatus = 'FAILED') {
  return prisma.$transaction(async tx => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: 'PENDING', paymentStatus: { not: 'PAID' } },
      data: { status: 'CANCELLED', paymentStatus },
    })
    if (count === 0) return false
    await restockItems(tx, items)
    return true
  })
}
