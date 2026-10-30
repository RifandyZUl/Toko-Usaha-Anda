import Icon from '@shared/components/Icon.jsx'
import Loading from '../common/Loading'
import ErrorMessage from '../common/ErrorMessage'
import TrackingModal from '../modals/TrackingModal'
import DisputeModal from '../modals/DisputeModal'
import ReviewModal from '../modals/ReviewModal'
import ProfileOrderCard from './ProfileOrderCard'

/**
 * ProfileOrdersTab - Order history, live status polling, filter tabs, and modal handlers
 */
export default function ProfileOrdersTab({
  orders = [],
  filteredOrders = [],
  ordersLoading = false,
  ordersError = null,
  orderFilter = 'ALL',
  setOrderFilter,
  orderCounts = {},
  lastOrderUpdated = null,
  fetchOrders,
  cancellingOrderId,
  completingOrderId,
  handleCancelOrder,
  handleCompleteOrder,
  trackingModalOrderId,
  setTrackingModalOrderId,
  disputeModalOrder,
  setDisputeModalOrder,
  reviewModalData,
  setReviewModalData,
  getOrderStepInfo,
  navigate,
}) {
  const filterTabs = [
    { id: 'ALL', label: 'Semua', count: orderCounts.ALL },
    { id: 'UNPAID', label: 'Belum Bayar', count: orderCounts.UNPAID },
    { id: 'PROCESSING', label: 'Dikemas', count: orderCounts.PROCESSING },
    { id: 'SHIPPED', label: 'Dikirim', count: orderCounts.SHIPPED },
    { id: 'DELIVERED', label: 'Selesai', count: orderCounts.DELIVERED },
    { id: 'CANCELLED', label: 'Dibatalkan', count: orderCounts.CANCELLED },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-xs">
      {/* Header: Title, Live Status Indicator, Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-heading font-semibold text-gray-900">Pesanan Saya</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Lacak alur pembayaran, pengemasan, dan pengiriman secara real-time
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {lastOrderUpdated && (
            <span className="text-[10px] text-gray-400 hidden sm:inline">
              Diperbarui {lastOrderUpdated.toLocaleTimeString('id-ID')}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium">Live Tracking</span>
          </div>
          <button
            type="button"
            onClick={() => fetchOrders()}
            disabled={ordersLoading}
            className="inline-flex items-center gap-1.5 text-xs text-gray-700 hover:text-primary-700 hover:bg-gray-100 px-3 py-1.5 rounded transition-colors border border-gray-200"
            title="Segarkan status pesanan"
          >
            <Icon
              name="RefreshCw"
              size={13}
              className={ordersLoading ? 'animate-spin text-primary-600' : ''}
            />
            <span>{ordersLoading ? 'Memuat...' : 'Segarkan'}</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 mb-6 overflow-x-auto pb-1 text-xs">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setOrderFilter(tab.id)}
            className={`px-3.5 py-2 font-medium whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              orderFilter === tab.id
                ? 'border-primary-600 text-primary-700 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  orderFilter === tab.id
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {ordersLoading && orders.length === 0 ? (
        <div className="text-center py-12">
          <Loading message="Memuat riwayat pesanan..." />
        </div>
      ) : ordersError ? (
        <ErrorMessage message={ordersError} onRetry={fetchOrders} />
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
          <Icon name="Package" size={44} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            {orderFilter === 'ALL'
              ? 'Belum ada pesanan'
              : `Tidak ada pesanan dengan status "${orderFilter}"`}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Jelajahi berbagai produk perkakas rumah tangga di katalog kami
          </p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-4 py-2 rounded transition-colors"
          >
            Mulai Belanja
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map(order => {
            const stepInfo = getOrderStepInfo(order)
            return (
              <ProfileOrderCard
                key={order.id}
                order={order}
                stepInfo={stepInfo}
                cancellingOrderId={cancellingOrderId}
                completingOrderId={completingOrderId}
                onCancelOrder={handleCancelOrder}
                onCompleteOrder={handleCompleteOrder}
                onOpenTracking={setTrackingModalOrderId}
                onOpenDispute={setDisputeModalOrder}
                onOpenReview={ord =>
                  setReviewModalData({ orderId: ord.id, product: ord.items[0]?.product })
                }
                onNavigateOrder={orderId => navigate(`/shop/order/${orderId}`)}
                onNavigateShop={() => navigate('/shop')}
              />
            )
          })}
        </div>
      )}

      {/* Modals */}
      {trackingModalOrderId && (
        <TrackingModal
          orderId={trackingModalOrderId}
          onClose={() => setTrackingModalOrderId(null)}
        />
      )}
      {disputeModalOrder && (
        <DisputeModal
          order={disputeModalOrder}
          onClose={() => setDisputeModalOrder(null)}
          onSuccess={() => fetchOrders(true)}
        />
      )}
      {reviewModalData && (
        <ReviewModal
          orderId={reviewModalData.orderId}
          product={reviewModalData.product}
          onClose={() => setReviewModalData(null)}
          onSuccess={() => fetchOrders(true)}
        />
      )}
    </div>
  )
}
