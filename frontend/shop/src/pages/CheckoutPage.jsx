import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { useCartStore } from '../stores/cartStore'
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
import { apiClient } from '../config/api'
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
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { user, setAuth } = useAuthStore()
  const [orderError, setOrderError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [postalCodeOptions, setPostalCodeOptions] = useState([])
  const [isLoadingPostalCodes, setIsLoadingPostalCodes] = useState(false)
  const [isManualPostalCode, setIsManualPostalCode] = useState(false)
  const [serverCourierOptions, setServerCourierOptions] = useState(null)
  const setValuesRef = useRef(null)

  const totalPrice = useMemo(() => getTotalPrice(), [getTotalPrice])

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
      shippingCourier: 'JNE',
      shippingFee: 15000,
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

  const onSubmit = useCallback(
    async values => {
      setIsProcessing(true)
      setOrderError(null)

      try {
        // 0. Ensure cart has items
        if (!items || items.length === 0) {
          setOrderError('Keranjang belanja kosong. Silakan pilih produk terlebih dahulu.')
          setIsProcessing(false)
          scrollToError()
          return
        }

        // 1. Sync local cart to backend
        const syncResult = await syncCartToBackend(items)
        if (!syncResult.success) {
          setOrderError(syncResult.error || 'Gagal menyinkronkan keranjang belanja ke server.')
          setIsProcessing(false)
          scrollToError()
          return
        }

        // 2. Prepare structured order payload
        const orderPayload = {
          receiverName: values.receiverName?.trim(),
          shippingPhone: values.shippingPhone?.trim(),
          addressDetail: values.addressDetail?.trim(),
          province: values.province?.trim(),
          city: values.city?.trim(),
          subdistrict: values.subdistrict?.trim(),
          kelurahan: values.kelurahan?.trim(),
          postalCode: values.postalCode?.trim(),
          latitude: values.latitude ? String(values.latitude).trim() : null,
          longitude: values.longitude ? String(values.longitude).trim() : null,
          shippingCourier: values.shippingCourier,
          shippingFee: Number(values.shippingFee),
          paymentMethod:
            values.paymentMethod === 'transfer'
              ? `TRANSFER_${values.selectedBank.toUpperCase()}`
              : values.paymentMethod.toUpperCase(),
        }

        // 3. Create order with Idempotency Key protection
        const idempotencyKey = window.crypto?.randomUUID
          ? window.crypto.randomUUID()
          : `idempotency-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const orderResult = await createOrder(orderPayload, idempotencyKey)

        if (orderResult.success) {
          // Save address to user profile dynamically
          try {
            const newAddressObj = {
              receiverName: values.receiverName,
              shippingPhone: values.shippingPhone,
              addressDetail: values.addressDetail,
              province: values.province,
              city: values.city,
              subdistrict: values.subdistrict,
              kelurahan: values.kelurahan,
              postalCode: values.postalCode,
              latitude: values.latitude,
              longitude: values.longitude,
            }
            const serializedAddress = JSON.stringify(newAddressObj)
            const profileResult = await updateProfile({
              name: user?.name || values.receiverName,
              phone: user?.phone || values.shippingPhone,
              address: serializedAddress,
            })
            if (profileResult.success && profileResult.user) {
              setAuth(profileResult.user)
            }
          } catch (profileErr) {
            console.error('Failed to auto-save address to user profile:', profileErr)
          }

          if (values.paymentMethod === 'midtrans' && orderResult.snapToken) {
            // 4. Trigger Midtrans Snap payment
            const isSnapLoaded = await loadMidtransSnap()
            if (!isSnapLoaded) {
              setOrderError('Gagal memuat sistem pembayaran Midtrans. Silakan coba lagi.')
              setIsProcessing(false)
              scrollToError()
              return
            }

            window.snap.pay(orderResult.snapToken, {
              onSuccess: () => {
                clearCart()
                navigate('/shop/order-success', {
                  state: { orderId: orderResult.order.id },
                })
              },
              onPending: () => {
                clearCart()
                navigate('/shop/order-success', {
                  state: { orderId: orderResult.order.id, isPending: true },
                })
              },
              onError: err => {
                console.error('Midtrans payment error:', err)
                setOrderError('Pembayaran gagal atau dibatalkan.')
                setIsProcessing(false)
                scrollToError()
              },
              onClose: () => {
                clearCart()
                navigate(`/shop/order/${orderResult.order.id}`, {
                  state: { isPending: true },
                })
              },
            })
          } else {
            // Cash / Virtual Account Transfer / QRIS success
            clearCart()
            navigate('/shop/order-success', {
              state: { orderId: orderResult.order.id },
            })
          }
        } else {
          if (orderResult.code === 'SHIPPING_FEE_CHANGED' && orderResult.newShippingFee) {
            setValuesRef.current?.(prev => ({
              ...prev,
              shippingFee: Number(orderResult.newShippingFee),
            }))
            setOrderError(orderResult.error)
          } else if (orderResult.errors && Array.isArray(orderResult.errors)) {
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
          setValuesRef.current?.(prev => ({
            ...prev,
            shippingFee: Number(error.data.newShippingFee),
          }))
          setOrderError(error.message)
        } else if (error.errors && Array.isArray(error.errors)) {
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
    [items, clearCart, navigate, setAuth, user?.name, user?.phone, scrollToError]
  )

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, setValues } = useForm(
    initialValues,
    validateCheckoutForm,
    onSubmit
  )
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

  const fetchPostalCodeOptions = useCallback(
    async (kelurahanName, subdistrictName, cityName, provinceName) => {
      if (!kelurahanName && !subdistrictName) {
        setPostalCodeOptions([])
        return
      }

      setIsLoadingPostalCodes(true)
      try {
        const res = await apiClient.get('/location/postal-code', {
          kelurahan: kelurahanName || '',
          subdistrict: subdistrictName || '',
          city: cityName || values.city || '',
          province: provinceName || values.province || '',
        })

        const options = (res?.data || []).map(item => ({
          code: item.postalCode,
          label: item.label,
        }))

        setPostalCodeOptions(options)

        // Auto-select logic
        if (options.length === 1) {
          handleChange({ target: { name: 'postalCode', value: options[0].code } })
        } else if (options.length > 1) {
          if (!values.postalCode || !options.some(o => o.code === values.postalCode)) {
            handleChange({ target: { name: 'postalCode', value: options[0].code } })
          }
        }
      } catch (err) {
        console.error('Failed to resolve postal code options:', err)
        setPostalCodeOptions([])
      } finally {
        setIsLoadingPostalCodes(false)
      }
    },
    [handleChange, values.city, values.postalCode, values.province]
  )

  // Auto-resolve postal codes if kelurahan and subdistrict are pre-filled
  useEffect(() => {
    if (
      values.kelurahan &&
      values.subdistrict &&
      postalCodeOptions.length === 0 &&
      !isManualPostalCode
    ) {
      fetchPostalCodeOptions(values.kelurahan, values.subdistrict, values.city, values.province)
    }
  }, [
    values.kelurahan,
    values.subdistrict,
    values.city,
    values.province,
    postalCodeOptions.length,
    isManualPostalCode,
    fetchPostalCodeOptions,
  ])

  // Calculate total weight of the cart in kilograms
  const totalWeight = useMemo(() => {
    return items.reduce((sum, item) => {
      const name = item.name?.toLowerCase() || ''
      let weight = 1.0 // default 1 kg
      if (
        name.includes('perkakas') ||
        name.includes('mesin') ||
        name.includes('motor') ||
        name.includes('bor')
      ) {
        weight = 2.0
      } else if (name.includes('kecil') || name.includes('obeng')) {
        weight = 0.5
      }
      return sum + item.quantity * weight
    }, 0)
  }, [items])

  // Fetch live shipping rates from backend API
  useEffect(() => {
    if (!values.province || !values.city) {
      setServerCourierOptions(null)
      return
    }

    let isMounted = true
    getShippingRates({
      city: values.city,
      province: values.province,
      weight: Math.round(totalWeight * 1000),
    }).then(result => {
      if (isMounted && result?.options) {
        setServerCourierOptions(result.options)
      }
    })

    return () => {
      isMounted = false
    }
  }, [values.province, values.city, totalWeight])

  // Calculate dynamic courier shipping fees based on server rates with local fallback
  const courierOptions = useMemo(() => {
    if (serverCourierOptions && serverCourierOptions.length > 0) {
      return serverCourierOptions
    }

    if (!values.province || !values.city) {
      return [
        { id: 'JNE', name: 'JNE Express', fee: 15000, desc: '2-3 hari kerja', available: true },
        { id: 'J&T', name: 'J&T Express', fee: 18000, desc: '2-4 hari kerja', available: true },
        { id: 'POS', name: 'Pos Indonesia', fee: 12000, desc: '3-5 hari kerja', available: true },
        {
          id: 'GOSEND',
          name: 'GoSend',
          fee: 25000,
          desc: 'Same Day (Khusus Tangerang)',
          available: false,
        },
      ]
    }

    const prov = values.province.toUpperCase()
    const cityName = values.city.toUpperCase()
    const isTangerangArea = cityName.includes('TANGERANG')

    let jneRate = 35000
    let jntRate = 38000
    let posRate = 30000

    if (cityName.includes('TANGERANG')) {
      jneRate = 8000
      jntRate = 9000
      posRate = 7000
    } else if (
      prov.includes('BANTEN') ||
      prov.includes('DKI JAKARTA') ||
      prov.includes('JAWA BARAT')
    ) {
      jneRate = 12000
      jntRate = 13000
      posRate = 11000
    } else if (
      prov.includes('JAWA TENGAH') ||
      prov.includes('YOGYAKARTA') ||
      prov.includes('JAWA TIMUR')
    ) {
      jneRate = 18000
      jntRate = 20000
      posRate = 16000
    }

    const weightKg = Math.max(1, Math.ceil(totalWeight))

    return [
      {
        id: 'JNE',
        name: 'JNE Express',
        fee: jneRate * weightKg,
        desc: `2-3 hari kerja (${weightKg} kg)`,
        available: true,
      },
      {
        id: 'J&T',
        name: 'J&T Express',
        fee: jntRate * weightKg,
        desc: `2-4 hari kerja (${weightKg} kg)`,
        available: true,
      },
      {
        id: 'POS',
        name: 'Pos Indonesia',
        fee: posRate * weightKg,
        desc: `3-5 hari kerja (${weightKg} kg)`,
        available: true,
      },
      {
        id: 'GOSEND',
        name: 'GoSend',
        fee: 25000,
        desc: isTangerangArea ? 'Same Day (Max 20kg)' : 'Lokasi di luar jangkauan GoSend',
        available: isTangerangArea && weightKg <= 20,
      },
    ]
  }, [serverCourierOptions, values.province, values.city, totalWeight])

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
      if (firstAvailable) {
        handleChange({ target: { name: 'shippingCourier', value: firstAvailable.id } })
        handleChange({ target: { name: 'shippingFee', value: firstAvailable.fee } })
      }
    }
  }, [courierOptions, values.shippingCourier, values.shippingFee, handleChange])

  const shippingFee = Number(values.shippingFee || 15000)
  const finalTotal = useMemo(() => totalPrice + shippingFee, [totalPrice, shippingFee])

  const handleSelectCourier = useCallback(
    (courierId, fee) => {
      handleChange({ target: { name: 'shippingCourier', value: courierId } })
      handleChange({ target: { name: 'shippingFee', value: fee } })
    },
    [handleChange]
  )

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
                        setPostalCodeOptions([])
                        setIsManualPostalCode(false)
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
                        setPostalCodeOptions([])
                        setIsManualPostalCode(false)
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
                        setPostalCodeOptions([])
                        setIsManualPostalCode(false)
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
                      onChange={e => {
                        const selectedName = e.target.value
                        handleChange(e)
                        setIsManualPostalCode(false)

                        if (selectedName && values.subdistrict) {
                          handleChange({ target: { name: 'postalCode', value: '' } })
                          fetchPostalCodeOptions(
                            selectedName,
                            values.subdistrict,
                            values.city,
                            values.province
                          )
                        } else {
                          setPostalCodeOptions([])
                          handleChange({ target: { name: 'postalCode', value: '' } })
                        }
                      }}
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

                {/* Kode Pos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-body font-medium text-gray-900 uppercase tracking-wider">
                      Kode Pos
                    </label>
                    {!isManualPostalCode ? (
                      <button
                        type="button"
                        onClick={() => setIsManualPostalCode(true)}
                        className="text-[11px] text-primary-700 hover:text-primary-900 hover:underline font-body transition-colors"
                      >
                        Input Manual
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsManualPostalCode(false)}
                        className="text-[11px] text-primary-700 hover:text-primary-900 hover:underline font-body transition-colors"
                      >
                        Pilih dari Dropdown
                      </button>
                    )}
                  </div>

                  {isLoadingPostalCodes ? (
                    <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 bg-gray-50 text-gray-600 text-xs font-body">
                      <Icon name="Loader2" size={16} className="animate-spin text-gray-600" />
                      <span>Mencari kode pos wilayah {values.kelurahan || values.subdistrict}...</span>
                    </div>
                  ) : !isManualPostalCode ? (
                    <select
                      name="postalCode"
                      value={values.postalCode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors bg-white appearance-none"
                      disabled={isSubmitting || isProcessing}
                    >
                      <option value="">
                        {postalCodeOptions.length === 0
                          ? values.kelurahan
                            ? 'Kode pos tidak ditemukan otomatis (klik Input Manual)'
                            : 'Pilih Kelurahan terlebih dahulu'
                          : '-- Pilih Kode Pos --'}
                      </option>
                      {postalCodeOptions.map(opt => (
                        <option key={opt.code} value={opt.code}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="postalCode"
                      maxLength="5"
                      value={values.postalCode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                      placeholder="Contoh: 10330 (5 digit angka)"
                      disabled={isSubmitting || isProcessing}
                    />
                  )}

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
                  error={errors.shippingCourier}
                  touched={touched.shippingCourier}
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
                      <p className="font-semibold text-amber-900">Periksa Kembali Data Pengiriman</p>
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
              items={items}
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
