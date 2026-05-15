/**
 * Product Modal Component
 * Form modal for creating/editing products
 */

import { useState, useEffect } from 'react'
import { X, Upload } from 'lucide-react'
import { createProduct, updateProduct } from '../../services/products'
import ErrorMessage from '../common/ErrorMessage'
import { validateProduct } from '../../utils/validation'
import { generateSlug } from '../../utils/slug'
import { formatCurrencyInput, parseCurrency, getMediaUrl } from '../../utils/format'
import { logInfo, logError, logDebug } from '../../utils/logger'

export default function ProductModal({
  product,
  formData,
  setFormData,
  categories,
  imagePreview,
  imageFile,
  uploadingImage,
  onImageChange,
  onRemoveImage,
  onClose,
  onSave,
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [localImagePreview, setLocalImagePreview] = useState(imagePreview)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  // Reset slug manual edit flag when product changes
  useEffect(() => {
    setSlugManuallyEdited(false)
  }, [product])

  // Keyboard shortcuts: ESC to close, Enter to submit (when form is valid)
  useEffect(() => {
    const handleKeyDown = e => {
      // ESC to close modal (only if not saving)
      if (e.key === 'Escape' && !saving) {
        onClose()
      }
      // Enter to submit form (only if not in textarea and not saving)
      if (e.key === 'Enter' && e.ctrlKey && !saving && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault()
        const form = e.target.closest('form')
        if (form) {
          const submitButton = form.querySelector('button[type="submit"]')
          if (submitButton && !submitButton.disabled) {
            submitButton.click()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, saving])

  /**
   * Handle form submission with validation
   * @param {React.FormEvent} e - Form event
   */
  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)
    setFormErrors({})

    // Validate form data
    const validation = validateProduct(formData)
    if (!validation.isValid) {
      setFormErrors(validation.errors)
      return
    }

    setSaving(true)

    try {
      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description?.trim() || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        categoryId: formData.categoryId,
        isActive: formData.isActive ?? true,
        // Set both image (single) and images (array) for compatibility
        image: formData.image || null,
        images: formData.image ? [formData.image] : [],
      }

      logDebug('Submitting product data', { isEdit: !!product, productId: product?.id })

      let result
      if (product) {
        result = await updateProduct(product.id, productData)
      } else {
        result = await createProduct(productData)
      }

      if (result.success) {
        logInfo('Product saved successfully')
        await onSave()
        setSlugManuallyEdited(false) // Reset flag on success
        onClose()
        // Show success message - will be handled by parent component
      } else {
        // Handle different error formats from backend
        let errorMessage = result.error || 'Gagal menyimpan produk'

        // If there are field-specific errors, set them
        if (result.errors && typeof result.errors === 'object') {
          setFormErrors(result.errors)
          // Also set general error message
          errorMessage = Object.values(result.errors).join(', ') || errorMessage
        }

        logError('Product save failed', { errorMessage, result })
        setError(errorMessage)
      }
    } catch (error) {
      logError('Error saving product', error)
      const errorMessage =
        error.message || error.toString() || 'Terjadi kesalahan saat menyimpan produk'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-gray-900">
            {product ? 'Edit Produk' : 'Tambah Produk'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Produk *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => {
                const newName = e.target.value
                setFormData({
                  ...formData,
                  name: newName,
                  // Auto-generate slug if not manually edited
                  slug: slugManuallyEdited ? formData.slug : generateSlug(newName),
                })
                if (formErrors.name) {
                  setFormErrors({ ...formErrors, name: '' })
                }
              }}
              className={`input ${formErrors.name ? 'border-red-500' : ''}`}
              required
            />
            {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
              <span className="ml-2 text-xs text-gray-500 font-normal">
                (URL-friendly identifier)
              </span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={formData.slug}
                onChange={e => {
                  setFormData({ ...formData, slug: e.target.value })
                  setSlugManuallyEdited(true)
                  if (formErrors.slug) {
                    setFormErrors({ ...formErrors, slug: '' })
                  }
                }}
                className={`input flex-1 ${formErrors.slug ? 'border-red-500' : ''}`}
                placeholder="sapu-lantai-premium"
                required
              />
              <button
                type="button"
                onClick={() => {
                  const newSlug = generateSlug(formData.name)
                  setFormData({ ...formData, slug: newSlug })
                  setSlugManuallyEdited(false)
                }}
                className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Generate slug dari nama produk"
              >
                Auto
              </button>
            </div>
            {formErrors.slug && <p className="mt-1 text-sm text-red-600">{formErrors.slug}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Format: huruf kecil, angka, dan tanda hubung (-). Contoh: sapu-lantai-premium
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="3"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Harga *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  Rp
                </span>
                <input
                  type="text"
                  value={formData.price ? formatCurrencyInput(formData.price.toString()) : ''}
                  onChange={e => {
                    const rawValue = e.target.value.replace(/[^\d,.-]/g, '')
                    // Store the numeric value (without formatting)
                    const numericValue = parseCurrency(rawValue)
                    setFormData({
                      ...formData,
                      price: numericValue > 0 ? numericValue.toString() : '',
                    })
                    if (formErrors.price) {
                      setFormErrors({ ...formErrors, price: '' })
                    }
                  }}
                  onBlur={e => {
                    // Ensure value is properly formatted on blur
                    const numericValue = parseCurrency(e.target.value)
                    if (numericValue > 0) {
                      setFormData({ ...formData, price: numericValue.toString() })
                    }
                  }}
                  placeholder="20.000"
                  className="input pl-10"
                  required
                />
              </div>
              {formErrors.price && <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>}
              <p className="mt-1 text-xs text-gray-500">Contoh: 20000 atau 20.000</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stok *</label>
              <input
                type="number"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori *</label>
            <select
              value={formData.categoryId}
              onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
              className="input"
              required
            >
              <option value="">Pilih Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Produk</label>

            {/* Image Preview */}
            {(imagePreview || localImagePreview) && (
              <div className="mb-4 relative inline-block">
                <img
                  src={imagePreview || localImagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={onRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  disabled={uploadingImage}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* File Input */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Upload className="h-4 w-4" />
                <span className="text-sm">
                  {uploadingImage ? 'Mengupload...' : imageFile ? 'Ganti Gambar' : 'Pilih Gambar'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
              {uploadingImage && <div className="text-sm text-gray-500">Mengupload gambar...</div>}
            </div>

            {/* URL Input (Fallback) */}
            <div className="mt-4">
              <label className="block text-xs text-gray-500 mb-1">Atau masukkan URL gambar:</label>
              <input
                type="url"
                value={formData.image}
                onChange={e => {
                  setFormData({ ...formData, image: e.target.value })
                  if (e.target.value) {
                    setLocalImagePreview(e.target.value)
                  }
                }}
                className="input text-sm"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <p className="mt-2 text-xs text-gray-500">Format: JPG, PNG, GIF, WebP. Maksimal 5MB</p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Produk Aktif
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

