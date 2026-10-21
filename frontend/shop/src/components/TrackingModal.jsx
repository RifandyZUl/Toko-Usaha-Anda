import { useState, useEffect, useCallback } from 'react'
import Icon from '@shared/components/Icon.jsx'
import { getOrderTracking } from '../services/orders'
import { formatDateTime } from '../utils/format'

/**
 * TrackingModal Component
 * Interactive modal showing live courier checkpoint tracking & waybill info
 */
export default function TrackingModal({ orderId, onClose }) {
  const [tracking, setTracking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchTracking = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    const result = await getOrderTracking(orderId)
    if (result.success && result.tracking) {
      setTracking(result.tracking)
    } else {
      setError(result.error || 'Gagal memuat informasi pelacakan')
    }
    setLoading(false)
  }, [orderId])

  useEffect(() => {
    fetchTracking()
  }, [fetchTracking])

  const handleCopyResi = (waybill) => {
    if (!waybill) return
    navigator.clipboard.writeText(waybill)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!orderId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <Icon name="Truck" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-heading font-semibold text-gray-900">
                Lacak Pengiriman
              </h3>
              <p className="text-[11px] text-gray-500 font-mono">
                Order #{orderId.slice(-8).toUpperCase()}
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

        {/* Modal Content */}
        <div className="p-4 md:p-5 overflow-y-auto flex-1 space-y-4">
          {loading && !tracking ? (
            <div className="py-16 text-center text-gray-500 space-y-3">
              <Icon name="Loader2" size={32} className="animate-spin text-primary-600 mx-auto" />
              <p className="text-xs">Menghubungi server kurir dan memuat posisi paket...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-3">
              <Icon name="AlertCircle" size={36} className="text-red-500 mx-auto" />
              <p className="text-xs text-red-600">{error}</p>
              <button
                type="button"
                onClick={fetchTracking}
                className="text-xs text-primary-600 hover:underline font-semibold"
              >
                Coba Lagi
              </button>
            </div>
          ) : tracking ? (
            <>
              {/* Waybill / Resi Card */}
              <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                    Nomor Resi ({tracking.courier})
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-primary-100 text-primary-800">
                    {tracking.statusLabel || tracking.status}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-200">
                  <span className="font-mono text-xs md:text-sm font-bold text-gray-900 select-all">
                    {tracking.waybillNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyResi(tracking.waybillNumber)}
                    className="text-[11px] text-primary-700 hover:text-primary-900 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Icon name={copied ? 'CheckCircle' : 'Share2'} size={12} />
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1">
                  <span>Layanan: <strong className="text-gray-900">{tracking.service}</strong></span>
                  <span>Tujuan: <strong className="text-gray-900">{tracking.destination}</strong></span>
                </div>
              </div>

              {/* Real-time Tracking Timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider">
                    Riwayat Pergerakan Kurir
                  </h4>
                  <button
                    type="button"
                    onClick={fetchTracking}
                    disabled={loading}
                    className="text-[11px] text-primary-600 hover:text-primary-800 flex items-center gap-1 font-medium"
                  >
                    <Icon name="RefreshCw" size={11} className={loading ? 'animate-spin' : ''} />
                    <span>Segarkan</span>
                  </button>
                </div>

                <div className="relative pl-5 border-l-2 border-primary-200 ml-2 space-y-5 my-2">
                  {tracking.history?.map((checkpoint, index) => {
                    const isLatest = index === 0
                    return (
                      <div key={index} className="relative group">
                        {/* Node circle */}
                        <div
                          className={`absolute -left-[27px] top-0.5 w-4 h-4 rounded-full border-2 transition-all ${
                            isLatest
                              ? 'bg-primary-600 border-white ring-4 ring-primary-100 shadow-sm'
                              : 'bg-gray-300 border-white'
                          }`}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-semibold ${isLatest ? 'text-primary-700' : 'text-gray-500'}`}>
                              {formatDateTime(checkpoint.date)}
                            </span>
                            {checkpoint.location && (
                              <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded font-medium">
                                {checkpoint.location}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs leading-relaxed ${isLatest ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                            {checkpoint.desc}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
