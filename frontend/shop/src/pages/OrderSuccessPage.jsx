import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { getOrderById } from '../services/orders'
import ShopNavigation from '../components/ShopNavigation'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

/**
 * Order Success Page - Elegant design
 */
function OrderSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const orderId = location.state?.orderId
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(!!orderId)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        setLoading(true)
        setError(null)
        const result = await getOrderById(orderId)
        if (result.success && result.order) {
          setOrder(result.order)
        } else {
          setError(result.error || 'Order tidak ditemukan')
        }
        setLoading(false)
      }
      fetchOrder()
    } else {
      setError('Order ID tidak ditemukan')
      setLoading(false)
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loading message="Loading order details..." />
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorMessage
            message={error}
            onRetry={() => navigate('/shop')}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ShopNavigation />

      <main className="container-custom py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="CheckCircle" size={48} className="text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-medium text-gray-900 mb-4 tracking-tight">
              Order Confirmed
            </h1>
            <p className="text-sm font-body text-gray-600 mb-4">
              Thank you for your order. We will process it soon.
            </p>
            {order && (
              <p className="text-xs font-body text-gray-500">
                Order ID: <span className="font-mono font-medium">{order.id}</span>
              </p>
            )}
          </div>

          {/* Order Details */}
          {order && (
            <div className="bg-white p-8 mb-8">
              <h2 className="text-xl font-heading font-medium text-gray-900 mb-6">
                Order Details
              </h2>

              {/* Order Info */}
              <div className="space-y-4 mb-8 pb-8 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-gray-900">{order.status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium text-gray-900">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-heading font-medium text-gray-900">
                    Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="text-sm font-body font-medium text-gray-900 mb-4 uppercase tracking-wider">
                    Items
                  </h3>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.product?.name || 'Product'} x{item.quantity}
                        </span>
                        <span className="font-medium text-gray-900">
                          Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping Info */}
              {order.shippingAddress && (
                <div>
                  <h3 className="text-sm font-body font-medium text-gray-900 mb-3 uppercase tracking-wider">
                    Shipping Address
                  </h3>
                  <p className="text-sm font-body text-gray-600 leading-relaxed">
                    {order.shippingAddress}
                  </p>
                  {order.shippingPhone && (
                    <p className="text-sm font-body text-gray-600 mt-2">
                      Phone: {order.shippingPhone}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <Link to="/shop">
              <Button variant="primary" fullWidth size="lg" className="uppercase tracking-wider">
                Continue Shopping
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" fullWidth size="lg" className="uppercase tracking-wider">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default OrderSuccessPage
