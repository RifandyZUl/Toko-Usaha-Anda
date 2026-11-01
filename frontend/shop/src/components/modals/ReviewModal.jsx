import { useState } from 'react'
import Icon from '@shared/components/Icon.jsx'
import { createOrderReview } from '../../services/orders'
import { formatImageUrl, handleImageError } from '../../utils/imageUtils'

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

  const [isSuccess, setIsSuccess] = useState(false)

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
      setIsSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1800)
    } else {
      setError(result.error || 'Gagal menyimpan ulasan')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 ring-1 ring-black/5 transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shadow-inner">
              <Icon name="Star" size={20} className="fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-semibold text-white tracking-wide">
                Beri Ulasan Produk
              </h3>
              <p className="text-[11px] text-gray-300 truncate max-w-[220px]">
                {product.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* In-Modal Success State */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <Icon name="Check" size={32} />
            </div>
            <div>
              <h4 className="text-base font-heading font-bold text-gray-900">
                Ulasan Berhasil Dikirim!
              </h4>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Terima kasih atas ulasan dan penilaian bintang {rating} yang Anda berikan untuk produk ini.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Menyimpan ulasan...
              </span>
            </div>
          </div>
        ) : (
          /* Content & Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <Icon name="AlertCircle" size={16} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Product Summary */}
            <div className="flex items-center gap-3.5 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
              {product.image && (
                <img
                  src={formatImageUrl(product.image)}
                  alt={product.name}
                  className="w-14 h-14 object-cover rounded-lg border border-gray-200 shrink-0 shadow-2xs"
                  onError={e => handleImageError(e, product, '/placeholder.jpg')}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Bagikan pengalaman nyata Anda memakai produk ini</p>
              </div>
            </div>

            {/* Modern Star Selection */}
            <div className="text-center py-3 bg-gradient-to-b from-amber-50/40 to-transparent rounded-2xl border border-amber-100/60 p-4 space-y-2">
              <span className="text-xs font-semibold text-gray-800 uppercase tracking-wider block">
                Tingkat Kepuasan Anda
              </span>
              <div className="flex items-center justify-center gap-2.5 py-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform duration-150 hover:scale-125 focus:outline-none"
                      aria-label={`Beri nilai ${star} bintang`}
                    >
                      <Icon
                        name="Star"
                        size={32}
                        className={`transition-colors drop-shadow-xs ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_2px_4px_rgba(251,191,36,0.4)]'
                            : 'text-gray-200 fill-gray-100'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
              <div className="inline-block px-3 py-1 bg-white border border-amber-200 rounded-full shadow-2xs">
                <p className="text-xs font-bold text-amber-800">
                  {rating === 5 && '⭐⭐⭐⭐⭐ Sangat Memuaskan'}
                  {rating === 4 && '⭐⭐⭐⭐ Bagus / Sesuai'}
                  {rating === 3 && '⭐⭐⭐ Cukup'}
                  {rating === 2 && '⭐⭐ Kurang Memuaskan'}
                  {rating === 1 && '⭐ Kecewa'}
                </p>
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wider">
                Ulasan & Catatan Pengalaman:
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ceritakan kepuasan mengenai kualitas bahan, kerapihan jahitan/kemasan, dan kecepatan pengiriman..."
                className="w-full text-xs p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none resize-none bg-gray-50/50 focus:bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold text-white bg-gray-900 hover:bg-black disabled:opacity-50 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
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
        )}
      </div>
    </div>
  )
}
