import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { useCartStore, getItemKey, filterSelectedItems } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { useForm } from '../hooks/useForm'
import { useLocation } from '../hooks/useLocation'
import { syncCartToBackend } from '../services/cart'
import { createOrder } from '../services/orders'
import ShopNavigation from '../components/navigation/ShopNavigation'
import Loading from '../components/common/Loading'
import { logError } from '../utils/logger'
import { updateProfile } from '../services/auth'
import { getShippingRates } from '../services/shipping'
import { loadMidtransSnap, validateCheckoutForm } from '../utils/checkoutHelpers'
import CheckoutMapPicker from '../components/checkout/CheckoutMapPicker'
import CheckoutCourierSelector from '../components/checkout/CheckoutCourierSelector'
import CheckoutPaymentSelector from '../components/checkout/CheckoutPaymentSelector'
import CheckoutOrderSummary from '../components/checkout/CheckoutOrderSummary'

/**
 * Checkout Page - Elegant design inspired by Arhaus
 * Modularized for high scalability and clean architecture
 */
function CheckoutPage() {
  const navigate = useNavigate()
  const routerLocation = useRouterLocation()
  const { items, selectedItemKeys, removeItemsByKeys, buyNowItem, clearBuyNow } = useCartStore()
  const { user, setAuth } = useAuthStore()
  const [orderError, setOrderError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [courierOptions, setCourierOptions] = useState([])
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [shippingRateError, setShippingRateError] = useState(null)
  const setValuesRef = useRef(null)
  const onSubmitRef = useRef(null)

  // Buy Now checks out only its own product (not in the cart); otherwise only the CartPage selection
  const isBuyNow = Boolean(routerLocation.state?.buyNow && buyNowItem)
  const checkoutItems = useMemo(
    () => (isBuyNow ? [buyNowItem] : filterSelectedItems(items, selectedItemKeys || [])),
    [isBuyNow, buyNowItem, items, selectedItemKeys]
  )

  const totalPrice = useMemo(() => {
    return checkoutItems.reduce((acc, it) => acc + Number(it.price) * it.quantity, 0)
  }, [checkoutItems])

  // Pre-fill form with user data if available
  const initialValues = useMemo(() => {
    const activeUser = user?.user || user
    let parsedAddress = {}
    if (activeUser?.address) {
      try {
        const parsed = JSON.parse(activeUser.address)
        if (parsed && typeof parsed === 'object') {
          parsedAddress = parsed
        } else {
          parsedAddress = { addressDetail: String(activeUser.address) }
        }
      } catch (e) {
        parsedAddress = { addressDetail: String(activeUser.address) }
      }
    }

    return {
      receiverName: parsedAddress.receiverName || activeUser?.name || '',
      shippingPhone: parsedAddress.shippingPhone || activeUser?.phone || '',
      addressDetail: parsedAddress.addressDetail || '',
      province: parsedAddress.province || '',
      city: parsedAddress.city || '',
      subdistrict: parsedAddress.subdistrict || '',
      kelurahan: parsedAddress.kelurahan || '',
      postalCode: parsedAddress.postalCode || '',
      latitude: parsedAddress.latitude || '',
      longitude: parsedAddress.longitude || '',
      shippingCourier: '',
      shippingFee: 0,
      paymentMethod: 'transfer',
      selectedBank: 'bca',
    }
  }, [user])

  const scrollToError = useCallback(() => {
    setTimeout(() => {
      const errEl = document.getElementById('checkout-error-banner')
      if (errEl) {
        errEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 50)
  }, [])

  const handleFormSubmit = useCallback(async formValues => {
    if (onSubmitRef.current) {
      return await onSubmitRef.current(formValues)
    }
  }, [])

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
  } = useForm(initialValues, validateCheckoutForm, handleFormSubmit)
  setValuesRef.current = setValues

  const {
    provinces,
    cities,
    subdistricts,
    villages,
    fetchCities,
    fetchSubdistricts,
    fetchVillages,
    setSubdistricts,
    setVillages,
  } = useLocation()

  // Auto-resolve region IDs and fetch nested lists when initial values are pre-populated
  useEffect(() => {
    if (provinces.length > 0 && values.province) {
      const matchProv = provinces.find(p => p.name.toLowerCase() === values.province.toLowerCase())
      if (matchProv) {
        fetchCities(matchProv.id)
      }
    }
  }, [provinces, values.province, fetchCities])

  useEffect(() => {
    if (cities.length > 0 && values.city) {
      const matchCity = cities.find(c => c.name.toLowerCase() === values.city.toLowerCase())
      if (matchCity) {
        fetchSubdistricts(matchCity.id)
      }
    }
  }, [cities, values.city, fetchSubdistricts])

  useEffect(() => {
    if (subdistricts.length > 0 && values.subdistrict) {
      const matchSub = subdistricts.find(
        s => s.name.toLowerCase() === values.subdistrict.toLowerCase()
      )
      if (matchSub) {
        fetchVillages(matchSub.id)
      }
    }
  }, [subdistricts, values.subdistrict, fetchVillages])

  // Items to price shipping for; the server looks up their weights (same rule as order creation).
  // Serialized so the rate request only re-runs when the items actually change.
  const shippingItemsKey = useMemo(
    () =>
      JSON.stringify(
        checkoutItems.map(item => ({
          productId: String(item.id),
          variantId: item.variantId || null,
          quantity: item.quantity,
        }))
      ),
    [checkoutItems]
  )

  // Selected kelurahan (from BinderByte wilayah) - its ID is what the server prices shipping with
  const selectedVillage = useMemo(
    () => villages.find(v => v.name.toLowerCase() === values.kelurahan.toLowerCase()) || null,
    [villages, values.kelurahan]
  )

  // Kode pos always follows the selected kelurahan (no manual entry: it must match the priced location).
  // Also normalizes the casing of a saved kelurahan name so the dropdown shows it as selected.
  useEffect(() => {
    if (selectedVillage && values.kelurahan !== selectedVillage.name) {
      handleChange({ target: { name: 'kelurahan', value: selectedVillage.name } })
    }
    const postalCode = selectedVillage?.postalCode || ''
    if (values.postalCode !== postalCode && (selectedVillage || villages.length > 0)) {
      handleChange({ target: { name: 'postalCode', value: postalCode } })
    }
  }, [selectedVillage, villages.length, values.kelurahan, values.postalCode, handleChange])

  // Fetch exact courier tariffs from the server. No estimated fallback: on failure, no courier can be chosen.
  useEffect(() => {
    setCourierOptions([])
    setShippingRateError(null)
    setIsLoadingRates(false)
    const items = JSON.parse(shippingItemsKey)
    if (!selectedVillage?.id || items.length === 0) return

    let isMounted = true
    setIsLoadingRates(true)
    getShippingRates({ villageId: selectedVillage.id, items }).then(result => {
      if (!isMounted) return
      setCourierOptions(result.options)
      setShippingRateError(result.error)
      setIsLoadingRates(false)
    })

    return () => {
      isMounted = false
    }
  }, [selectedVillage?.id, shippingItemsKey])

  // Keep form's shippingFee and selected courier in sync with calculated courier options
  useEffect(() => {
    const currentCourier = values.shippingCourier
    const matchedOption = courierOptions.find(opt => opt.id === currentCourier)

    if (matchedOption) {
      if (matchedOption.available) {
        if (values.shippingFee !== matchedOption.fee) {
          handleChange({ target: { name: 'shippingFee', value: matchedOption.fee } })
        }
      } else {
        const firstAvailable = courierOptions.find(opt => opt.available)
        if (firstAvailable) {
          handleChange({ target: { name: 'shippingCourier', value: firstAvailable.id } })
          handleChange({ target: { name: 'shippingFee', value: firstAvailable.fee } })
        }
      }
    } else {
      const firstAvailable = courierOptions.find(opt => opt.available)
      const nextCourier = firstAvailable?.id || ''
      const nextFee = firstAvailable?.fee || 0
      if (values.shippingCourier !== nextCourier) {
        handleChange({ target: { name: 'shippingCourier', value: nextCourier } })
      }
      if (values.shippingFee !== nextFee) {
        handleChange({ target: { name: 'shippingFee', value: nextFee } })
      }
    }
  }, [courierOptions, values.shippingCourier, values.shippingFee, handleChange])

  const shippingFee = Number(values.shippingFee || 0)
  const finalTotal = useMemo(() => totalPrice + shippingFee, [totalPrice, shippingFee])

  const handleSelectCourier = useCallback(
    (courierId, fee) => {
      handleChange({ target: { name: 'shippingCourier', value: courierId } })
      handleChange({ target: { name: 'shippingFee', value: fee } })
    },
    [handleChange]
  )

  const onSubmit = useCallback(
    async formValues => {
      setIsProcessing(true)
      setOrderError(null)

      let orderPayload = null
      let idempotencyKey = ''

      const currentValues = formValues || values

      const clearPurchasedItems = () => {
        if (isBuyNow) {
          clearBuyNow()
        } else {
          removeItemsByKeys(checkoutItems.map(it => getItemKey(it)))
        }
      }

      const handlePaymentFlow = async (resultOrder) => {
        // Save address to user profile dynamically
        try {
          const newAddressObj = {
            receiverName: currentValues.receiverName,
            shippingPhone: currentValues.shippingPhone,
            addressDetail: currentValues.addressDetail,
            province: currentValues.province,
            city: currentValues.city,
            subdistrict: currentValues.subdistrict,
            kelurahan: currentValues.kelurahan,
            postalCode: currentValues.postalCode,
            latitude: currentValues.latitude,
            longitude: currentValues.longitude,
          }
          const serializedAddress = JSON.stringify(newAddressObj)
          const profileResult = await updateProfile({
            name: user?.name || currentValues.receiverName,
            phone: user?.phone || currentValues.shippingPhone,
            address: serializedAddress,
          })
          if (profileResult.success && profileResult.user) {
            setAuth(profileResult.user)
          }
        } catch (profileErr) {
          console.error('Failed to auto-save address to user profile:', profileErr)
        }

        if (currentValues.paymentMethod === 'midtrans' && resultOrder.snapToken) {
          // 4. Trigger Midtrans Snap payment
          const isSnapLoaded = await loadMidtransSnap()
          if (!isSnapLoaded) {
            setOrderError('Gagal memuat sistem pembayaran Midtrans. Silakan coba lagi.')
            setIsProcessing(false)
            scrollToError()
            return
          }

          window.snap.pay(resultOrder.snapToken, {
            onSuccess: () => {
              clearPurchasedItems()
              navigate('/shop/order-success', {
                state: { orderId: resultOrder.order.id },
              })
            },
            onPending: () => {
              clearPurchasedItems()
              navigate('/shop/order-success', {
                state: { orderId: resultOrder.order.id, isPending: true },
              })
            },
            onError: err => {
              console.error('Midtrans payment error:', err)
              setOrderError('Pembayaran gagal atau dibatalkan.')
              setIsProcessing(false)
              scrollToError()
            },
            onClose: () => {
              clearPurchasedItems()
              navigate(`/shop/order/${resultOrder.order.id}`, {
                state: { isPending: true },
              })
            },
          })
        } else {
          // Cash / Virtual Account Transfer / QRIS success
          clearPurchasedItems()
          navigate('/shop/order-success', {
            state: { orderId: resultOrder.order.id },
          })
        }
      }

      try {
        // 0. Ensure cart has items
        if (!checkoutItems || checkoutItems.length === 0) {
          setOrderError('Keranjang belanja kosong. Silakan pilih produk terlebih dahulu.')
          setIsProcessing(false)
          scrollToError()
          return
        }

        // 1. Cart checkout: sync the FULL local cart so unselected items are never dropped from the server cart
        //    (Buy Now does not use the cart, so no sync is needed)
        if (!isBuyNow) {
          const syncResult = await syncCartToBackend(items)
          if (!syncResult.success) {
            setOrderError(syncResult.error || 'Gagal menyinkronkan keranjang belanja ke server.')
            setIsProcessing(false)
            scrollToError()
            return
          }
        }

        const matchedCourier = courierOptions.find(o => o.id === currentValues.shippingCourier && o.available)
        if (!matchedCourier || !selectedVillage) {
          setOrderError(shippingRateError || 'Silakan pilih kelurahan dan kurir pengiriman terlebih dahulu.')
          setIsProcessing(false)
          scrollToError()
          return
        }

        // 2. Prepare structured order payload
        orderPayload = {
          receiverName: currentValues.receiverName?.trim(),
          shippingPhone: currentValues.shippingPhone?.trim(),
          addressDetail: currentValues.addressDetail?.trim(),
          province: currentValues.province?.trim(),
          city: currentValues.city?.trim(),
          villageId: selectedVillage.id,
          latitude: currentValues.latitude ? String(currentValues.latitude).trim() : null,
          longitude: currentValues.longitude ? String(currentValues.longitude).trim() : null,
          shippingCourier: matchedCourier.courier,
          shippingService: matchedCourier.service,
          shippingFee: matchedCourier.fee,
          paymentMethod:
            currentValues.paymentMethod === 'transfer'
              ? `TRANSFER_${currentValues.selectedBank.toUpperCase()}`
              : currentValues.paymentMethod.toUpperCase(),
          // Server builds the order only from these items (price & stock re-checked server-side).
          // Cart checkout takes quantity from the server cart; Buy Now sends it explicitly.
          items: checkoutItems.map(it => ({
            productId: String(it.id),
            variantId: it.variantId || null,
            ...(isBuyNow && { quantity: it.quantity }),
          })),
          ...(isBuyNow && { buyNow: true }),
        }

        // 3. Create order with Idempotency Key protection
        idempotencyKey = window.crypto?.randomUUID
          ? window.crypto.randomUUID()
          : `idempotency-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const orderResult = await createOrder(orderPayload, idempotencyKey)

        if (orderResult.success) {
          await handlePaymentFlow(orderResult)
        } else if (orderResult.code === 'SHIPPING_FEE_CHANGED' && orderResult.newShippingFee) {
          // Auto-adjust shipping fee and immediately auto-retry without showing red error message
          const adjustedFee = Number(orderResult.newShippingFee)
          setValuesRef.current?.(prev => ({
            ...prev,
            shippingFee: adjustedFee,
          }))
          const retryPayload = {
            ...orderPayload,
            shippingFee: adjustedFee,
          }
          const retryResult = await createOrder(retryPayload, `${idempotencyKey}-retry`)
          if (retryResult.success) {
            await handlePaymentFlow(retryResult)
          } else {
            setOrderError(retryResult.error || 'Gagal membuat pesanan')
            scrollToError()
          }
        } else {
          if (orderResult.errors && Array.isArray(orderResult.errors)) {
            const validationMsg = orderResult.errors
              .map(err => `${err.field}: ${err.message}`)
              .join(', ')
            setOrderError(`Validasi Gagal - ${validationMsg}`)
          } else {
            setOrderError(orderResult.error || 'Gagal membuat pesanan')
          }
          scrollToError()
        }
      } catch (error) {
        logError('Checkout error', error)
        if (error.code === 'SHIPPING_FEE_CHANGED' && error.data?.newShippingFee) {
          // Auto-adjust and auto-retry without blocking user with error message
          try {
            const adjustedFee = Number(error.data.newShippingFee)
            setValuesRef.current?.(prev => ({
              ...prev,
              shippingFee: adjustedFee,
            }))
            const retryPayload = {
              ...(orderPayload || {}),
              shippingFee: adjustedFee,
            }
            const retryKey = idempotencyKey ? `${idempotencyKey}-auto` : `idempotency-${Date.now()}`
            const retryResult = await createOrder(retryPayload, retryKey)
            if (retryResult.success) {
              await handlePaymentFlow(retryResult)
              return
            }
          } catch (retryErr) {
            console.error('Auto-retry checkout error:', retryErr)
          }
        }
        if (error.isAuthError || error.message?.includes('token') || error.message?.includes('authentication')) {
          setOrderError('Sesi login Anda belum aktif atau telah berakhir. Mengarahkan ke halaman login...')
          scrollToError()
          setTimeout(() => {
            navigate('/shop/login', { state: { from: { pathname: '/shop/checkout' } } })
          }, 1500)
          return
        }
        if (error.errors && Array.isArray(error.errors)) {
          const validationMsg = error.errors.map(err => `${err.field}: ${err.message}`).join(', ')
          setOrderError(`Validasi Gagal - ${validationMsg}`)
        } else {
          setOrderError(error.message || 'Terjadi kesalahan saat checkout')
        }
        scrollToError()
      } finally {
        setIsProcessing(false)
      }
    },
    [
      items,
      isBuyNow,
      checkoutItems,
      clearBuyNow,
      removeItemsByKeys,
      navigate,
      setAuth,
      user?.name,
      user?.phone,
      scrollToError,
      courierOptions,
      selectedVillage,
      shippingRateError,
      values,
    ]
  )
  onSubmitRef.current = onSubmit

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <ShopNavigation />
        <main className="container-custom py-16 md:py-24">
          <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-700">
              <Icon name="ShoppingCart" size={36} />
            </div>
            <h2 className="text-2xl font-heading font-medium text-gray-900 mb-3 tracking-tight">
              Keranjang Belanja Masih Kosong
            </h2>
            <p className="text-sm font-body text-gray-500 mb-8 leading-relaxed">
              {items.length === 0
                ? 'Belum ada produk di dalam keranjang Anda. Silakan jelajahi katalog toko kami untuk mulai berbelanja.'
                : 'Anda belum memilih produk untuk di-checkout. Silakan buka keranjang belanja dan centang produk yang ingin Anda beli.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/shop" className="w-full">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full uppercase tracking-wider py-3 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="ArrowLeft" size={16} />
                  <span>Mulai Belanja</span>
                </Button>
              </Link>
              {items.length > 0 && (
                <Link to="/shop/cart" className="w-full">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full uppercase tracking-wider py-3 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Icon name="ShoppingCart" size={16} />
                    <span>Lihat Keranjang</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Require login before completing checkout
  if (!user) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <ShopNavigation />
        <main className="container-custom py-16 md:py-24">
          <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
              <Icon name="Users" size={36} />
            </div>
            <h2 className="text-2xl font-heading font-medium text-gray-900 mb-3 tracking-tight">
              Masuk untuk Melanjutkan Checkout
            </h2>
            <p className="text-sm font-body text-gray-500 mb-8 leading-relaxed">
              Silakan masuk ke akun Anda agar pesanan dan riwayat transaksi tersimpan dengan aman di akun Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/shop/login"
                state={{ from: { pathname: '/shop/checkout' } }}
                className="w-full"
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full uppercase tracking-wider py-3 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="Users" size={16} />
                  <span>Masuk ke Akun</span>
                </Button>
              </Link>
              <Link to="/shop" className="w-full">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full uppercase tracking-wider py-3 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="ArrowLeft" size={16} />
                  <span>Kembali Belanja</span>
                </Button>
              </Link>
            </div>
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
                {/* Nama Penerima */}
                <div>
                  <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                    Nama Penerima
                  </label>
                  <input
                    type="text"
                    name="receiverName"
                    value={values.receiverName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                    placeholder="Nama lengkap penerima"
                    disabled={isSubmitting || isProcessing}
                  />
                  {errors.receiverName && touched.receiverName && (
                    <p className="mt-1 text-xs text-red-500">{errors.receiverName}</p>
                  )}
                </div>

                {/* Nomor Telepon */}
                <div>
                  <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    name="shippingPhone"
                    value={values.shippingPhone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                    placeholder="Contoh: 081234567890"
                    disabled={isSubmitting || isProcessing}
                  />
                  {errors.shippingPhone && touched.shippingPhone && (
                    <p className="mt-1 text-xs text-red-500">{errors.shippingPhone}</p>
                  )}
                </div>

                {/* Detail Alamat */}
                <div>
                  <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                    Alamat Lengkap (Jalan, RT/RW, No. Rumah)
                  </label>
                  <textarea
                    name="addressDetail"
                    value={values.addressDetail}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors resize-none"
                    placeholder="Tulis detail alamat pengiriman Anda dengan jelas"
                    disabled={isSubmitting || isProcessing}
                  />
                  {errors.addressDetail && touched.addressDetail && (
                    <p className="mt-1 text-xs text-red-500">{errors.addressDetail}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Provinsi */}
                  <div>
                    <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                      Provinsi
                    </label>
                    <select
                      name="province"
                      value={values.province}
                      onChange={e => {
                        const selectedOption = e.target.options[e.target.selectedIndex]
                        const id = selectedOption.getAttribute('data-id')

                        handleChange(e)

                        if (id) {
                          fetchCities(id)
                        }

                        setSubdistricts([])
                        setVillages([])
                        handleChange({ target: { name: 'city', value: '' } })
                        handleChange({ target: { name: 'subdistrict', value: '' } })
                        handleChange({ target: { name: 'kelurahan', value: '' } })
                        handleChange({ target: { name: 'postalCode', value: '' } })
                      }}
                      onBlur={handleBlur}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors bg-white appearance-none"
                      disabled={isSubmitting || isProcessing}
                    >
                      <option value="" data-id="">
                        Pilih Provinsi
                      </option>
                      {provinces.map(prov => (
                        <option key={prov.id} value={prov.name} data-id={prov.id}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                    {errors.province && touched.province && (
                      <p className="mt-1 text-xs text-red-500">{errors.province}</p>
                    )}
                  </div>

                  {/* Kota */}
                  <div>
                    <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                      Kota / Kabupaten
                    </label>
                    <select
                      name="city"
                      value={values.city}
                      onChange={e => {
                        const selectedOption = e.target.options[e.target.selectedIndex]
                        const id = selectedOption.getAttribute('data-id')

                        handleChange(e)

                        if (id) {
                          fetchSubdistricts(id)
                        }

                        setSubdistricts([])
                        setVillages([])
                        handleChange({ target: { name: 'subdistrict', value: '' } })
                        handleChange({ target: { name: 'kelurahan', value: '' } })
                        handleChange({ target: { name: 'postalCode', value: '' } })
                      }}
                      onBlur={handleBlur}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors bg-white appearance-none"
                      disabled={isSubmitting || isProcessing || cities.length === 0}
                    >
                      <option value="" data-id="">
                        Pilih Kota/Kabupaten
                      </option>
                      {cities.map(city => (
                        <option key={city.id} value={city.name} data-id={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                    {errors.city && touched.city && (
                      <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Kecamatan */}
                  <div>
                    <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                      Kecamatan
                    </label>
                    <select
                      name="subdistrict"
                      value={values.subdistrict}
                      onChange={e => {
                        const selectedOption = e.target.options[e.target.selectedIndex]
                        const id = selectedOption.getAttribute('data-id')

                        handleChange(e)

                        if (id) {
                          fetchVillages(id)
                        }

                        setVillages([])
                        handleChange({ target: { name: 'kelurahan', value: '' } })
                        handleChange({ target: { name: 'postalCode', value: '' } })
                      }}
                      onBlur={handleBlur}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors bg-white appearance-none"
                      disabled={isSubmitting || isProcessing || subdistricts.length === 0}
                    >
                      <option value="" data-id="">
                        Pilih Kecamatan
                      </option>
                      {subdistricts.map(sub => (
                        <option key={sub.id} value={sub.name} data-id={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                    {errors.subdistrict && touched.subdistrict && (
                      <p className="mt-1 text-xs text-red-500">{errors.subdistrict}</p>
                    )}
                  </div>

                  {/* Kelurahan */}
                  <div>
                    <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                      Kelurahan
                    </label>
                    <select
                      name="kelurahan"
                      value={values.kelurahan}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors bg-white appearance-none"
                      disabled={isSubmitting || isProcessing || villages.length === 0}
                    >
                      <option value="">Pilih Kelurahan</option>
                      {villages.map(vil => (
                        <option key={vil.id} value={vil.name}>
                          {vil.name}
                        </option>
                      ))}
                    </select>
                    {errors.kelurahan && touched.kelurahan && (
                      <p className="mt-1 text-xs text-red-500">{errors.kelurahan}</p>
                    )}
                  </div>
                </div>

                {/* Kode Pos (otomatis dari kelurahan) */}
                <div>
                  <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={values.postalCode}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 bg-gray-50 text-gray-700 focus:outline-none"
                    placeholder="Terisi otomatis setelah memilih kelurahan"
                  />
                  {errors.postalCode && touched.postalCode && (
                    <p className="mt-1 text-xs text-red-500">{errors.postalCode}</p>
                  )}
                </div>

                {/* Interactive Map Picker */}
                <CheckoutMapPicker values={values} handleChange={handleChange} />

                {/* Kurir Pengiriman */}
                <CheckoutCourierSelector
                  courierOptions={courierOptions}
                  selectedCourier={values.shippingCourier}
                  onSelectCourier={handleSelectCourier}
                  error={shippingRateError || errors.shippingCourier}
                  isLoading={isLoadingRates}
                  emptyMessage={
                    selectedVillage ? null : 'Pilih kelurahan terlebih dahulu untuk melihat tarif kurir.'
                  }
                />

                {/* Payment Method */}
                <CheckoutPaymentSelector
                  paymentMethod={values.paymentMethod}
                  selectedBank={values.selectedBank}
                  onChange={handleChange}
                  isSubmitting={isSubmitting || isProcessing}
                />

                {/* Error Banner Above Checkout Button */}
                {orderError && (
                  <div
                    id="checkout-error-banner"
                    className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 text-sm mt-6"
                  >
                    <Icon name="AlertCircle" size={20} className="shrink-0 mt-0.5 text-red-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Gagal Memproses Pesanan</p>
                      <p className="mt-0.5 text-red-700">{orderError}</p>
                    </div>
                  </div>
                )}

                {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-800 text-sm mt-6">
                    <Icon name="AlertCircle" size={20} className="shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-900">
                        Periksa Kembali Data Pengiriman
                      </p>
                      <p className="mt-0.5 text-xs text-amber-700">
                        Mohon lengkapi kolom yang bertanda merah sebelum melanjutkan checkout.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex flex-col items-center">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSubmitting || isProcessing}
                    className="py-3.5 px-10 text-sm font-semibold tracking-wider uppercase rounded-lg shadow-sm hover:shadow transition-all w-full max-w-md mx-auto flex items-center justify-center"
                  >
                    {isSubmitting || isProcessing ? (
                      <>
                        <Icon name="Loader2" size={18} className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Checkout'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <CheckoutOrderSummary
              items={checkoutItems}
              totalPrice={totalPrice}
              shippingFee={shippingFee}
              finalTotal={finalTotal}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default CheckoutPage
