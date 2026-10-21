import { useState } from 'react'
import Icon from '@shared/components/Icon.jsx'
import { createOrderDispute } from '../services/orders'

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
      alert('Komplain resmi berhasil diajukan. Status penyelesaian otomatis 2 hari telah ditangguhkan selama peninjauan admin.')
      onSuccess?.()
      onClose()
    } else {
      setError(result.error || 'Gagal mengajukan komplain')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between bg-amber-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Icon name="AlertTriangle" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-heading font-semibold text-gray-900">
                Pusat Resolusi / Ajukan Komplain
              </h3>
              <p className="text-[11px] text-gray-500 font-mono">
                Order #{order.id.slice(-8).toUpperCase()}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 md:p-5 overflow-y-auto space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Icon name="Clock" size={14} className="text-amber-600" />
              <span>Perlindungan Konsumen:</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Pengajuan komplain ini akan <strong>menangguhkan batas waktu otomatis selesai (2 hari)</strong> sampai admin toko memeriksa bukti dan memberikan solusi terbaik bagi Anda.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Kategori Kendala:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {DISPUTE_REASONS.map((r, idx) => (
                <option key={idx} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Solusi yang Diharapkan:
            </label>
            <select
              value={solutionExpected}
              onChange={(e) => setSolutionExpected(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {SOLUTION_OPTIONS.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Deskripsi Kendala & Catatan:
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kondisi barang saat diterima, kekurangan barang, atau foto video unboxing..."
              className="w-full text-xs p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Footer buttons */}
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
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
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
      </div>
    </div>
  )
}
