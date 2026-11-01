import { useState } from 'react'
import Icon from '@shared/components/Icon.jsx'
import { createOrderDispute } from '../../services/orders'

const DISPUTE_REASONS = [
  'Barang Rusak / Cacat Fisik',
  'Barang Kurang / Tidak Lengkap',
  'Produk Tidak Sesuai Deskripsi / Salah Kirim',
  'Kemasan Rusak Parah & Isi Hilang',
  'Paket Belum Diterima tapi Tertanda Selesai',
]

const SOLUTION_OPTIONS = [
  'Penggantian / Pengiriman Ulang Barang',
  'Pengembalian Dana (Refund)',
  'Kirim Kekurangan Barang',
]

/**
 * DisputeModal Component
 * Official complaint & return request dialog
 */
export default function DisputeModal({ order, onClose, onSuccess }) {
  const [reason, setReason] = useState(DISPUTE_REASONS[0])
  const [description, setDescription] = useState('')
  const [solutionExpected, setSolutionExpected] = useState(SOLUTION_OPTIONS[0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [isSuccess, setIsSuccess] = useState(false)

  if (!order) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim() || description.trim().length < 10) {
      setError('Harap jelaskan kendala barang secara rinci (minimal 10 karakter)')
      return
    }

    setSubmitting(true)
    setError(null)
    const result = await createOrderDispute(order.id, {
      reason,
      description: description.trim(),
      solutionExpected,
    })

    if (result.success) {
      setIsSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } else {
      setError(result.error || 'Gagal mengajukan komplain')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 ring-1 ring-black/5 transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <Icon name="AlertTriangle" size={20} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-semibold text-white tracking-wide">
                Pusat Resolusi / Ajukan Komplain
              </h3>
              <p className="text-[11px] text-gray-300 font-mono mt-0.5">
                Order #{order.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Tutup komplain"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* In-Modal Success State */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <Icon name="CheckCircle" size={32} />
            </div>
            <div>
              <h4 className="text-base font-heading font-bold text-gray-900">
                Komplain Resmi Berhasil Diajukan!
              </h4>
              <p className="text-xs text-gray-600 mt-2 max-w-sm mx-auto leading-relaxed">
                Status penyelesaian otomatis (2 hari) telah ditangguhkan. Tim admin kami akan segera meninjau detail dan menghubungi Anda via WhatsApp.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Memperbarui status pesanan...
              </span>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            <div className="p-4 bg-gradient-to-br from-amber-50/70 to-orange-50/40 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1.5 shadow-2xs">
              <p className="font-bold flex items-center gap-2 text-amber-800">
                <Icon name="Shield" size={15} className="text-amber-600" />
                <span>Garansi Perlindungan Konsumen:</span>
              </p>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                Pengajuan komplain ini akan <strong>menangguhkan batas waktu otomatis selesai (2 hari)</strong> sampai admin memeriksa bukti kendala dan memberikan solusi terbaik bagi Anda.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <Icon name="AlertCircle" size={16} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wider">
                Kategori Kendala:
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all outline-none"
              >
                {DISPUTE_REASONS.map((r, idx) => (
                  <option key={idx} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wider">
                Solusi yang Diharapkan:
              </label>
              <select
                value={solutionExpected}
                onChange={(e) => setSolutionExpected(e.target.value)}
                className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all outline-none"
              >
                {SOLUTION_OPTIONS.map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wider">
                Deskripsi Kendala & Catatan:
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan secara detail kondisi barang saat diterima, foto/video unboxing, atau kekurangan barang..."
                className="w-full text-xs p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none resize-none bg-gray-50/50 focus:bg-white"
              />
            </div>

            {/* Footer buttons */}
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
                className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Icon name="Loader2" size={14} className="animate-spin" />
                    <span>Mengirimkan...</span>
                  </>
                ) : (
                  <>
                    <Icon name="Send" size={14} />
                    <span>Kirim Pengajuan Komplain</span>
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
