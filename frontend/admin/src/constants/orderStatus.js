/**
 * Order Status Constants
 * Centralized order status definitions
 */

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
}

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.PROCESSING]: 'Diproses',
  [ORDER_STATUS.SHIPPED]: 'Dikirim',
  [ORDER_STATUS.DELIVERED]: 'Selesai',
  [ORDER_STATUS.CANCELLED]: 'Dibatalkan',
}

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'bg-yellow-100 text-yellow-700',
  [ORDER_STATUS.PROCESSING]: 'bg-blue-100 text-blue-700',
  [ORDER_STATUS.SHIPPED]: 'bg-purple-100 text-purple-700',
  [ORDER_STATUS.DELIVERED]: 'bg-green-100 text-green-700',
  [ORDER_STATUS.CANCELLED]: 'bg-red-100 text-red-700',
}

export const ORDER_STATUS_OPTIONS = Object.values(ORDER_STATUS)

