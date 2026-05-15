import { useState, useCallback, useEffect, useMemo } from 'react'
import { getProducts, deleteProduct, getCategories } from '../services/products'
import { useToast } from './useToast'
import { logError } from '../utils/logger'

/**
 * Custom hook for managing products state and operations
 */
export function useProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { success, error: showError } = useToast()

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getProducts({ limit: 1000 })
      if (result.success) {
        setProducts(result.products || [])
      } else {
        setError(result.error || 'Gagal mengambil data produk')
      }
    } catch (err) {
      logError('useProducts: fetchProducts error', err)
      setError('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const result = await getCategories()
      if (result.success) {
        setCategories(result.categories || [])
      }
    } catch (err) {
      logError('useProducts: fetchCategories error', err)
    }
  }, [])

  const removeProduct = useCallback(async (id) => {
    try {
      const result = await deleteProduct(id)
      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== id))
        success('Produk berhasil dihapus')
        return true
      } else {
        showError(result.error || 'Gagal menghapus produk')
        return false
      }
    } catch (err) {
      logError('useProducts: removeProduct error', err)
      showError('Gagal menghapus produk')
      return false
    }
  }, [success, showError])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  return {
    products,
    categories,
    loading,
    error,
    refresh: fetchProducts,
    removeProduct
  }
}
