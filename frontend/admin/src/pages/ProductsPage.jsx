/**
 * Products Page
 * Manages product CRUD operations with validation and error handling
 */

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import {
  getProducts,
  deleteProduct,
  getCategories,
  createProduct,
  updateProduct,
} from '../services/products'
import { uploadImage } from '../services/upload'
import ErrorMessage from '../components/common/ErrorMessage'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { TableSkeleton, Skeleton } from '../components/common/Skeleton'
import { formatCurrency, getMediaUrl } from '../utils/format'
import { generateSlug } from '../utils/slug'
import { ToastContainer } from '../components/common/Toast'
import { useToast } from '../hooks/useToast'
import Pagination from '../components/common/Pagination'
import ProductModal from '../components/products/ProductModal'
import SearchBar from '../components/common/SearchBar'
import FilterSelect from '../components/common/FilterSelect'
import { usePagination, useSearchFilter, useConfirmDialog, useProducts } from '../hooks'
import { executeApiCall, createErrorHandler } from '../utils/apiHelpers'
import { logError, logDebug } from '../utils/logger'

export default function ProductsPage() {
  const { products, categories, loading, error, refresh, removeProduct } = useProducts()
  
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [itemsPerPage] = useState(10)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    stock: '',
    image: '',
    categoryId: '',
    isActive: true,
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const { toasts, removeToast, success } = useToast()

  // Search and filter hooks
  const { searchTerm, filters, setSearch, setFilter, clearFilters } = useSearchFilter({
    onFilterChange: () => pagination.resetPage(),
  })
  const selectedCategory = filters.category || ''

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !selectedCategory || product.categoryId === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  const pagination = usePagination(itemsPerPage, filteredProducts.length)
  const deleteDialog = useConfirmDialog()

  /**
   * Open delete confirmation dialog
   */
  const handleDeleteClick = useCallback((id, name) => {
    deleteDialog.openDialog({
      title: 'Hapus Produk',
      message: `Apakah Anda yakin ingin menghapus produk "${name}"?`,
      onConfirm: async () => {
        const ok = await removeProduct(id)
        if (ok) deleteDialog.closeDialog()
      },
    })
  }, [deleteDialog, removeProduct])

  const handleEdit = product => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      slug: product.slug || generateSlug(product.name || ''),
      description: product.description || '',
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '',
      image: product.image || '',
      categoryId: product.categoryId || '',
      isActive: product.isActive ?? true,
    })
    setError(null)
    setImageFile(null)
    setImagePreview(product.image || null)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      stock: '',
      image: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
      isActive: true,
    })
    setError(null)
    setImageFile(null)
    setImagePreview(null)
    setShowModal(true)
  }

  /**
   * Handle image file selection
   * @param {React.ChangeEvent<HTMLInputElement>} e - File input event
   */
  const handleImageChange = async e => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diizinkan')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB')
      return
    }

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Upload image
    setUploadingImage(true)
    const result = await uploadImage(file)
    setUploadingImage(false)

    if (result.success) {
      // URL sudah full URL dari Supabase atau sudah di-handle di upload service
      setFormData({ ...formData, image: result.url })
    } else {
      alert(result.error || 'Gagal mengupload gambar')
      setImageFile(null)
      setImagePreview(null)
    }
  }

  /**
   * Remove selected image
   */
  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData({ ...formData, image: '' })
  }



  // Reset to page 1 when search or filter changes
  useEffect(() => {
    pagination.resetPage()
  }, [searchTerm, selectedCategory, pagination])

  // Paginate filtered products
  const paginatedProducts = useMemo(() => {
    const start = pagination.startIndex
    const end = pagination.endIndex
    return filteredProducts.slice(start, end)
  }, [filteredProducts, pagination.startIndex, pagination.endIndex])

  // Category options for filter
  const categoryOptions = useMemo(() => {
    return categories.map(cat => ({
      value: cat.id,
      label: cat.name,
    }))
  }, [categories])

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <TableSkeleton rows={8} columns={6} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Kelola Produk</h1>
          <p className="text-sm text-gray-600">Tambah, edit, atau hapus produk</p>
        </div>
        <button
          onClick={handleAdd}
          className="btn btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
        >
          <Plus className="h-5 w-5" />
          <span>Tambah Produk</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Filters */}
      <div className="card mb-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SearchBar
            value={searchTerm}
            onChange={setSearch}
            placeholder="Cari produk..."
          />
          <FilterSelect
            value={selectedCategory}
            onChange={value => setFilter('category', value)}
            options={categoryOptions}
            placeholder="Semua Kategori"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Produk</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Kategori</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Harga</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Stok</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12">
                  <div className="flex flex-col items-center justify-center">
                    <Package className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm || selectedCategory
                        ? 'Tidak ada produk ditemukan'
                        : 'Belum ada produk'}
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                      {searchTerm || selectedCategory
                        ? 'Coba ubah filter atau kata kunci pencarian Anda'
                        : 'Mulai dengan menambahkan produk pertama Anda ke toko'}
                    </p>
                    {!searchTerm && !selectedCategory && (
                      <button
                        onClick={handleAdd}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Tambah Produk Pertama</span>
                      </button>
                    )}
                    {(searchTerm || selectedCategory) && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedProducts.map(product => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      {product.image && (
                        <img
                          src={getMediaUrl(product.imageUrl || product.image)}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                          crossOrigin="anonymous"
                          onError={e => {
                            logError('Admin - Image load error for product', {
                              productId: product.id,
                              imageUrl: product.imageUrl,
                              image: product.image,
                            })
                            // Only fallback to placeholder if it's not already the placeholder
                            if (!e.target.src.includes('placeholder')) {
                              e.target.src = '/placeholder.jpg'
                            }
                          }}
                          onLoad={() => {
                            logDebug('Admin - Image loaded successfully', { productId: product.id })
                          }}
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{product.category?.name || '-'}</td>
                  <td className="py-4 px-4 text-gray-900 font-medium">
                    {formatCurrency(Number(product.price))}
                  </td>
                  <td className="py-4 px-4 text-gray-600">{product.stock}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {product.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product.id, product.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredProducts.length > itemsPerPage && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={Math.ceil(filteredProducts.length / itemsPerPage)}
            itemsPerPage={itemsPerPage}
            totalItems={filteredProducts.length}
            onPageChange={page => {
              pagination.goToPage(page)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.dialog.isOpen}
        onClose={deleteDialog.closeDialog}
        onConfirm={deleteDialog.handleConfirm}
        title={deleteDialog.dialog.title}
        message={deleteDialog.dialog.message}
        confirmText={deleteDialog.dialog.confirmText}
        cancelText={deleteDialog.dialog.cancelText}
        variant="danger"
        isLoading={deleteDialog.dialog.isLoading}
      />

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          imagePreview={imagePreview}
          imageFile={imageFile}
          uploadingImage={uploadingImage}
          onImageChange={handleImageChange}
          onRemoveImage={handleRemoveImage}
          onClose={() => {
            setShowModal(false)
            setImageFile(null)
            setImagePreview(null)
          }}
          onSave={async () => {
            await refresh()
            success(editingProduct ? 'Produk berhasil diupdate' : 'Produk berhasil ditambahkan')
          }}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
