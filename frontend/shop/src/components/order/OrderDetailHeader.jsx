import { Link } from 'react-router-dom'
import Icon from '@shared/components/Icon.jsx'
import { formatDateTime } from '../../utils/format'

/**
 * OrderDetailHeader - Top navigation, order meta, status badge, and tracking stepper
 */
export default function OrderDetailHeader({ order, stepInfo }) {
  return (
    <div className="mb-6">
      {/* Back button */}
      <div className="flex items-center gap-2 mb-4">
        <Link
          to="/shop/profile?tab=orders"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Icon name="ArrowLeft" size={14} />
          <span>Kembali ke Riwayat Pesanan</span>
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-heading font-semibold text-gray-900">
              Rincian Pesanan
            </h1>
            <span className="text-xs font-mono font-bold bg-gray-100 text-gray-800 px-2.5 py-1 rounded">
              #{order.id?.slice(-8).toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Dibuat pada {formatDateTime(order.createdAt)}
          </p>
        </div>

        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${stepInfo.badgeClass}`}>
          {stepInfo.label}
        </span>
      </div>

      {/* Tracking Progress Stepper */}
      {!stepInfo.isCancelled ? (
        <div className="my-5 py-4 px-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <div className="relative flex items-center justify-between">
            {/* Progress Line */}
            <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-200 -z-0">
              <div
                className="h-full bg-primary-600 transition-all duration-500"
                style={{
                  width:
                    stepInfo.step <= 1
                      ? '0%'
                      : stepInfo.step === 2
                        ? '33%'
                        : stepInfo.step === 3
                          ? '66%'
                          : '100%',
                }}
              />
            </div>

            {/* Stepper Points */}
            {[
              { step: 1, label: 'Dipesan', icon: 'Clock' },
              { step: 2, label: 'Dikemas', icon: 'Package' },
              { step: 3, label: 'Dikirim', icon: 'Truck' },
              { step: 4, label: 'Selesai', icon: 'CheckCircle' },
            ].map(s => {
              const isDone = stepInfo.step >= s.step
              const isCurrent = stepInfo.step === s.step
              return (
                <div key={s.step} className="flex-1 flex flex-col items-center relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                      isDone
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'bg-white border-2 border-gray-300 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}
                  >
                    <Icon name={s.icon} size={15} />
                  </div>
                  <span
                    className={`text-[11px] md:text-xs mt-1.5 text-center font-medium ${
                      isDone ? 'text-gray-900 font-semibold' : 'text-gray-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-red-800">
          <Icon name="AlertCircle" size={18} className="text-red-600 shrink-0" />
          <span>
            Pesanan ini telah dibatalkan ({order.status === 'EXPIRED' ? 'Batas waktu pembayaran habis' : 'Dibatalkan oleh pembeli'}).
            Seluruh stok produk telah dikembalikan ke inventaris.
          </span>
        </div>
      )}
    </div>
  )
}
