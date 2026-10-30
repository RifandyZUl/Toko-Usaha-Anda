import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ShopNavigation from '../components/ShopNavigation'
import { useAuthStore } from '../stores/authStore'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import TrackingModal from '../components/TrackingModal'
import DisputeModal from '../components/DisputeModal'
import ReviewModal from '../components/ReviewModal'
import { getOrderById, simulateOrderPayment, cancelOrder, completeOrder } from '../services/orders'
import { logError } from '../utils/logger'
import { loadMidtransSnap } from '../utils/checkoutHelpers'
import OrderDetailHeader from '../components/order/OrderDetailHeader'
import OrderDetailPaymentCard from '../components/order/OrderDetailPaymentCard'
import OrderDetailItemsCard from '../components/order/OrderDetailItemsCard'
import OrderDetailShippingInfo from '../components/order/OrderDetailShippingInfo'
import OrderDetailActionButtons from '../components/order/OrderDetailActionButtons'

/**
 * Order Detail Page - Modular, maintainable customer view of single order
 */
function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [cancellingOrderId, setCancellingOrderId] = useState(null)
  const [completingOrderId, setCompletingOrderId] = useState(null)
  const [isTrackingOpen, setIsTrackingOpen] = useState(false)
  const [isDisputeOpen, setIsDisputeOpen] = useState(false)
  const [reviewModalData, setReviewModalData] = useState(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/shop/login', { state: { from: { pathname: `/shop/order/${id}` } } })
    }
  }, [user, navigate, id])

  const fetchOrder = useCallback(
    async (isSilent = false) => {
      if (!id || !user) return
      if (!isSilent) setLoading(true)
      setError(null)
      try {
        const result = await getOrderById(id)
        if (result.success && result.order) {
          setOrder(result.order)
        } else {
          if (!isSilent) setError(result.error || 'Pesanan tidak ditemukan')
        }
      } catch (err) {
        logError('Error fetching order', err)
        if (!isSilent) setError('Gagal memuat rincian pesanan')
      } finally {
        if (!isSilent) setLoading(false)
      }
    },
    [id, user]
  )

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // Polling for payment status updates every 5 seconds if PENDING
  useEffect(() => {
    if (!id || !order || order.paymentStatus !== 'PENDING') return

    const interval = setInterval(() => {
      getOrderById(id).then(result => {
        if (result.success && result.order) {
          if (
            result.order.paymentStatus !== order.paymentStatus ||
            result.order.status !== order.status
          ) {
            setOrder(result.order)
          }
        }
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [id, order])

  // Stepper progress info calculation
  const stepInfo = useMemo(() => {
    if (!order) return { step: 1, isCancelled: false, label: '', badgeClass: '' }
    if (order.status === 'CANCELLED' || order.status === 'EXPIRED') {
      return {
        step: -1,
        isCancelled: true,
        label: order.status === 'EXPIRED' ? 'Kedaluwarsa' : 'Dibatalkan',
        badgeClass: 'bg-red-50 text-red-700 border border-red-200',
      }
    }
    if (order.status === 'DELIVERED') {
      return {
        step: 4,
        isCancelled: false,
        label: 'Selesai',
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      }
    }
    if (order.status === 'SHIPPED') {
      return {
        step: 3,
        isCancelled: false,
        label: 'Sedang Dikirim',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
      }
    }
    if (order.status === 'PROCESSING' || order.paymentStatus === 'PAID') {
      return {
        step: 2,
        isCancelled: false,
        label: 'Sedang Dikemas',
        badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      }
    }
    return {
      step: 1,
      isCancelled: false,
      label: 'Menunggu Pembayaran',
      badgeClass: 'bg-orange-50 text-orange-700 border border-orange-200',
    }
  }, [order])

  const selectedBank = useMemo(() => {
    if (!order?.paymentMethod) return null
    if (order.paymentMethod.startsWith('TRANSFER_')) {
      return order.paymentMethod.split('_')[1].toLowerCase()
    }
    return null
  }, [order])

  const shippingFee = order ? Number(order.shippingFee || 15000) : 15000

  // Payment Simulation
  const handleSimulatePayment = async () => {
    if (!id) return
    setIsSimulating(true)
    const result = await simulateOrderPayment(id)
    if (result.success) {
      await fetchOrder(true)
    } else {
      alert(`Gagal simulasi pembayaran: ${result.error}`)
    }
    setIsSimulating(false)
  }

  // Cancel Order
  const handleCancelOrder = async orderId => {
    if (
      !window.confirm(
        'Apakah Anda yakin ingin membatalkan pesanan ini? Stok produk akan dikembalikan.'
      )
    ) {
      return
    }
    setCancellingOrderId(orderId)
    try {
      const result = await cancelOrder(orderId)
      if (result.success) {
        await fetchOrder(true)
      } else {
        alert(result.error || 'Gagal membatalkan pesanan')
      }
    } catch (err) {
      alert('Terjadi kesalahan saat membatalkan pesanan')
    } finally {
      setCancellingOrderId(null)
    }
  }

  // Confirm Received
  const handleCompleteOrder = async orderId => {
    if (!window.confirm('Konfirmasi bahwa barang telah Anda terima dengan baik?')) {
      return
    }
    setCompletingOrderId(orderId)
    try {
      const result = await completeOrder(orderId)
      if (result.success) {
        await fetchOrder(true)
      } else {
        alert(result.error || 'Gagal menyelesaikan pesanan')
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menyelesaikan pesanan')
    } finally {
      setCompletingOrderId(null)
    }
  }

  // Midtrans retry trigger
  const handlePayNow = async () => {
    if (!order?.paymentId) return

    const isSnapLoaded = await loadMidtransSnap()
    if (!isSnapLoaded) {
      alert('Gagal memuat sistem pembayaran Midtrans')
      return
    }

    window.snap.pay(order.paymentId, {
      onSuccess: () => {
        fetchOrder(true)
      },
      onPending: () => {
        fetchOrder(true)
      },
      onError: err => {
        console.error('Midtrans payment error:', err)
        alert('Pembayaran gagal, silakan coba lagi.')
      },
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <ShopNavigation />
        <main className="container-custom py-20">
          <Loading message="Memuat rincian pesanan..." />
        </main>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <ShopNavigation />
        <main className="container-custom py-20">
          <div className="max-w-md mx-auto">
            <ErrorMessage message={error} onRetry={() => fetchOrder()} />
          </div>
        </main>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ShopNavigation />

      <main className="container-custom py-8 max-w-4xl mx-auto">
        {/* Header & Status Stepper */}
        <OrderDetailHeader order={order} stepInfo={stepInfo} />

        <div className="space-y-6">
          {/* Payment Card */}
          <OrderDetailPaymentCard
            order={order}
            selectedBank={selectedBank}
            shippingFee={shippingFee}
            isSimulating={isSimulating}
            onSimulatePayment={handleSimulatePayment}
            onPayNow={handlePayNow}
          />

          {/* Items & Price Breakdown */}
          <OrderDetailItemsCard order={order} shippingFee={shippingFee} />

          {/* Shipping Recipient & Courier */}
          <OrderDetailShippingInfo
            order={order}
            onOpenTracking={() => setIsTrackingOpen(true)}
          />

          {/* Order Actions */}
          <OrderDetailActionButtons
            order={order}
            stepInfo={stepInfo}
            cancellingOrderId={cancellingOrderId}
            completingOrderId={completingOrderId}
            onCancelOrder={handleCancelOrder}
            onCompleteOrder={handleCompleteOrder}
            onOpenTracking={() => setIsTrackingOpen(true)}
            onOpenDispute={() => setIsDisputeOpen(true)}
            onOpenReview={ord =>
              setReviewModalData({ orderId: ord.id, product: ord.items[0]?.product })
            }
            onPayNow={handlePayNow}
            onNavigateShop={() => navigate('/shop')}
          />
        </div>

        {/* Modals */}
        {isTrackingOpen && (
          <TrackingModal orderId={order.id} onClose={() => setIsTrackingOpen(false)} />
        )}
        {isDisputeOpen && (
          <DisputeModal
            order={order}
            onClose={() => setIsDisputeOpen(false)}
            onSuccess={() => fetchOrder(true)}
          />
        )}
        {reviewModalData && (
          <ReviewModal
            orderId={reviewModalData.orderId}
            product={reviewModalData.product}
            onClose={() => setReviewModalData(null)}
            onSuccess={() => fetchOrder(true)}
          />
        )}
      </main>
    </div>
  )
}

export default OrderDetailPage
