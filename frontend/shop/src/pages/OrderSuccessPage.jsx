import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { getOrderById, simulateOrderPayment } from '../services/orders'
import ShopNavigation from '../components/ShopNavigation'
import { useAuthStore } from '../stores/authStore'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import { formatCurrency } from '../utils/format'
import { loadMidtransSnap } from '../utils/checkoutHelpers'
import { handleCopyFeedback } from '../utils/clipboard'
import OrderSuccessPaymentInfo from '../components/order/OrderSuccessPaymentInfo'

/**
 * Order Success Page - Clean, modular view for post-checkout order confirmation
 */
function OrderSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const orderId = location.state?.orderId
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(!!orderId)
  const [error, setError] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/shop/login', { replace: true })
    }
  }, [user, navigate])

  const handleSimulatePayment = async () => {
    if (!orderId) return
    setIsSimulating(true)
    const result = await simulateOrderPayment(orderId)
    if (result.success) {
      const updated = await getOrderById(orderId)
      if (updated.success && updated.order) {
        setOrder(updated.order)
      }
    } else {
      alert(`Gagal simulasi pembayaran: ${result.error}`)
    }
    setIsSimulating(false)
  }

  const fetchOrder = useCallback(async () => {
    if (!orderId || !user) {
      setError('Order ID tidak ditemukan')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const result = await getOrderById(orderId)
    if (result.success && result.order) {
      setOrder(result.order)
    } else {
      setError(result.error || 'Order tidak ditemukan')
    }
    setLoading(false)
  }, [orderId, user])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // Polling for payment status verification (real-time updates)
  useEffect(() => {
    if (!orderId || !order || order.paymentStatus !== 'PENDING') return

    const interval = setInterval(() => {
      getOrderById(orderId).then(result => {
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
  }, [orderId, order])

  const shippingFee = order ? Number(order.shippingFee || 15000) : 15000

  // Copy helper with legacy fallback
  const handleCopy = (text, elementId) => {
    handleCopyFeedback(text, elementId)
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
        fetchOrder()
      },
      onPending: () => {
        fetchOrder()
      },
      onError: err => {
        console.error('Midtrans payment error:', err)
        alert('Pembayaran gagal, silakan coba lagi.')
      },
    })
  }

  // Map order status to label
  const orderStatusLabel = useMemo(() => {
    if (!order) return ''
    const statusMap = {
      PENDING: 'Menunggu Pembayaran',
      PROCESSING: 'Dikemas',
      SHIPPED: 'Dikirim',
      DELIVERED: 'Selesai',
      CANCELLED: 'Dibatalkan',
    }
    return statusMap[order.status] || order.status
  }, [order])

  // Get selected bank for transfer manual
  const selectedBank = useMemo(() => {
    if (!order?.paymentMethod) return null
    if (order.paymentMethod.startsWith('TRANSFER_')) {
      return order.paymentMethod.split('_')[1].toLowerCase()
    }
    return null
  }, [order])

  // Map payment method to readable label
  const paymentMethodLabel = useMemo(() => {
    if (!order?.paymentMethod) return ''
    if (order.paymentMethod === 'COD') return 'Cash on Delivery (COD)'
    if (order.paymentMethod === 'MIDTRANS') return 'Pembayaran Online (Midtrans)'
    if (order.paymentMethod.startsWith('TRANSFER_')) {
      const bankName = order.paymentMethod.split('_')[1]
      return `Transfer Bank (${bankName})`
    }
    return 'Transfer Bank'
  }, [order])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <ShopNavigation />
        <main className="container-custom py-20">
          <Loading message="Loading order details..." />
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
            <ErrorMessage message={error} onRetry={() => navigate('/shop')} />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ShopNavigation />

      <main className="container-custom py-12 max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="CheckCircle" size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-heading font-semibold text-gray-900 tracking-tight">
            {order?.paymentMethod?.startsWith('TRANSFER') && order?.paymentStatus === 'PENDING'
              ? 'Pesanan Berhasil Dibuat'
              : 'Pesanan Dikonfirmasi'}
          </h1>
          <p className="text-xs font-body text-gray-600 mt-2">
            Terima kasih telah berbelanja di Toko Usaha Anda.
          </p>
          {order && (
            <p className="text-[11px] font-mono text-gray-400 mt-2">
              ID PESANAN: {order.id.toUpperCase()}
            </p>
          )}
        </div>

        {/* Bank Transfer / QRIS / Online Payment Information Component */}
        <OrderSuccessPaymentInfo
          order={order}
          selectedBank={selectedBank}
          shippingFee={shippingFee}
          handleCopy={handleCopy}
          handleSimulatePayment={handleSimulatePayment}
          isSimulating={isSimulating}
          handlePayNow={handlePayNow}
        />

        {/* Order Details Card */}
        {order && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-xs">
            <h2 className="text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
              Rincian Pesanan
            </h2>

            {/* Summary List */}
            <div className="space-y-3 mb-6 pb-6 border-b border-gray-100 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Status Pesanan:</span>
                <span className="font-semibold text-gray-900">{orderStatusLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode Pembayaran:</span>
                <span className="font-semibold text-gray-900">{paymentMethodLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>Status Pembayaran:</span>
                <span className="font-semibold text-gray-900">
                  {order.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal Produk:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(Number(order.totalAmount))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kurir Pengiriman:</span>
                <span className="font-semibold text-gray-900">
                  {order.shippingCourier || 'JNE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Pengiriman:</span>
                <span className="font-medium text-gray-900">{formatCurrency(shippingFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-heading font-semibold text-gray-900 pt-2 border-t border-dashed border-gray-100">
                <span>Total Pembayaran:</span>
                <span className="text-primary-600">
                  {formatCurrency(Number(order.totalAmount) + shippingFee)}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h3 className="text-[10px] font-heading font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Item Pembelian
              </h3>
              <div className="divide-y divide-gray-50">
                {order.items?.map((item, index) => (
                  <div
                    key={index}
                    className="py-2.5 first:pt-0 last:pb-0 flex justify-between text-xs"
                  >
                    <span className="text-gray-600">
                      {item.product?.name || 'Produk'}{' '}
                      <strong className="text-gray-900">x{item.quantity}</strong>
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="text-[10px] font-heading font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Alamat Pengiriman
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                {order.shippingAddress}
              </p>
              {order.shippingPhone && (
                <p className="text-xs text-gray-600 mt-1 font-semibold">
                  No. Telp: {order.shippingPhone}
                </p>
              )}
              {order.latitude && order.longitude && (
                <div className="mt-2 text-xs text-gray-600">
                  <p className="font-semibold mb-1">Koordinat Lokasi:</p>
                  <p className="text-[10px] font-mono text-gray-500 mb-2">
                    {order.latitude}, {order.longitude}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded transition-colors"
                  >
                    <Icon name="MapPin" size={12} />
                    Buka di Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/shop" className="flex-1">
            <Button
              variant="primary"
              fullWidth
              size="md"
              className="uppercase tracking-wider text-xs"
            >
              Lanjutkan Belanja
            </Button>
          </Link>
          <Link to="/shop/profile" className="flex-1">
            <Button
              variant="outline"
              fullWidth
              size="md"
              className="uppercase tracking-wider text-xs"
            >
              Lihat Riwayat Pesanan
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

export default OrderSuccessPage
