import { useState, useCallback, useEffect } from 'react'
import { getProducts, deleteProduct, getCategories } from '../services/products'
import { useToast } from './useToast'
import { logError } from '../utils/logger'

/**
 * Custom hook for managing products state and operations with server-side pagination
 * @param {Object} [params] - Query parameters
 * @param {number} [params.page=1] - Current page number
 * @param {number} [params.limit=10] - Items per page
 * @param {string} [params.search=''] - Search keyword
 * @param {string} [params.category=''] - Category ID or slug
 */
export function useProducts({ page = 1, limit = 10, search = '', category = '' } = {}) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { success, error: showError } = useToast()

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const queryParams = { page, limit }
      if (search) queryParams.search = search
      if (category) queryParams.category = category

      const result = await getProducts(queryParams)
      if (result.success) {
        setProducts(result.products || [])
        if (result.pagination) {
          setPagination(result.pagination)
        }
      } else {
        setError(result.error || 'Gagal mengambil data produk')
      }
    } catch (err) {
      logError('useProducts: fetchProducts error', err)
      setError('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, category])

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
        success('Produk berhasil dihapus')
        await fetchProducts()
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
  }, [success, showError, fetchProducts])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    products,
    categories,
    pagination,
    loading,
    error,
    setError,
    refresh: fetchProducts,
    removeProduct,
  }
}

