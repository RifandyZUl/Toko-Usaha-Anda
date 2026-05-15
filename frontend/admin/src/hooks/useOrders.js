import { useState, useCallback, useEffect } from 'react'
import { getAllOrders, updateOrderStatus } from '../services/orders'
import { useToast } from './useToast'
import { logError } from '../utils/logger'

/**
 * Custom hook for managing orders state and operations
 */
export function useOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { success, error: showError } = useToast()

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getAllOrders()
      if (result.success) {
        setOrders(result.orders || [])
      } else {
        setError(result.error || 'Gagal mengambil data pesanan')
      }
    } catch (err) {
      logError('useOrders: fetchOrders error', err)
      setError('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateStatus = useCallback(async (orderId, newStatus) => {
    try {
      const result = await updateOrderStatus(orderId, newStatus)
      if (result.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? result.order : o))
        success(`Status pesanan berhasil diupdate`)
        return result.order
      } else {
        showError(result.error || 'Gagal memperbarui status')
        return null
      }
    } catch (err) {
      logError('useOrders: updateStatus error', err)
      showError('Gagal memperbarui status')
      return null
    }
  }, [success, showError])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    loading,
    error,
    refresh: fetchOrders,
    updateStatus
  }
}
