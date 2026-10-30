import Icon from '@shared/components/Icon.jsx'

/**
 * OrderDetailActionButtons - Contextual order actions (Pay, Cancel, Confirm, Dispute, Review)
 */
export default function OrderDetailActionButtons({
  order,
  stepInfo,
  cancellingOrderId,
  completingOrderId,
  onCancelOrder,
  onCompleteOrder,
  onOpenTracking,
  onOpenDispute,
  onOpenReview,
  onPayNow,
  onNavigateShop,
}) {
  const isPendingUnpaid = order.status === 'PENDING' && order.paymentStatus === 'PENDING'
  const isShipped = order.status === 'SHIPPED'
  const isDelivered = order.status === 'DELIVERED'
  const isCancelled = stepInfo.isCancelled
  const hasDispute = Boolean(order.paymentDetails?.disputeDetails?.isDisputed)

  return (
    <div className="space-y-4">
      {/* Dispute Alert Banner if Active */}
      {hasDispute && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <Icon name="AlertTriangle" size={16} className="text-amber-600 shrink-0" />
            <span>
              Komplain aktif: <strong>{order.paymentDetails.disputeDetails.reason}</strong> (Status:{' '}
              {order.paymentDetails.disputeDetails.status})
            </span>
          </div>
          <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
            Ditangguhkan
          </span>
        </div>
      )}

      {/* Auto-complete notice */}
      {isShipped && !hasDispute && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-800">
          <Icon name="Clock" size={15} className="text-blue-600 shrink-0" />
          <span>
            Pesanan otomatis selesai dalam <strong>2 hari</strong> setelah barang sampai jika belum
            dikonfirmasi.
          </span>
        </div>
      )}

      {/* Action Buttons Grid */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-200">
        {/* If PENDING: Pay Now or Cancel */}
        {isPendingUnpaid && (
          <>
            <button
              type="button"
              onClick={() => onCancelOrder(order.id)}
              disabled={cancellingOrderId === order.id}
              className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {cancellingOrderId === order.id ? 'Membatalkan...' : 'Batalkan Pesanan'}
            </button>
            <button
              type="button"
              onClick={onPayNow}
              className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-xs"
            >
              Bayar Sekarang
            </button>
          </>
        )}

        {/* If SHIPPED: Confirm Received, Track, and Dispute */}
        {isShipped && (
          <>
            {!hasDispute && (
              <button
                type="button"
                onClick={() => onOpenDispute(order)}
                className="px-4 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors"
              >
                Ajukan Komplain
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenTracking(order.id)}
              className="px-4 py-2 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Icon name="Truck" size={14} />
              <span>Lacak Paket</span>
            </button>
            <button
              type="button"
              disabled={completingOrderId === order.id}
              onClick={() => onCompleteOrder(order.id)}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Icon name="CheckCircle" size={14} />
              <span>
                {completingOrderId === order.id ? 'Memproses...' : 'Pesanan Diterima'}
              </span>
            </button>
          </>
        )}

        {/* If DELIVERED: Review, Dispute, Track, Buy Again */}
        {isDelivered && (
          <>
            {!hasDispute && (
              <button
                type="button"
                onClick={() => onOpenDispute(order)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              >
                Komplain
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenReview(order)}
              className="px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Icon name="Star" size={14} className="fill-amber-400 text-amber-500" />
              <span>Beri Ulasan</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenTracking(order.id)}
              className="px-4 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Icon name="Truck" size={14} />
              <span>Lacak Paket</span>
            </button>
            <button
              type="button"
              onClick={onNavigateShop}
              className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-xs"
            >
              Beli Lagi
            </button>
          </>
        )}

        {/* If CANCELLED: Buy Again */}
        {isCancelled && (
          <button
            type="button"
            onClick={onNavigateShop}
            className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-xs"
          >
            Beli Lagi
          </button>
        )}
      </div>
    </div>
  )
}
