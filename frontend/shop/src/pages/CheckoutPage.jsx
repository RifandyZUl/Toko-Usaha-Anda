import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { useForm } from '../hooks/useForm'
import { syncCartToBackend } from '../services/cart'
import { createOrder } from '../services/orders'
import ShopNavigation from '../components/ShopNavigation'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

/**
 * Checkout Page - Elegant design inspired by Arhaus
 */
function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const [orderError, setOrderError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const totalPrice = getTotalPrice()
  const shippingFee = 15000
  const finalTotal = totalPrice + shippingFee

  // Pre-fill form with user data if available
  const initialValues = {
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'cod',
  }

  const onSubmit = async values => {
    setIsProcessing(true)
    setOrderError(null)

    try {
      // 1. Sync local cart to backend
      const syncResult = await syncCartToBackend(items)
      if (!syncResult.success) {
        setOrderError(syncResult.error || 'Gagal sync keranjang ke server')
        setIsProcessing(false)
        return
      }

      // 2. Prepare shipping address
      const shippingAddress = `${values.address}, ${values.city} ${values.postalCode}`.trim()

      // 3. Create order
      const orderResult = await createOrder({
        shippingAddress,
        shippingPhone: values.phone,
        paymentMethod: values.paymentMethod.toUpperCase(),
      })

      if (orderResult.success) {
        clearCart()
        navigate('/shop/order-success', {
          state: { orderId: orderResult.order.id },
        })
      } else {
        setOrderError(orderResult.error || 'Gagal membuat pesanan')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setOrderError(error.message || 'Terjadi kesalahan saat checkout')
    } finally {
      setIsProcessing(false)
    }
  }

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } =
    useForm(initialValues, validateCheckoutForm, onSubmit)

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <ShopNavigation />
        <main className="container-custom py-20">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-2xl font-heading font-medium text-gray-900 mb-4">
              Your Cart is Empty
            </h2>
            <Link to="/shop">
              <Button variant="primary" size="lg" className="uppercase tracking-wider">
                Start Shopping
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ShopNavigation />
      
      <main className="container-custom py-12">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-heading font-medium text-gray-900 mb-2 tracking-tight">
            Checkout
          </h1>
          <p className="text-sm font-body text-gray-600">
            Please complete your shipping information
          </p>
        </div>

        {orderError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center gap-2 text-red-600">
              <Icon name="AlertCircle" size={20} />
              <p className="text-sm font-medium">{orderError}</p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="mb-6">
            <Loading message="Processing your order..." />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8">
              <h2 className="text-xl font-heading font-medium text-gray-900 mb-8">
                Shipping Information
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                    disabled={isSubmitting || isProcessing}
                  />
                  {errors.name && touched.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={values.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                    disabled={isSubmitting || isProcessing}
                  />
                  {errors.phone && touched.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={values.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors resize-none"
                    placeholder="Street address"
                    disabled={isSubmitting || isProcessing}
                  />
                  {errors.address && touched.address && (
                    <p className="mt-1 text-xs text-red-500">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={values.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                      disabled={isSubmitting || isProcessing}
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={values.postalCode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                      disabled={isSubmitting || isProcessing}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-body font-medium text-gray-900 mb-4 uppercase tracking-wider">
                    Payment Method
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border border-gray-300 cursor-pointer hover:border-gray-900 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={values.paymentMethod === 'cod'}
                        onChange={handleChange}
                        className="w-4 h-4 text-gray-900"
                        disabled={isSubmitting || isProcessing}
                      />
                      <span className="text-sm font-body text-gray-900">Cash on Delivery (COD)</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-gray-300 cursor-pointer hover:border-gray-900 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={values.paymentMethod === 'transfer'}
                        onChange={handleChange}
                        className="w-4 h-4 text-gray-900"
                        disabled={isSubmitting || isProcessing}
                      />
                      <span className="text-sm font-body text-gray-900">Bank Transfer</span>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  disabled={isSubmitting || isProcessing}
                  className="uppercase tracking-wider mt-8"
                >
                  {isSubmitting || isProcessing ? (
                    <>
                      <Icon name="Loader2" size={20} className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 sticky top-20">
              <h2 className="text-xl font-heading font-medium text-gray-900 mb-6">
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-8 pb-8 border-b border-gray-200">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-medium text-gray-900">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
                
                <div className="pt-4 space-y-3">
                  <div className="flex justify-between text-sm font-body text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">
                      Rp {totalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-body text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium text-gray-900">
                      Rp {shippingFee.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-base font-heading font-medium text-gray-900">Total</span>
                <span className="text-lg font-heading font-medium text-gray-900">
                  Rp {finalTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Validation
function validateCheckoutForm(values) {
  const errors = {}
  if (!values.name || values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  }
  if (!values.phone || values.phone.trim().length < 10) {
    errors.phone = 'Phone number must be at least 10 digits'
  }
  if (!values.address || values.address.trim().length < 10) {
    errors.address = 'Address must be at least 10 characters'
  }
  if (!values.city || values.city.trim().length < 2) {
    errors.city = 'City is required'
  }
  return errors
}

export default CheckoutPage
