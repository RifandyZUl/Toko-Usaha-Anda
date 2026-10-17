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
import ShopNavigation from '../components/ShopNavigation'
import Loading from '../components/Loading'
import { formatCurrency } from '../utils/format'
import { logError } from '../utils/logger'
import { updateProfile } from '../services/auth'

/**
 * Dynamic script loader for Midtrans Snap JS
 */
const loadMidtransSnap = () => {
  return new Promise(resolve => {
    if (window.snap) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY
    const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true'
    const snapUrl = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'

    script.src = snapUrl
    script.setAttribute('data-client-key', clientKey)
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// Helper to clean up City / Regency prefixes from administrative names in Indonesia
function cleanCityName(cityName) {
  if (!cityName) return ''
  return cityName.replace(/^(KOTA ADM\.|KAB\. ADM\.|KOTA|KABUPATEN|KAB\.)\s+/i, '').trim()
}

// Helper to clean up address detail from common noisy suffixes like house numbers, RT/RW, blocks
function cleanAddressDetail(addr) {
  if (!addr) return ''
  return (
    addr
      // Remove RT/RW patterns (e.g., RT 02/RW 03, RT 02 RW 03, RT.02/RW.03, RT/RW: 02/03)
      .replace(/rt\s*\d+\s*[-/]?\s*rw\s*\d+/gi, '')
      .replace(/rt\.\s*\d+\s*[-/]?\s*rw\.\s*\d+/gi, '')
      .replace(/rt\/rw\s*\d+\/\d+/gi, '')
      .replace(/rt\/rw\s*:\s*\d+\/\d+/gi, '')
      .replace(/\brt\b\s*\d+/gi, '')
      .replace(/\brw\b\s*\d+/gi, '')
      // Remove house/kav/block numbers (e.g., No. 12, No 12, Blok A-12, Kav. 12, Lt. 3)
      .replace(/no\.\s*\d+/gi, '')
      .replace(/no\s*\d+/gi, '')
      .replace(/blok\s*[a-z0-9-]+/gi, '')
      .replace(/kav\.\s*[a-z0-9-]+/gi, '')
      .replace(/lantai\s*\d+/gi, '')
      .replace(/lt\.\s*\d+/gi, '')
      .trim()
  )
}

function finalClean(str) {
  if (!str) return ''
  return str
    .replace(/^[\s,]+|[\s,]+$/g, '') // remove leading/trailing commas and spaces
    .replace(/,\s*,/g, ',') // remove duplicate commas
    .replace(/\s+/g, ' ') // normalize spaces
    .trim()
}

// Helper to extract possible street name (e.g., "Jl. Merpati", "Jalan Merpati", "Gg. Kancil", "Gang Kancil")
function extractStreetName(addr) {
  if (!addr) return ''
  const match = addr.match(/(?:jl\.|jalan|gg\.|gang)\s+([^,]+)/i)
  return match ? match[0].trim() : ''
}

// Progressive geocoder that queries Nominatim with fallback queries until a match is found
async function geocodeWithFallbacks(queries) {
  for (const q of queries) {
    if (!q || q.trim().length < 3) continue
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'TokoUsahaAndaCheckout/1.0',
        },
      })
      const json = await res.json()
      if (json && json.length > 0) {
        return {
          lat: json[0].lat,
          lng: json[0].lon,
          queryUsed: q,
        }
      }
    } catch (err) {
      console.error(`Geocoding failed for query: "${q}"`, err)
    }
  }
  return null
}

/**
 * Checkout Page - Elegant design inspired by Arhaus
 */
function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { user, setAuth } = useAuthStore()
  const [orderError, setOrderError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const totalPrice = useMemo(() => getTotalPrice(), [getTotalPrice])

  // Pre-fill form with user data if available
  const initialValues = useMemo(() => {
    let parsedAddress = {}
    if (user?.address) {
      try {
        parsedAddress = JSON.parse(user.address)
      } catch (e) {
        parsedAddress = { addressDetail: user.address }
      }
    }

    return {
      receiverName: parsedAddress.receiverName || user?.name || '',
      shippingPhone: parsedAddress.shippingPhone || user?.phone || '',
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
      paymentMethod: 'cod',
      selectedBank: 'bca',
    }
  }, [user])

  const onSubmit = useCallback(
    async values => {
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

        // 2. Prepare structured order payload
        const orderPayload = {
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
              },
              onClose: () => {
                clearCart()
                navigate('/shop/profile')
              },
            })
          } else {
            // Cash/Transfer success
            clearCart()
            navigate('/shop/order-success', {
              state: { orderId: orderResult.order.id },
            })
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
        }
      } catch (error) {
        logError('Checkout error', error)
        if (error.errors && Array.isArray(error.errors)) {
          const validationMsg = error.errors.map(err => `${err.field}: ${err.message}`).join(', ')
          setOrderError(`Validasi Gagal - ${validationMsg}`)
        } else {
          setOrderError(error.message || 'Terjadi kesalahan saat checkout')
        }
      } finally {
        setIsProcessing(false)
      }
    },
    [items, clearCart, navigate, setAuth, user?.name, user?.phone]
  )

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm(
    initialValues,
    validateCheckoutForm,
    onSubmit
  )

  const {
    provinces,
    cities,
    subdistricts,
    villages,
    fetchCities,
    fetchSubdistricts,
    fetchVillages,
    setCities,
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

  const fetchPostalCode = useCallback(
    async (kelurahanName, subdistrictName) => {
      try {
        const query = encodeURIComponent(`${kelurahanName} ${subdistrictName}`)
        const res = await fetch(`https://carikodepos.id/api/search?q=${query}`)
        const json = await res.json()
        if (json.success && json.data && json.data.length > 0) {
          const match =
            json.data.find(
              item =>
                item.type === 'postal' &&
                item.village?.name?.toLowerCase() === kelurahanName.toLowerCase() &&
                item.district?.name?.toLowerCase() === subdistrictName.toLowerCase()
            ) || json.data.find(item => item.type === 'postal')

          if (match && match.postalCode) {
            handleChange({ target: { name: 'postalCode', value: match.postalCode } })
          }
        }
      } catch (err) {
        console.error('Failed to fetch postal code:', err)
      }
    },
    [handleChange]
  )

  // Map-related refs and state
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerInstanceRef = useRef(null)
  const lastGeocodedAddressRef = useRef('')
  const [mapVisible, setMapVisible] = useState(!!values.latitude && !!values.longitude)
  const [mapOverrideVisible, setMapOverrideVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const preventSuggestionsRef = useRef(false)
  const searchContainerRef = useRef(null)

  const initMap = useCallback(
    (lat, lng) => {
      if (!window.L) return

      const parsedLat = parseFloat(lat) || -6.2088
      const parsedLng = parseFloat(lng) || 106.8456

      if (!mapInstanceRef.current) {
        if (!mapRef.current) return

        // Initialize map
        const map = window.L.map(mapRef.current).setView([parsedLat, parsedLng], 16)
        mapInstanceRef.current = map

        // Add Google Maps Roadmap tile layer
        window.L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: 'Map data &copy; Google',
        }).addTo(map)

        // Use default Unpkg Leaflet icons to avoid broken marker images in production bundler
        const DefaultIcon = window.L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })

        // Add draggable Marker
        const marker = window.L.marker([parsedLat, parsedLng], {
          draggable: true,
          icon: DefaultIcon,
        }).addTo(map)
        markerInstanceRef.current = marker

        // Handle marker dragend to update form coordinates
        marker.on('dragend', () => {
          const position = marker.getLatLng()
          handleChange({ target: { name: 'latitude', value: position.lat.toString() } })
          handleChange({ target: { name: 'longitude', value: position.lng.toString() } })
        })

        // Handle map click to reposition marker and update form coordinates
        map.on('click', e => {
          const { lat: clickLat, lng: clickLng } = e.latlng
          marker.setLatLng([clickLat, clickLng])
          handleChange({ target: { name: 'latitude', value: clickLat.toString() } })
          handleChange({ target: { name: 'longitude', value: clickLng.toString() } })
        })
      } else {
        // Reposition existing map and marker
        const map = mapInstanceRef.current
        const marker = markerInstanceRef.current

        map.setView([parsedLat, parsedLng], 16)
        marker.setLatLng([parsedLat, parsedLng])
      }
    },
    [handleChange]
  )

  // Geolocation trigger for manual activation
  const handleActivateMapManual = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude.toString()
          const lng = position.coords.longitude.toString()
          handleChange({ target: { name: 'latitude', value: lat } })
          handleChange({ target: { name: 'longitude', value: lng } })
          setMapOverrideVisible(true)
        },
        () => {
          // Fallback to Jakarta
          handleChange({ target: { name: 'latitude', value: '-6.2088' } })
          handleChange({ target: { name: 'longitude', value: '106.8456' } })
          setMapOverrideVisible(true)
        }
      )
    } else {
      handleChange({ target: { name: 'latitude', value: '-6.2088' } })
      handleChange({ target: { name: 'longitude', value: '106.8456' } })
      setMapOverrideVisible(true)
    }
  }, [handleChange])

  const handleSearchLocation = useCallback(async () => {
    if (!searchQuery || searchQuery.trim().length < 3) return
    try {
      const cleanedQuery = finalClean(cleanAddressDetail(searchQuery))
      const queries = [searchQuery, cleanedQuery]

      // If form fields are populated, append them as fallback search items
      if (values.province && values.city) {
        const cleanedCity = cleanCityName(values.city)
        if (values.kelurahan && values.subdistrict) {
          queries.push(
            finalClean(
              `${values.kelurahan}, ${values.subdistrict}, ${cleanedCity}, ${values.province}, Indonesia`
            )
          )
        }
        if (values.subdistrict) {
          queries.push(
            finalClean(`${values.subdistrict}, ${cleanedCity}, ${values.province}, Indonesia`)
          )
        }
        queries.push(finalClean(`${cleanedCity}, ${values.province}, Indonesia`))
        queries.push(finalClean(`${values.province}, Indonesia`))
      }

      const result = await geocodeWithFallbacks(queries)
      if (result) {
        handleChange({ target: { name: 'latitude', value: result.lat } })
        handleChange({ target: { name: 'longitude', value: result.lng } })

        if (mapInstanceRef.current) {
          initMap(result.lat, result.lng)
        }
      } else {
        alert('Lokasi tidak ditemukan. Silakan coba cari dengan kata kunci lain.')
      }
    } catch (err) {
      console.error('Search location error:', err)
    }
  }, [
    searchQuery,
    values.province,
    values.city,
    values.subdistrict,
    values.kelurahan,
    initMap,
    handleChange,
  ])

  // Fetch search suggestions (autocomplete) with debounce on searchQuery change
  useEffect(() => {
    if (preventSuggestionsRef.current) {
      preventSuggestionsRef.current = false
      return
    }

    if (!searchQuery || searchQuery.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true)
      try {
        const query = encodeURIComponent(searchQuery)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`,
          {
            headers: {
              'User-Agent': 'TokoUsahaAndaCheckout/1.0',
            },
          }
        )
        const json = await res.json()
        if (json && Array.isArray(json)) {
          setSuggestions(json)
          setShowSuggestions(json.length > 0)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch (err) {
        console.error('Fetch suggestions error:', err)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle click outside suggestions container to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = e => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Debounce geocoding when address fields change
  useEffect(() => {
    const isAddressFilled =
      values.province &&
      values.city &&
      values.subdistrict &&
      values.kelurahan &&
      values.addressDetail &&
      values.addressDetail.trim().length >= 10

    if (!isAddressFilled) {
      if (!values.latitude || !values.longitude) {
        setMapVisible(false)
      }
      return
    }

    setMapVisible(true)

    const fullAddress = `${values.addressDetail}, ${values.kelurahan}, ${values.subdistrict}, ${values.city}, ${values.province}, Indonesia`

    // Skip if address hasn't changed since last geocode
    if (fullAddress === lastGeocodedAddressRef.current) {
      return
    }

    // Pre-populate search query field for the user
    const displayQuery = finalClean(
      `${cleanAddressDetail(values.addressDetail)}, ${values.kelurahan}, ${values.subdistrict}, ${cleanCityName(values.city)}`
    )
    preventSuggestionsRef.current = true
    setSearchQuery(displayQuery || `${values.addressDetail}, ${values.kelurahan}`)

    const delayDebounceFn = setTimeout(async () => {
      const cleanedDetail = cleanAddressDetail(values.addressDetail)
      const cleanedCity = cleanCityName(values.city)
      const streetName = extractStreetName(values.addressDetail)

      const queries = []

      // 1. Cleaned detail + Kelurahan + Subdistrict + Cleaned City + Province
      if (cleanedDetail) {
        queries.push(
          finalClean(
            `${cleanedDetail}, ${values.kelurahan}, ${values.subdistrict}, ${cleanedCity}, ${values.province}, Indonesia`
          )
        )
      }
      // 2. Original full address
      queries.push(fullAddress)
      // 3. Extracted street + Kelurahan + Subdistrict + Cleaned City + Province
      if (streetName) {
        queries.push(
          finalClean(
            `${streetName}, ${values.kelurahan}, ${values.subdistrict}, ${cleanedCity}, ${values.province}, Indonesia`
          )
        )
      }
      // 4. Kelurahan + Subdistrict + Cleaned City + Province
      queries.push(
        finalClean(
          `${values.kelurahan}, ${values.subdistrict}, ${cleanedCity}, ${values.province}, Indonesia`
        )
      )
      // 5. Subdistrict + Cleaned City + Province
      queries.push(
        finalClean(`${values.subdistrict}, ${cleanedCity}, ${values.province}, Indonesia`)
      )
      // 6. Cleaned City + Province
      queries.push(finalClean(`${cleanedCity}, ${values.province}, Indonesia`))
      // 7. Province
      queries.push(finalClean(`${values.province}, Indonesia`))

      const result = await geocodeWithFallbacks(queries)
      if (result) {
        lastGeocodedAddressRef.current = fullAddress
        handleChange({ target: { name: 'latitude', value: result.lat } })
        handleChange({ target: { name: 'longitude', value: result.lng } })
        if (mapInstanceRef.current) {
          initMap(result.lat, result.lng)
        }
      }
    }, 1000)

    return () => clearTimeout(delayDebounceFn)
  }, [
    values.province,
    values.city,
    values.subdistrict,
    values.kelurahan,
    values.addressDetail,
    values.latitude,
    values.longitude,
    initMap,
    handleChange,
  ])

  // Initialize/update Leaflet map when mapVisible/mapOverrideVisible is true and mapRef is ready
  useEffect(() => {
    const showActiveMap = mapVisible || mapOverrideVisible
    if (showActiveMap && mapRef.current && window.L && !mapInstanceRef.current) {
      const lat = values.latitude || '-6.2088'
      const lng = values.longitude || '106.8456'
      // Timeout to ensure DOM element is rendered and has size before init
      const timer = setTimeout(() => {
        initMap(lat, lng)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [mapVisible, mapOverrideVisible, initMap, values.latitude, values.longitude])

  // Cleanup Leaflet map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerInstanceRef.current = null
      }
    }
  }, [])

  // Calculate total weight of the cart in kilograms (simulated based on category/name)
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

  // Calculate dynamic courier shipping fees based on origin, destination and weight
  const courierOptions = useMemo(() => {
    if (!values.province || !values.city) {
      // Fallback/standard static fees if address is not complete
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

    // Determine shipping rate tiers per kg (from Tangerang origin)
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
  }, [values.province, values.city, totalWeight])

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

                        setCities([])
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
                      onChange={e => {
                        const selectedName = e.target.value
                        handleChange(e)

                        if (selectedName && values.subdistrict) {
                          fetchPostalCode(selectedName, values.subdistrict)
                        } else {
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
                  <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={values.postalCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                    placeholder="Contoh: 40135"
                    disabled={isSubmitting || isProcessing}
                  />
                  {errors.postalCode && touched.postalCode && (
                    <p className="mt-1 text-xs text-red-500">{errors.postalCode}</p>
                  )}
                </div>

                {/* Google Maps Section */}
                <input type="hidden" name="latitude" value={values.latitude} />
                <input type="hidden" name="longitude" value={values.longitude} />

                {mapVisible || mapOverrideVisible ? (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                      Peta Lokasi Pengiriman (Google Maps)
                    </label>

                    {/* Search Input for Panning the Map */}
                    <div className="flex gap-2 mb-3">
                      <div ref={searchContainerRef} className="flex-grow relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => {
                            preventSuggestionsRef.current = false
                            setSearchQuery(e.target.value)
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSearchLocation()
                            } else if (e.key === 'Escape') {
                              setShowSuggestions(false)
                            }
                          }}
                          onFocus={() => {
                            if (suggestions.length > 0) {
                              setShowSuggestions(true)
                            }
                          }}
                          placeholder="Cari lokasi patokan, nama jalan, atau gedung..."
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none"
                        />

                        {/* Auto-complete Suggestions Dropdown */}
                        {showSuggestions && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                            {suggestions.map((item, idx) => (
                              <div
                                key={item.place_id || idx}
                                onClick={() => {
                                  preventSuggestionsRef.current = true
                                  setSearchQuery(item.display_name)
                                  setSuggestions([])
                                  setShowSuggestions(false)

                                  handleChange({ target: { name: 'latitude', value: item.lat } })
                                  handleChange({ target: { name: 'longitude', value: item.lon } })

                                  if (mapInstanceRef.current) {
                                    initMap(item.lat, item.lon)
                                  }
                                }}
                                className="px-4 py-2 text-xs font-body text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors text-left truncate"
                                title={item.display_name}
                              >
                                {item.display_name}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Loading indicator inside the container */}
                        {isLoadingSuggestions && (
                          <div className="absolute right-3 top-[10px] flex items-center">
                            <svg
                              className="animate-spin h-4 w-4 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSearchLocation}
                        className="px-4 py-2 h-[38px] text-xs uppercase tracking-wider whitespace-nowrap"
                      >
                        Cari
                      </Button>
                    </div>

                    <div
                      ref={mapRef}
                      className="w-full h-[300px] border border-gray-300 rounded shadow-sm z-0 relative"
                      style={{ minHeight: '300px' }}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[11px] text-gray-500 font-body flex items-center gap-1">
                        <Icon name="Info" size={12} className="inline text-gray-400" />
                        Silakan seret pin merah jika ingin menentukan titik kirim kurir yang lebih
                        akurat.
                      </p>
                      {mapOverrideVisible && !mapVisible && (
                        <button
                          type="button"
                          onClick={() => {
                            setMapOverrideVisible(false)
                            handleChange({ target: { name: 'latitude', value: '' } })
                            handleChange({ target: { name: 'longitude', value: '' } })
                          }}
                          className="text-[11px] text-red-600 hover:text-red-800 font-medium font-body underline"
                        >
                          Sembunyikan Peta
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                      Peta Lokasi Pengiriman
                    </label>
                    <div
                      onClick={handleActivateMapManual}
                      className="w-full h-[150px] border border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50/50 transition-all duration-200 relative overflow-hidden"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M0 0h80v80H0z' fill='%23fbfbfb'/%3E%3Cpath d='M0 10h80M0 20h80M0 30h80M0 40h80M0 50h80M0 60h80M0 70h80M10 0v80M20 0v80M30 0v80M40 0v80M50 0v80M60 0v80M70 0v80' stroke='%23f3f3f3' stroke-width='1'/%3E%3C/svg%3E")`,
                      }}
                    >
                      <div className="bg-white px-6 py-3 border border-gray-300 rounded shadow-sm hover:shadow-md transition-shadow flex items-center gap-2 text-sm font-heading font-medium text-gray-700 z-10">
                        <Icon name="Plus" size={16} className="text-gray-500" />
                        Tambah Lokasi
                      </div>
                    </div>
                  </div>
                )}

                {/* Kurir Pengiriman */}
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-xs font-heading font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                    Pilih Kurir Pengiriman
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {courierOptions.map(courier => {
                      const isSelected = values.shippingCourier === courier.id
                      return (
                        <div
                          key={courier.id}
                          onClick={() => {
                            if (courier.available) {
                              handleSelectCourier(courier.id, courier.fee)
                            }
                          }}
                          className={`flex flex-col justify-between p-4 border rounded-lg transition-all duration-200 ${
                            !courier.available
                              ? 'border-gray-100 bg-gray-50/50 opacity-40 cursor-not-allowed'
                              : isSelected
                                ? 'border-primary-500 bg-primary-50/20 ring-1 ring-primary-500 shadow-sm cursor-pointer'
                                : 'border-gray-200 hover:border-gray-400 bg-white cursor-pointer'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-heading font-semibold text-gray-900">
                                {courier.name}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-body mb-3">
                              {courier.desc}
                            </p>
                          </div>
                          {courier.available ? (
                            <p className="text-sm font-heading font-bold text-primary-600">
                              {formatCurrency(courier.fee)}
                            </p>
                          ) : (
                            <p className="text-[10px] font-heading font-semibold text-red-500 uppercase tracking-wider">
                              Tidak Tersedia
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {errors.shippingCourier && touched.shippingCourier && (
                    <p className="mt-1 text-xs text-red-500">{errors.shippingCourier}</p>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-heading font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Bank Transfer (Virtual Account) */}
                    <label
                      className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        values.paymentMethod === 'transfer'
                          ? 'border-primary-500 bg-primary-50/20 ring-1 ring-primary-500 shadow-sm'
                          : 'border-gray-200 hover:border-gray-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="transfer"
                          checked={values.paymentMethod === 'transfer'}
                          onChange={handleChange}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                          disabled={isSubmitting || isProcessing}
                        />
                        <span className="text-sm font-heading font-semibold text-gray-900">
                          Transfer Bank (VA)
                        </span>
                      </div>
                      <p className="text-[11px] font-body text-gray-500 pl-7 leading-relaxed">
                        Verifikasi otomatis. Dapatkan Virtual Account unik dari BCA, Mandiri, BNI,
                        BRI, dll.
                      </p>
                    </label>

                    {/* QRIS */}
                    <label
                      className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        values.paymentMethod === 'qris'
                          ? 'border-primary-500 bg-primary-50/20 ring-1 ring-primary-500 shadow-sm'
                          : 'border-gray-200 hover:border-gray-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="qris"
                          checked={values.paymentMethod === 'qris'}
                          onChange={handleChange}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                          disabled={isSubmitting || isProcessing}
                        />
                        <span className="text-sm font-heading font-semibold text-gray-900">
                          QRIS (E-Wallet)
                        </span>
                      </div>
                      <p className="text-[11px] font-body text-gray-500 pl-7 leading-relaxed">
                        Bayar instan dengan scan kode QRIS menggunakan GoPay, OVO, Dana, ShopeePay,
                        dll.
                      </p>
                    </label>

                    {/* Cash on Delivery (COD) */}
                    <label
                      className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        values.paymentMethod === 'cod'
                          ? 'border-primary-500 bg-primary-50/20 ring-1 ring-primary-500 shadow-sm'
                          : 'border-gray-200 hover:border-gray-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={values.paymentMethod === 'cod'}
                          onChange={handleChange}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                          disabled={isSubmitting || isProcessing}
                        />
                        <span className="text-sm font-heading font-semibold text-gray-900">
                          Cash on Delivery (COD)
                        </span>
                      </div>
                      <p className="text-[11px] font-body text-gray-500 pl-7 leading-relaxed">
                        Bayar dengan uang tunai saat kurir mengantarkan barang pesanan langsung ke
                        rumah Anda.
                      </p>
                    </label>
                  </div>

                  {/* Sub-panel for Bank Transfer Selection */}
                  {values.paymentMethod === 'transfer' && (
                    <div className="mt-4 p-5 border border-primary-100 bg-primary-50/10 rounded-lg transition-all duration-300">
                      <p className="text-xs font-heading font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                        Pilih Bank Virtual Account
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {['bca', 'mandiri', 'bri', 'bni', 'permata'].map(bank => (
                          <label
                            key={bank}
                            className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                              values.selectedBank === bank
                                ? 'border-primary-500 bg-primary-50/20 ring-1 ring-primary-500 font-semibold shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-400'
                            }`}
                          >
                            <input
                              type="radio"
                              name="selectedBank"
                              value={bank}
                              checked={values.selectedBank === bank}
                              onChange={handleChange}
                              className="sr-only"
                              disabled={isSubmitting || isProcessing}
                            />
                            <span className="text-sm font-heading uppercase tracking-widest text-gray-900 font-bold">
                              {bank}
                            </span>
                            <span className="text-[8px] text-gray-400 font-normal mt-1 uppercase text-center leading-none">
                              {bank === 'bca'
                                ? 'BCA VA'
                                : bank === 'mandiri'
                                  ? 'Mandiri Bill'
                                  : bank === 'bri'
                                    ? 'BRI VA'
                                    : bank === 'bni'
                                      ? 'BNI VA'
                                      : 'Permata VA'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
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
                    'Checkout'
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 sticky top-20">
              <h2 className="text-xl font-heading font-medium text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-8 pb-8 border-b border-gray-200">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}

                <div className="pt-4 space-y-3">
                  <div className="flex justify-between text-sm font-body text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-body text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium text-gray-900">{formatCurrency(shippingFee)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-base font-heading font-medium text-gray-900">Total</span>
                <span className="text-lg font-heading font-medium text-gray-900">
                  {formatCurrency(finalTotal)}
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

  if (!values.receiverName || values.receiverName.trim().length < 2) {
    errors.receiverName = 'Nama penerima minimal 2 karakter'
  }

  if (
    !values.shippingPhone ||
    !/^[0-9+\-\s()]+$/.test(values.shippingPhone) ||
    values.shippingPhone.trim().length < 9 ||
    values.shippingPhone.trim().length > 20
  ) {
    errors.shippingPhone = 'Nomor telepon harus berupa angka antara 9-20 karakter'
  }

  if (!values.addressDetail || values.addressDetail.trim().length < 10) {
    errors.addressDetail = 'Detail alamat minimal 10 karakter'
  }

  if (!values.province || values.province.trim().length === 0) {
    errors.province = 'Provinsi wajib diisi'
  }

  if (!values.city || values.city.trim().length === 0) {
    errors.city = 'Kota/Kabupaten wajib diisi'
  }

  if (!values.subdistrict || values.subdistrict.trim().length === 0) {
    errors.subdistrict = 'Kecamatan wajib diisi'
  }

  if (!values.kelurahan || values.kelurahan.trim().length === 0) {
    errors.kelurahan = 'Kelurahan wajib diisi'
  }

  if (!values.postalCode || !/^\d{5}$/.test(values.postalCode)) {
    errors.postalCode = 'Kode pos harus 5 digit angka'
  }

  return errors
}

export default CheckoutPage
