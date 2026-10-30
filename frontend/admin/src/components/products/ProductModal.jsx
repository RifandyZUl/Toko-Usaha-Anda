/**
 * Product Modal Component
 * Form modal for creating/editing products with 1D & 2D Variants support
 */

import { useState, useEffect } from 'react'
import { X, Upload, Plus, Trash2, Sparkles, Layers } from 'lucide-react'
import { createProduct, updateProduct } from '../../services/products'
import ErrorMessage from '../common/ErrorMessage'
import { validateProduct } from '../../utils/validation'
import { generateSlug } from '../../utils/slug'
import { formatCurrencyInput, parseCurrency, formatCurrency } from '../../utils/format'
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
  const [showMatrixGenerator, setShowMatrixGenerator] = useState(false)

  // State for 2D Matrix Generator
  const [matrixDim1, setMatrixDim1] = useState({ name: 'Warna', values: 'Merah, Biru, Hitam' })
  const [matrixDim2, setMatrixDim2] = useState({ name: 'Ukuran', values: 'Kecil, Besar' })
  const [matrixDefaultPrice, setMatrixDefaultPrice] = useState('35000')
  const [matrixDefaultStock, setMatrixDefaultStock] = useState('15')

  // Reset slug manual edit flag when product changes
  useEffect(() => {
    setSlugManuallyEdited(false)
  }, [product])

  // Auto-select first category if empty when creating a product
  useEffect(() => {
    if (!product && !formData.categoryId && categories && categories.length > 0) {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id }))
    }
  }, [categories, product, formData.categoryId, setFormData])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape' && !saving) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, saving])

  // Toggle variant mode
  const handleToggleVariants = enabled => {
    if (enabled && (!formData.variants || formData.variants.length === 0)) {
      setFormData(prev => ({
        ...prev,
        hasVariants: true,
        variants: [
          {
            name: 'Kecil',
            price: prev.price || '25000',
            stock: prev.stock || '10',
            sku: '',
          },
          {
            name: 'Besar',
            price: prev.price ? (Number(prev.price) * 1.5).toString() : '40000',
            stock: prev.stock || '10',
            sku: '',
          },
        ],
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        hasVariants: enabled,
      }))
    }
  }

  // Add individual variant row
  const handleAddVariantRow = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        {
          name: '',
          price: prev.price || '0',
          stock: '10',
          sku: '',
        },
      ],
    }))
  }

  // Remove variant row
  const handleRemoveVariantRow = index => {
    setFormData(prev => {
      const nextVariants = (prev.variants || []).filter((_, idx) => idx !== index)
      return {
        ...prev,
        variants: nextVariants,
        hasVariants: nextVariants.length > 0,
      }
    })
  }

  // Update variant field
  const handleVariantChange = (index, field, value) => {
    setFormData(prev => {
      const nextVariants = [...(prev.variants || [])]
      nextVariants[index] = {
        ...nextVariants[index],
        [field]: value,
      }
      return {
        ...prev,
        variants: nextVariants,
      }
    })
  }

  // Quick Preset Handlers
  const applyPreset = presetType => {
    let newVariants = []
    if (presetType === 'pel') {
      newVariants = [
        { name: 'Kecil', price: '35000', stock: '20', sku: 'PEL-KCL' },
        { name: 'Sedang', price: '50000', stock: '15', sku: 'PEL-SDG' },
        { name: 'Besar', price: '75000', stock: '10', sku: 'PEL-BSR' },
      ]
    } else if (presetType === 'kunci') {
      newVariants = [
        { name: 'Kunci 8mm', price: '15000', stock: '25', sku: 'KNC-8' },
        { name: 'Kunci 10mm', price: '18000', stock: '20', sku: 'KNC-10' },
        { name: 'Kunci 12mm', price: '22000', stock: '15', sku: 'KNC-12' },
        { name: 'Kunci 14mm', price: '25000', stock: '10', sku: 'KNC-14' },
      ]
    } else if (presetType === 'ukuran') {
      newVariants = [
        { name: 'Ukuran S', price: '45000', stock: '15', sku: 'UKR-S' },
        { name: 'Ukuran M', price: '50000', stock: '20', sku: 'UKR-M' },
        { name: 'Ukuran L', price: '55000', stock: '20', sku: 'UKR-L' },
        { name: 'Ukuran XL', price: '60000', stock: '10', sku: 'UKR-XL' },
      ]
    }

    setFormData(prev => ({
      ...prev,
      hasVariants: true,
      variants: newVariants,
    }))
  }

  // Generate 2D Matrix Combinations
  const handleGenerateMatrix = () => {
    const list1 = matrixDim1.values.split(',').map(s => s.trim()).filter(Boolean)
    const list2 = matrixDim2.values.split(',').map(s => s.trim()).filter(Boolean)

    if (list1.length === 0 || list2.length === 0) {
      alert('Harap isi opsi nilai untuk kedua dimensi')
      return
    }

    const combinations = []
    for (const v1 of list1) {
      for (const v2 of list2) {
        combinations.push({
          name: `${v1} / ${v2}`,
          price: matrixDefaultPrice || '0',
          stock: matrixDefaultStock || '10',
          sku: `${v1.substring(0, 3).toUpperCase()}-${v2.substring(0, 3).toUpperCase()}`,
          attributes: {
            [matrixDim1.name.trim() || 'Dimensi 1']: v1,
            [matrixDim2.name.trim() || 'Dimensi 2']: v2,
          },
        })
      }
    }

    setFormData(prev => ({
      ...prev,
      hasVariants: true,
      variants: combinations,
    }))
    setShowMatrixGenerator(false)
  }

  /**
   * Handle form submission with validation
   */
  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)
    setFormErrors({})

    const validation = validateProduct(formData)
    if (!validation.isValid) {
      setFormErrors(validation.errors)
      return
    }

    setSaving(true)

    try {
      const isVariants = Boolean(formData.hasVariants && formData.variants && formData.variants.length > 0)
      const parsedVariants = isVariants
        ? formData.variants.map(v => ({
            id: v.id || undefined,
            name: String(v.name).trim(),
            sku: v.sku?.trim() || null,
            price: parseFloat(v.price) || 0,
            stock: parseInt(v.stock, 10) || 0,
            attributes: v.attributes || null,
          }))
        : []

      const calculatedPrice = isVariants
        ? Math.min(...parsedVariants.map(v => v.price))
        : parseFloat(formData.price)

      const calculatedStock = isVariants
        ? parsedVariants.reduce((sum, v) => sum + v.stock, 0)
        : (isNaN(parseInt(formData.stock, 10)) ? 0 : parseInt(formData.stock, 10))

      const productData = {
        name: formData.name.trim(),
        slug: formData.slug?.trim() || generateSlug(formData.name),
        description: formData.description?.trim() || null,
        price: calculatedPrice,
        stock: calculatedStock,
        categoryId: formData.categoryId,
        isActive: formData.isActive ?? true,
        image: (formData.images && formData.images.length > 0) ? formData.images[0] : (formData.image || null),
        images: (formData.images && formData.images.length > 0) ? formData.images : (formData.image ? [formData.image] : []),
        variants: isVariants ? parsedVariants : [],
      }

      logDebug('Submitting product data', { isEdit: !!product, productId: product?.id, isVariants })

      let result
      if (product) {
        result = await updateProduct(product.id, productData)
      } else {
        result = await createProduct(productData)
      }

      if (result.success) {
        logInfo('Product saved successfully')
        await onSave()
        setSlugManuallyEdited(false)
        onClose()
      } else {
        let errorMessage = result.error || 'Gagal menyimpan produk'
        if (result.errors && typeof result.errors === 'object') {
          setFormErrors(result.errors)
          errorMessage = Object.values(result.errors).join(', ') || errorMessage
        }
        logError('Product save failed', { errorMessage, result })
        setError(errorMessage)
      }
    } catch (err) {
      logError('Error saving product', err)
      setError(err.message || err.toString() || 'Terjadi kesalahan saat menyimpan produk')
    } finally {
      setSaving(false)
    }
  }

  // Summary stats for variants
  const variantTotalStock = (formData.variants || []).reduce(
    (sum, v) => sum + (parseInt(v.stock, 10) || 0),
    0
  )
  const variantPrices = (formData.variants || []).map(v => parseFloat(v.price) || 0).filter(p => p > 0)
  const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0
  const maxVariantPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-heading font-bold text-gray-900">
              {product ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Kelola informasi produk dan variasi ukuran/tipe</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

          {/* Nama Produk */}
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
                  slug: slugManuallyEdited ? formData.slug : generateSlug(newName),
                })
                if (formErrors.name) setFormErrors({ ...formErrors, name: '' })
              }}
              placeholder="Contoh: Alat Pel Lantai Microfiber Putar"
              className={`input ${formErrors.name ? 'border-red-500' : ''}`}
              required
            />
            {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug URL
              <span className="ml-2 text-xs text-gray-500 font-normal">(pengenal tautan)</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={formData.slug}
                onChange={e => {
                  setFormData({ ...formData, slug: e.target.value })
                  setSlugManuallyEdited(true)
                  if (formErrors.slug) setFormErrors({ ...formErrors, slug: '' })
                }}
                className={`input flex-1 ${formErrors.slug ? 'border-red-500' : ''}`}
                placeholder="alat-pel-lantai-microfiber"
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
          </div>

          {/* Kategori Resmi Toko */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Kategori Produk *
            </label>
            <select
              value={formData.categoryId}
              onChange={e => {
                setFormData({ ...formData, categoryId: e.target.value })
                if (formErrors.categoryId) setFormErrors({ ...formErrors, categoryId: '' })
              }}
              className={`input font-medium text-gray-900 ${formErrors.categoryId ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              required
            >
              <option value="">-- Pilih Salah Satu Kategori Resmi --</option>
              {categories.map(cat => {
                const icon = cat.slug === 'household' ? '🏠 ' : cat.slug === 'tools' ? '🛠️ ' : cat.slug === 'motorcycle' ? '🏍️ ' : '📦 '
                return (
                  <option key={cat.id} value={cat.id}>
                    {icon} {cat.name}
                  </option>
                )
              })}
            </select>
            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
              <span>ℹ️</span>
              <span>Wajib memilih salah satu dari 3 kategori resmi toko agar katalog di etalase pembeli tetap terstruktur dan konsisten.</span>
            </p>
            {formErrors.categoryId && (
              <p className="mt-1 text-sm text-red-600 font-medium">{formErrors.categoryId}</p>
            )}
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Produk</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="3"
              placeholder="Jelaskan spesifikasi, keunggulan, dan kelengkapan produk..."
            />
          </div>

          {/* SECTION: VARIAN PRODUK (SHOPEE / TOKOPEDIA STYLE) */}
          <div className="border border-blue-100 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-primary-100 text-primary-700 rounded-lg">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Varian Produk (Ukuran / Tipe / Jenis)</h3>
                  <p className="text-xs text-gray-500">
                    Aktifkan jika produk memiliki pilihan seperti Besar/Kecil atau Kunci 8/10/12 dengan harga & stok berbeda
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.hasVariants)}
                  onChange={e => handleToggleVariants(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {formData.hasVariants && (
              <div className="space-y-4 pt-2">
                {/* Presets and Generator Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-200/60">
                  <span className="text-xs font-semibold text-gray-600 flex items-center">
                    <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" /> Contoh Cepat:
                  </span>
                  <button
                    type="button"
                    onClick={() => applyPreset('pel')}
                    className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-primary-50 text-gray-700 hover:text-primary-700 border border-gray-200 rounded-md shadow-sm transition-colors"
                  >
                    Pel (Kecil, Sedang, Besar)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('kunci')}
                    className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-primary-50 text-gray-700 hover:text-primary-700 border border-gray-200 rounded-md shadow-sm transition-colors"
                  >
                    Kunci Pas (8, 10, 12, 14mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('ukuran')}
                    className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-primary-50 text-gray-700 hover:text-primary-700 border border-gray-200 rounded-md shadow-sm transition-colors"
                  >
                    Ukuran (S, M, L, XL)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMatrixGenerator(!showMatrixGenerator)}
                    className="px-2.5 py-1 text-xs font-medium bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md transition-colors ml-auto"
                  >
                    {showMatrixGenerator ? 'Tutup Generator 2D' : '+ Buat Matriks 2 Dimensi (Warna x Ukuran)'}
                  </button>
                </div>

                {/* 2D Matrix Generator Panel */}
                {showMatrixGenerator && (
                  <div className="bg-white border border-indigo-200 rounded-lg p-3.5 space-y-3 shadow-sm">
                    <p className="text-xs font-semibold text-indigo-900">
                      Generator Matriks Otomatis (Contoh: Warna x Ukuran)
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-gray-600 mb-1">Nama Dimensi 1</label>
                        <input
                          type="text"
                          value={matrixDim1.name}
                          onChange={e => setMatrixDim1({ ...matrixDim1, name: e.target.value })}
                          className="input py-1 text-xs"
                          placeholder="Warna"
                        />
                        <label className="block text-gray-600 mt-2 mb-1">Pilihan Nilai (pisahkan koma)</label>
                        <input
                          type="text"
                          value={matrixDim1.values}
                          onChange={e => setMatrixDim1({ ...matrixDim1, values: e.target.value })}
                          className="input py-1 text-xs"
                          placeholder="Merah, Biru, Hitam"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Nama Dimensi 2</label>
                        <input
                          type="text"
                          value={matrixDim2.name}
                          onChange={e => setMatrixDim2({ ...matrixDim2, name: e.target.value })}
                          className="input py-1 text-xs"
                          placeholder="Ukuran"
                        />
                        <label className="block text-gray-600 mt-2 mb-1">Pilihan Nilai (pisahkan koma)</label>
                        <input
                          type="text"
                          value={matrixDim2.values}
                          onChange={e => setMatrixDim2({ ...matrixDim2, values: e.target.value })}
                          className="input py-1 text-xs"
                          placeholder="Kecil, Besar"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-3 text-xs">
                        <div>
                          <span>Harga Default: Rp </span>
                          <input
                            type="number"
                            value={matrixDefaultPrice}
                            onChange={e => setMatrixDefaultPrice(e.target.value)}
                            className="w-24 px-2 py-0.5 border rounded"
                          />
                        </div>
                        <div>
                          <span>Stok Default: </span>
                          <input
                            type="number"
                            value={matrixDefaultStock}
                            onChange={e => setMatrixDefaultStock(e.target.value)}
                            className="w-16 px-2 py-0.5 border rounded"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateMatrix}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                      >
                        Generate Matriks Kombinasi
                      </button>
                    </div>
                  </div>
                )}

                {/* Variants Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-medium">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Nama Varian *</th>
                        <th className="py-2.5 px-3 text-left w-32">Harga (Rp) *</th>
                        <th className="py-2.5 px-3 text-left w-20">Stok *</th>
                        <th className="py-2.5 px-3 text-left w-24">Berat (g)</th>
                        <th className="py-2.5 px-3 text-left w-24">SKU</th>
                        <th className="py-2.5 px-2 text-center w-12">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(formData.variants || []).map((variant, index) => (
                        <tr key={variant.id || index} className="hover:bg-gray-50/60">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={variant.name}
                              onChange={e => handleVariantChange(index, 'name', e.target.value)}
                              placeholder="misal: Kecil / 8mm"
                              className="input py-1 text-sm"
                              required
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={variant.price}
                              onChange={e => handleVariantChange(index, 'price', e.target.value)}
                              placeholder="35000"
                              min="0"
                              className="input py-1 text-sm font-medium"
                              required
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={variant.stock}
                              onChange={e => handleVariantChange(index, 'stock', e.target.value)}
                              placeholder="10"
                              min="0"
                              className="input py-1 text-sm"
                              required
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={variant.weight || ''}
                              onChange={e => handleVariantChange(index, 'weight', e.target.value)}
                              placeholder="1000"
                              min="1"
                              className="input py-1 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={variant.sku || ''}
                              onChange={e => handleVariantChange(index, 'sku', e.target.value)}
                              placeholder="SKU-01"
                              className="input py-1 text-xs"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariantRow(index)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Hapus baris varian"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="inline-flex items-center text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Tambah Baris Varian
                    </button>
                    <div className="text-xs text-gray-500">
                      Total Stok: <strong className="text-gray-900">{variantTotalStock}</strong> unit • Rentang:{' '}
                      <strong className="text-gray-900">
                        {minVariantPrice === maxVariantPrice
                          ? formatCurrency(minVariantPrice)
                          : `${formatCurrency(minVariantPrice)} - ${formatCurrency(maxVariantPrice)}`}
                      </strong>
                    </div>
                  </div>
                </div>

                {formErrors.variants && (
                  <p className="text-sm text-red-600 font-medium">{formErrors.variants}</p>
                )}
              </div>
            )}
          </div>

          {/* HARGA & STOK UTAMA (Hanya tampil jika produk TIDAK punya varian) */}
          {!formData.hasVariants && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Harga Produk *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={formData.price ? formatCurrencyInput(formData.price.toString()) : ''}
                    onChange={e => {
                      const rawValue = e.target.value.replace(/[^\d,.-]/g, '')
                      const numericValue = parseCurrency(rawValue)
                      setFormData({
                        ...formData,
                        price: numericValue > 0 ? numericValue.toString() : '',
                      })
                      if (formErrors.price) setFormErrors({ ...formErrors, price: '' })
                    }}
                    placeholder="25.000"
                    className="input pl-10"
                    required={!formData.hasVariants}
                  />
                </div>
                {formErrors.price && <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stok Tersedia *</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={e => {
                    setFormData({ ...formData, stock: e.target.value })
                    if (formErrors.stock) setFormErrors({ ...formErrors, stock: '' })
                  }}
                  className={`input ${formErrors.stock ? 'border-red-500' : ''}`}
                  required={!formData.hasVariants}
                />
                {formErrors.stock && <p className="mt-1 text-sm text-red-600">{formErrors.stock}</p>}
              </div>
            </div>
          )}

          {/* Gambar Produk - Multi Image Gallery */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-sm font-bold text-gray-900">Galeri Foto Produk</label>
                <p className="text-xs text-gray-500">
                  Unggah beberapa foto sekaligus. Foto pertama akan menjadi foto sampul/utama.
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                {(formData.images || (formData.image ? [formData.image] : [])).length} Foto
              </span>
            </div>

            {/* Thumbnails Grid */}
            {((formData.images && formData.images.length > 0) || formData.image) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 my-3">
                {(formData.images && formData.images.length > 0
                  ? formData.images
                  : [formData.image]
                ).map((imgUrl, idx) => (
                  <div
                    key={`${imgUrl}-${idx}`}
                    className={`relative group rounded-lg overflow-hidden border-2 bg-white shadow-sm transition-all ${
                      idx === 0 ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-gray-200'
                    }`}
                  >
                    <div className="aspect-square w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img
                        src={imgUrl}
                        alt={`Produk ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={e => {
                          e.target.src = '/placeholder.jpg'
                        }}
                      />
                    </div>

                    {/* Badge Utama */}
                    {idx === 0 ? (
                      <span className="absolute top-1.5 left-1.5 bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                        Foto Utama
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const list = [...(formData.images || [])]
                          const [picked] = list.splice(idx, 1)
                          const next = [picked, ...list]
                          setFormData({ ...formData, images: next, image: next[0] })
                        }}
                        className="absolute top-1.5 left-1.5 bg-gray-900/80 hover:bg-primary-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Jadikan foto utama"
                      >
                        Set Utama
                      </button>
                    )}

                    {/* Tombol Hapus */}
                    <button
                      type="button"
                      onClick={() => onRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition-colors"
                      title="Hapus foto ini"
                      disabled={uploadingImage}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Buttons & Direct URL input */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <label className="flex items-center space-x-2 px-4 py-2 border border-primary-600 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg cursor-pointer transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                <Upload className="h-4 w-4" />
                <span>
                  {uploadingImage ? 'Mengupload...' : '+ Tambah / Unggah Foto (Bisa Banyak)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onImageChange}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>

              {uploadingImage && (
                <div className="text-xs text-primary-600 font-medium flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  Sedang mengunggah gambar...
                </div>
              )}
            </div>

            {/* Direct URL input */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Atau tempel URL gambar eksternal:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="direct-img-url"
                  placeholder="https://example.com/foto-produk.jpg"
                  className="input text-xs flex-1"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = e.target.value.trim()
                      if (val) {
                        const current = formData.images || (formData.image ? [formData.image] : [])
                        const next = [...current, val]
                        setFormData({ ...formData, images: next, image: next[0] })
                        e.target.value = ''
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('direct-img-url')
                    if (el && el.value.trim()) {
                      const val = el.value.trim()
                      const current = formData.images || (formData.image ? [formData.image] : [])
                      const next = [...current, val]
                      setFormData({ ...formData, images: next, image: next[0] })
                      el.value = ''
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                >
                  Tambah URL
                </button>
              </div>
            </div>
          </div>

          {/* Status Aktif */}
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 font-medium">
              Produk Aktif (Tampilkan di Katalog Pembeli)
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
