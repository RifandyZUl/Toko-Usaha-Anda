import { useState } from 'react'
import Icon from '@shared/components/Icon.jsx'
import { createOrderReview } from '../../services/orders'

/**
 * ReviewModal Component
 * Interactive modal for star rating (1-5) and text review for purchased products
 */
export default function ReviewModal({ orderId, product, onClose, onSuccess }) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!orderId || !product) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const result = await createOrderReview(orderId, {
      productId: product.id,
      rating,
      comment: comment.trim(),
    })

    if (result.success) {
      alert('Ulasan Anda berhasil dikirimkan! Terima kasih atas feedback Anda.')
      onSuccess?.()
      onClose()
    } else {
      setError(result.error || 'Gagal menyimpan ulasan')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between bg-primary-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
              <Icon name="Star" size={18} className="fill-primary-500" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-semibold text-gray-900">
                Beri Ulasan Produk
              </h3>
              <p className="text-[11px] text-gray-500 truncate max-w-[220px]">
                {product.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200/50 transition-colors"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
              {error}
            </div>
          )}

          {/* Product Summary */}
          <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="w-12 h-12 object-cover rounded border border-gray-200 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate">{product.name}</p>
              <p className="text-[11px] text-gray-500">Bagaimana kualitas barang yang Anda terima?</p>
            </div>
          </div>

          {/* Star Selection */}
          <div className="text-center py-2 space-y-1.5">
            <span className="text-xs font-medium text-gray-700">Pilih Penilaian Bintang:</span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Icon
                      name="Star"
                      size={28}
                      className={`transition-colors ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
            <p className="text-xs font-semibold text-primary-700">
              {rating === 5 && '⭐⭐⭐⭐⭐ Sangat Memuaskan'}
              {rating === 4 && '⭐⭐⭐⭐ Bagus / Sesuai'}
              {rating === 3 && '⭐⭐⭐ Cukup'}
              {rating === 2 && '⭐⭐ Kurang Memuaskan'}
              {rating === 1 && '⭐ Kecewa'}
            </p>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Ulasan Anda (Opsional):
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan kepuasan Anda mengenai kualitas barang, kesesuaian dengan foto, dan kerapihan pengemasan..."
              className="w-full text-xs p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Icon name="Loader2" size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Icon name="Check" size={14} />
                  <span>Kirim Ulasan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
