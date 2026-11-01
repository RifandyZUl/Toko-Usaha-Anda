import { useState, useEffect, useCallback } from 'react'
import Icon from '@shared/components/Icon.jsx'
import { getOrderTracking } from '../../services/orders'
import { formatDateTime } from '../../utils/format'
import { copyToClipboard } from '../../utils/clipboard'

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

  const handleCopyResi = async (waybill) => {
    if (!waybill) return
    const success = await copyToClipboard(waybill)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!orderId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[88vh] flex flex-col overflow-hidden border border-gray-100 ring-1 ring-black/5 transform transition-all">
        {/* Modern Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center shadow-inner">
              <Icon name="Truck" size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-heading font-semibold text-white tracking-wide">
                  Lacak Pengiriman
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Live
                </span>
              </div>
              <p className="text-[11px] text-gray-300 font-mono mt-0.5">
                Order #{orderId.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Tutup pelacakan"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {loading && !tracking ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                <Icon name="Loader2" size={24} className="animate-spin text-gray-800" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">Menghubungi Server Kurir...</p>
                <p className="text-[11px] text-gray-500 mt-1">Mengambil koordinat dan checkpoint status paket terkini</p>
              </div>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-3 bg-red-50/50 rounded-xl p-6 border border-red-100">
              <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <Icon name="AlertCircle" size={24} />
              </div>
              <p className="text-xs font-semibold text-red-700">{error}</p>
              <button
                type="button"
                onClick={fetchTracking}
                className="inline-flex items-center gap-1.5 text-xs text-gray-900 hover:text-gray-700 font-semibold px-4 py-1.5 bg-white rounded-lg border border-gray-200 shadow-xs"
              >
                <Icon name="RefreshCw" size={12} />
                <span>Coba Lagi</span>
              </button>
            </div>
          ) : tracking ? (
            <>
              {/* Waybill / Resi Card */}
              <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/70 rounded-xl border border-gray-200/80 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                      {tracking.courier}
                    </span>
                    <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 font-medium">
                      {tracking.service || 'Reguler'}
                    </span>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-gray-900 text-white shadow-xs">
                    {tracking.statusLabel || tracking.status}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-lg border border-gray-200 shadow-2xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium block">
                      Nomor Resi
                    </span>
                    <span className="font-mono text-sm md:text-base font-bold text-gray-900 tracking-wide select-all">
                      {tracking.waybillNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyResi(tracking.waybillNumber)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                      copied
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-gray-900 text-white hover:bg-black border-transparent shadow-xs'
                    }`}
                  >
                    <Icon name={copied ? 'CheckCircle' : 'Share2'} size={13} />
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-1 border-t border-gray-200/60">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Tujuan:</span>
                    <strong className="text-gray-900 font-medium">{tracking.destination || '-'}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 block text-[10px]">Status:</span>
                    <strong className="text-gray-900 font-medium">{tracking.status || 'Active'}</strong>
                  </div>
                </div>
              </div>

              {/* Real-time Tracking Timeline */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-heading font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-900"></span>
                    Riwayat Pergerakan Kurir
                  </h4>
                  <button
                    type="button"
                    onClick={fetchTracking}
                    disabled={loading}
                    className="text-[11px] text-gray-700 hover:text-black flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <Icon name="RefreshCw" size={11} className={loading ? 'animate-spin' : ''} />
                    <span>Segarkan</span>
                  </button>
                </div>

                <div className="relative pl-6 border-l-2 border-gray-200 ml-3 space-y-6 my-2">
                  {tracking.history?.map((checkpoint, index) => {
                    const isLatest = index === 0
                    return (
                      <div key={index} className="relative group">
                        {/* Node circle */}
                        <div
                          className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                            isLatest
                              ? 'bg-emerald-500 border-white ring-4 ring-emerald-100 shadow-sm'
                              : 'bg-gray-300 border-white'
                          }`}
                        />
                        <div className={`p-3 rounded-xl transition-all ${isLatest ? 'bg-emerald-50/40 border border-emerald-100/80 shadow-2xs' : 'bg-gray-50/50'}`}>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-[11px] font-bold ${isLatest ? 'text-emerald-800' : 'text-gray-700'}`}>
                              {formatDateTime(checkpoint.date)}
                            </span>
                            {checkpoint.location && (
                              <span className="text-[10px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium shadow-2xs">
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
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-medium">
            Terhubung langsung dengan API pelacakan kurir resmi
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-gray-800 hover:text-black bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
