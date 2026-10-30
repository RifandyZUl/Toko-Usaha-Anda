import Icon from '@shared/components/Icon.jsx'
import { formatCurrency, formatDateTime } from '../../utils/format'

/**
 * ProfileOrderCard - Renders a single customer order with tracking progress and actions
 */
export default function ProfileOrderCard({
  order,
  stepInfo,
  cancellingOrderId,
  completingOrderId,
  onCancelOrder,
  onCompleteOrder,
  onOpenTracking,
  onOpenDispute,
  onOpenReview,
  onNavigateOrder,
  onNavigateShop,
}) {
  const totalAmountNum = Number(order.totalAmount || 0) + Number(order.shippingFee || 0)

  return (
    <div className="border border-gray-200 rounded-lg p-4 md:p-5 hover:border-gray-300 transition-all bg-white shadow-xs">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
            #{order.id?.slice(-8).toUpperCase()}
          </span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</span>
          {order.shippingCourier && (
            <>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
                <Icon name="Truck" size={12} className="text-gray-400" />
                {order.shippingCourier}
              </span>
            </>
          )}
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${stepInfo.badgeClass}`}>
          {stepInfo.label}
        </span>
      </div>

      {/* Tracking Progress Stepper */}
      {!stepInfo.isCancelled ? (
        <div className="my-4 py-3 px-3 bg-gray-50/70 rounded-lg border border-gray-100">
          <div className="relative flex items-center justify-between">
            {/* Progress Line */}
            <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-gray-200 -z-0">
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
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                      isDone
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'bg-white border-2 border-gray-300 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}
                  >
                    <Icon name={s.icon} size={13} />
                  </div>
                  <span
                    className={`text-[10px] md:text-[11px] mt-1 text-center font-medium ${
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
        <div className="my-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-xs text-red-800">
          <Icon name="AlertCircle" size={16} className="text-red-600 shrink-0" />
          <span>
            Pesanan dibatalkan (
            {order.status === 'EXPIRED'
              ? 'Batas waktu pembayaran habis'
              : 'Dibatalkan oleh pembeli'}
            ). Seluruh stok produk telah dikembalikan ke inventaris.
          </span>
        </div>
      )}

      {/* Order Items */}
      <div className="divide-y divide-gray-100 my-3">
        {order.items?.map((item, idx) => {
          const productName = item.product?.name || item.name || 'Produk'
          const productImage =
            item.product?.images?.[0] ||
            item.product?.image ||
            item.image ||
            '/placeholder-product.png'

          return (
            <div key={idx} className="py-2.5 flex items-center gap-3">
              <div className="w-14 h-14 bg-gray-50 rounded border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                <img
                  src={productImage}
                  alt={productName}
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.target.onerror = null
                    e.target.src = '/placeholder-product.png'
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-body font-medium text-gray-900 truncate">
                  {productName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.quantity} barang x {formatCurrency(item.price)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs md:text-sm font-semibold text-gray-900">
                  {formatCurrency(Number(item.price) * item.quantity)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Card Footer: Total, Method & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
        <div className="text-left">
          <span className="text-xs text-gray-500">Total Belanja: </span>
          <span className="text-sm font-heading font-bold text-gray-900">
            {formatCurrency(totalAmountNum)}
          </span>
          <span className="text-[11px] text-gray-400 ml-2">
            ({order.paymentMethod || 'Transfer'})
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* If PENDING and UNPAID */}
          {order.status === 'PENDING' && order.paymentStatus === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={() => onCancelOrder(order.id)}
                disabled={cancellingOrderId === order.id}
                className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded transition-colors disabled:opacity-50"
              >
                {cancellingOrderId === order.id ? 'Membatalkan...' : 'Batalkan'}
              </button>
              <button
                type="button"
                onClick={() => onNavigateOrder(order.id)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors shadow-xs"
              >
                Bayar Sekarang
              </button>
            </>
          )}

          {/* If PROCESSING */}
          {order.status === 'PROCESSING' && (
            <button
              type="button"
              onClick={() => onNavigateOrder(order.id)}
              className="px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:text-primary-700 border border-gray-300 hover:border-primary-400 rounded transition-colors"
            >
              Lihat Rincian
            </button>
          )}

          {/* If SHIPPED */}
          {order.status === 'SHIPPED' && (
            <>
              <button
                type="button"
                disabled={completingOrderId === order.id}
                onClick={() => onCompleteOrder(order.id)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Icon name="CheckCircle" size={13} />
                <span>{completingOrderId === order.id ? 'Memproses...' : 'Pesanan Diterima'}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenTracking(order.id)}
                className="px-3.5 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded transition-colors flex items-center gap-1.5"
              >
                <Icon name="Truck" size={13} />
                <span>Lacak Paket</span>
              </button>
              {!order.paymentDetails?.disputeDetails?.isDisputed && (
                <button
                  type="button"
                  onClick={() => onOpenDispute(order)}
                  className="px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 border border-amber-200 rounded transition-colors"
                >
                  Komplain
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigateOrder(order.id)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
              >
                Rincian
              </button>
            </>
          )}

          {/* If DELIVERED */}
          {order.status === 'DELIVERED' && (
            <>
              <button
                type="button"
                onClick={() => onOpenReview(order)}
                className="px-3.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded transition-colors flex items-center gap-1"
              >
                <Icon name="Star" size={13} className="fill-amber-400 text-amber-500" />
                <span>Beri Ulasan</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenTracking(order.id)}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 border border-blue-200 rounded transition-colors flex items-center gap-1"
              >
                <Icon name="Truck" size={12} />
                <span>Lacak</span>
              </button>
              {!order.paymentDetails?.disputeDetails?.isDisputed && (
                <button
                  type="button"
                  onClick={() => onOpenDispute(order)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
                >
                  Komplain
                </button>
              )}
              <button
                type="button"
                onClick={onNavigateShop}
                className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 border border-primary-300 rounded transition-colors"
              >
                Beli Lagi
              </button>
              <button
                type="button"
                onClick={() => onNavigateOrder(order.id)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
              >
                Rincian
              </button>
            </>
          )}

          {/* If CANCELLED */}
          {stepInfo.isCancelled && (
            <>
              <button
                type="button"
                onClick={onNavigateShop}
                className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 border border-primary-300 rounded transition-colors"
              >
                Beli Lagi
              </button>
              <button
                type="button"
                onClick={() => onNavigateOrder(order.id)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
              >
                Rincian
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dispute Alert */}
      {order.paymentDetails?.disputeDetails?.isDisputed && (
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
          <span className="flex items-center gap-1.5 font-medium">
            <Icon name="AlertTriangle" size={13} className="text-amber-600 shrink-0" />
            <span>
              Komplain Diajukan: <strong>{order.paymentDetails.disputeDetails.reason}</strong> (
              {order.paymentDetails.disputeDetails.status})
            </span>
          </span>
          <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
            Ditangguhkan
          </span>
        </div>
      )}

      {/* Auto-complete notice */}
      {order.status === 'SHIPPED' && !order.paymentDetails?.disputeDetails?.isDisputed && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded border border-amber-100">
          <Icon name="Clock" size={13} className="text-amber-600 shrink-0" />
          <span>
            Pesanan otomatis diselesaikan dalam <strong>2 hari</strong> setelah barang diterima jika
            belum dikonfirmasi.
          </span>
        </div>
      )}
    </div>
  )
}
