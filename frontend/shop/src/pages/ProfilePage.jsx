import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from '@shared/components/Icon.jsx'
import ShopNavigation from '../components/ShopNavigation'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import TrackingModal from '../components/TrackingModal'
import DisputeModal from '../components/DisputeModal'
import ReviewModal from '../components/ReviewModal'
import { useAuthStore } from '../stores/authStore'
import { getAllOrders, cancelOrder, completeOrder } from '../services/orders'
import { updateProfile } from '../services/auth'
import { apiClient } from '../config/api'
import { formatCurrency, formatDateTime } from '../utils/format'
import { logError } from '../utils/logger'
import { useLocation as useLocationHook } from '../hooks/useLocation'

// Helper to clean up City / Regency prefixes from administrative names in Indonesia
function cleanCityName(cityName) {
  if (!cityName) return ''
  return cityName
    .replace(/^(KOTA ADM\.|KAB\. ADM\.|KOTA|KABUPATEN|KAB\.)\s+/i, '')
    .trim()
}

// Helper to clean up address detail from common RT/RW/No patterns
function cleanAddressDetail(addr) {
  if (!addr) return ''
  return addr
    .replace(/rt\s*\d+\s*[-/]?\s*rw\s*\d+/gi, '')
    .replace(/rt\.\s*\d+\s*[-/]?\s*rw\.\s*\d+/gi, '')
    .replace(/rt\/rw\s*\d+\/\d+/gi, '')
    .replace(/rt\/rw\s*:\s*\d+\/\d+/gi, '')
    .replace(/\brt\b\s*\d+/gi, '')
    .replace(/\brw\b\s*\d+/gi, '')
    .replace(/no\.\s*\d+/gi, '')
    .replace(/no\s*\d+/gi, '')
    .replace(/blok\s*[a-z0-9-]+/gi, '')
    .replace(/kav\.\s*[a-z0-9-]+/gi, '')
    .replace(/lantai\s*\d+/gi, '')
    .replace(/lt\.\s*\d+/gi, '')
    .trim()
}

function finalClean(str) {
  if (!str) return ''
  return str
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractStreetName(addr) {
  if (!addr) return ''
  const match = addr.match(/(?:jl\.|jalan|gg\.|gang)\s+([^,]+)/i)
  return match ? match[0].trim() : ''
}

async function geocodeWithFallbacks(queries) {
  for (const q of queries) {
    if (!q || q.trim().length < 3) continue
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'TokoUsahaAndaProfile/1.0'
        }
      })
      const json = await res.json()
      if (json && json.length > 0) {
        return {
          lat: json[0].lat,
          lng: json[0].lon,
          queryUsed: q
        }
      }
    } catch (err) {
      console.error(`Geocoding failed for query: "${q}"`, err)
    }
  }
  return null
}

/**
 * Profile Page - Zalora Style Account Management
 */
function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchTab = new URLSearchParams(location.search).get('tab')
  const { user, isAuthenticated, logout, setAuth } = useAuthStore()
  const [activeTab, setActiveTab] = useState(searchTab === 'orders' ? 'orders' : 'profile')
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState(null)
  const [orderFilter, setOrderFilter] = useState('ALL')
  const [cancellingOrderId, setCancellingOrderId] = useState(null)
  const [completingOrderId, setCompletingOrderId] = useState(null)
  const [lastOrderUpdated, setLastOrderUpdated] = useState(null)
  const [trackingModalOrderId, setTrackingModalOrderId] = useState(null)
  const [disputeModalOrder, setDisputeModalOrder] = useState(null)
  const [reviewModalData, setReviewModalData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingAddress, setIsEditingAddress] = useState(false)

  // Account General Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  // Shipping Address Form Data
  const [addressForm, setAddressForm] = useState({
    receiverName: '',
    shippingPhone: '',
    addressDetail: '',
    province: '',
    city: '',
    subdistrict: '',
    kelurahan: '',
    postalCode: '',
    latitude: '',
    longitude: '',
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/shop/login', { state: { from: { pathname: '/shop/profile' } } })
    }
  }, [user, navigate])

  // Load user data into form states
  useEffect(() => {
    const activeUser = user?.user || user
    if (activeUser) {
      setFormData({
        name: activeUser.name || '',
        email: activeUser.email || '',
        phone: activeUser.phone || '',
        address: activeUser.address || '',
      })

      // Parse structured address if stored as JSON
      let parsed = {
        receiverName: activeUser.name || '',
        shippingPhone: activeUser.phone || '',
        addressDetail: '',
        province: '',
        city: '',
        subdistrict: '',
        kelurahan: '',
        postalCode: '',
        latitude: '',
        longitude: '',
      }

      if (activeUser.address) {
        try {
          const parsedAddress = JSON.parse(activeUser.address)
          parsed = {
            receiverName: parsedAddress.receiverName || activeUser.name || '',
            shippingPhone: parsedAddress.shippingPhone || activeUser.phone || '',
            addressDetail: parsedAddress.addressDetail || '',
            province: parsedAddress.province || '',
            city: parsedAddress.city || '',
            subdistrict: parsedAddress.subdistrict || '',
            kelurahan: parsedAddress.kelurahan || '',
            postalCode: parsedAddress.postalCode || '',
            latitude: parsedAddress.latitude || '',
            longitude: parsedAddress.longitude || '',
          }
        } catch (e) {
          // Fallback if not valid JSON
          parsed.addressDetail = activeUser.address
        }
      }
      setAddressForm(parsed)
    }
  }, [user])

  // Region Hook for drop-downs
  const { 
    provinces, cities, subdistricts, villages, 
    fetchCities, fetchSubdistricts, fetchVillages,
    setCities, setSubdistricts, setVillages 
  } = useLocationHook()

  // Auto-resolve region IDs and fetch nested lists when initial values are pre-populated
  useEffect(() => {
    if (provinces.length > 0 && addressForm.province) {
      const matchProv = provinces.find(p => p.name.toLowerCase() === addressForm.province.toLowerCase())
      if (matchProv) {
        fetchCities(matchProv.id)
      }
    }
  }, [provinces, addressForm.province, fetchCities])

  useEffect(() => {
    if (cities.length > 0 && addressForm.city) {
      const matchCity = cities.find(c => c.name.toLowerCase() === addressForm.city.toLowerCase())
      if (matchCity) {
        fetchSubdistricts(matchCity.id)
      }
    }
  }, [cities, addressForm.city, fetchSubdistricts])

  useEffect(() => {
    if (subdistricts.length > 0 && addressForm.subdistrict) {
      const matchSub = subdistricts.find(s => s.name.toLowerCase() === addressForm.subdistrict.toLowerCase())
      if (matchSub) {
        fetchVillages(matchSub.id)
      }
    }
  }, [subdistricts, addressForm.subdistrict, fetchVillages])

  // Map-related refs and state
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerInstanceRef = useRef(null)
  const lastGeocodedAddressRef = useRef('')
  const [mapVisible, setMapVisible] = useState(!!addressForm.latitude && !!addressForm.longitude)
  const [mapOverrideVisible, setMapOverrideVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const preventSuggestionsRef = useRef(false)
  const searchContainerRef = useRef(null)

  // Initialize Leaflet map callback
  const initMap = useCallback((lat, lng) => {
    if (!window.L) return

    const parsedLat = parseFloat(lat) || -6.2088
    const parsedLng = parseFloat(lng) || 106.8456

    if (!mapInstanceRef.current) {
      if (!mapRef.current) return

      const map = window.L.map(mapRef.current).setView([parsedLat, parsedLng], 16)
      mapInstanceRef.current = map

      window.L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Map data &copy; Google'
      }).addTo(map)

      const DefaultIcon = window.L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })

      const marker = window.L.marker([parsedLat, parsedLng], {
        draggable: true,
        icon: DefaultIcon
      }).addTo(map)
      markerInstanceRef.current = marker

      marker.on('dragend', () => {
        const position = marker.getLatLng()
        setAddressForm(prev => ({
          ...prev,
          latitude: position.lat.toString(),
          longitude: position.lng.toString()
        }))
      })

      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng
        marker.setLatLng([clickLat, clickLng])
        setAddressForm(prev => ({
          ...prev,
          latitude: clickLat.toString(),
          longitude: clickLng.toString()
        }))
      })
    } else {
      const map = mapInstanceRef.current
      const marker = markerInstanceRef.current
      map.setView([parsedLat, parsedLng], 16)
      marker.setLatLng([parsedLat, parsedLng])
    }
  }, [])

  // Geocoding based on form address changes
  useEffect(() => {
    const isAddressFilled = 
      addressForm.province && 
      addressForm.city && 
      addressForm.subdistrict && 
      addressForm.kelurahan && 
      addressForm.addressDetail &&
      addressForm.addressDetail.trim().length >= 10

    if (!isAddressFilled) {
      if (!addressForm.latitude || !addressForm.longitude) {
        setMapVisible(false)
      }
      return
    }

    setMapVisible(true)

    const fullAddress = `${addressForm.addressDetail}, ${addressForm.kelurahan}, ${addressForm.subdistrict}, ${addressForm.city}, ${addressForm.province}, Indonesia`
    
    if (fullAddress === lastGeocodedAddressRef.current) return

    const displayQuery = finalClean(`${cleanAddressDetail(addressForm.addressDetail)}, ${addressForm.kelurahan}, ${addressForm.subdistrict}, ${cleanCityName(addressForm.city)}`)
    preventSuggestionsRef.current = true
    setSearchQuery(displayQuery || `${addressForm.addressDetail}, ${addressForm.kelurahan}`)

    const delayDebounceFn = setTimeout(async () => {
      const cleanedDetail = cleanAddressDetail(addressForm.addressDetail)
      const cleanedCity = cleanCityName(addressForm.city)
      const streetName = extractStreetName(addressForm.addressDetail)
      
      const queries = []
      if (cleanedDetail) {
        queries.push(finalClean(`${cleanedDetail}, ${addressForm.kelurahan}, ${addressForm.subdistrict}, ${cleanedCity}, ${addressForm.province}, Indonesia`))
      }
      queries.push(fullAddress)
      if (streetName) {
        queries.push(finalClean(`${streetName}, ${addressForm.kelurahan}, ${addressForm.subdistrict}, ${cleanedCity}, ${addressForm.province}, Indonesia`))
      }
      queries.push(finalClean(`${addressForm.kelurahan}, ${addressForm.subdistrict}, ${cleanedCity}, ${addressForm.province}, Indonesia`))

      const result = await geocodeWithFallbacks(queries)
      if (result) {
        lastGeocodedAddressRef.current = fullAddress
        setAddressForm(prev => ({
          ...prev,
          latitude: result.lat,
          longitude: result.lng
        }))
      }
    }, 1500)

    return () => clearTimeout(delayDebounceFn)
  }, [
    addressForm.province,
    addressForm.city,
    addressForm.subdistrict,
    addressForm.kelurahan,
    addressForm.addressDetail,
    addressForm.latitude,
    addressForm.longitude
  ])

  // Initialize/update Leaflet map
  useEffect(() => {
    const showActiveMap = isEditingAddress && (mapVisible || mapOverrideVisible)
    if (showActiveMap && mapRef.current && window.L && !mapInstanceRef.current) {
      const lat = addressForm.latitude || '-6.2088'
      const lng = addressForm.longitude || '106.8456'
      const timer = setTimeout(() => {
        initMap(lat, lng)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isEditingAddress, mapVisible, mapOverrideVisible, initMap, addressForm.latitude, addressForm.longitude])

  // Cleanup Leaflet map
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerInstanceRef.current = null
      }
    }
  }, [activeTab, isEditingAddress])

  // Search Address Autocomplete
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
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`, {
          headers: {
            'User-Agent': 'TokoUsahaAndaProfile/1.0'
          }
        })
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

  // Dismiss suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectSuggestion = (item) => {
    const lat = item.lat
    const lng = item.lon
    
    setAddressForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }))
    
    setSearchQuery(item.display_name)
    setSuggestions([])
    setShowSuggestions(false)
    setMapOverrideVisible(true)
    
    if (mapInstanceRef.current) {
      initMap(lat, lng)
    }
  }

  // Location search trigger (manual search)
  const handleSearchLocation = async () => {
    if (!searchQuery || searchQuery.trim().length < 3) return
    try {
      const cleanedQuery = finalClean(cleanAddressDetail(searchQuery))
      const queries = [searchQuery, cleanedQuery]

      if (addressForm.province && addressForm.city) {
        const cleanedCity = cleanCityName(addressForm.city)
        if (addressForm.kelurahan && addressForm.subdistrict) {
          queries.push(finalClean(`${addressForm.kelurahan}, ${addressForm.subdistrict}, ${cleanedCity}, ${addressForm.province}, Indonesia`))
        }
        if (addressForm.subdistrict) {
          queries.push(finalClean(`${addressForm.subdistrict}, ${cleanedCity}, ${addressForm.province}, Indonesia`))
        }
        queries.push(finalClean(`${cleanedCity}, ${addressForm.province}, Indonesia`))
      }

      const result = await geocodeWithFallbacks(queries)
      if (result) {
        setAddressForm(prev => ({
          ...prev,
          latitude: result.lat,
          longitude: result.lng
        }))
        if (mapInstanceRef.current) {
          initMap(result.lat, result.lng)
        }
      } else {
        alert("Lokasi tidak ditemukan. Silakan cari dengan kata kunci lain.")
      }
    } catch (err) {
      console.error("Search location error:", err)
    }
  }

  // Auto geolocate
  const handleActivateMapManual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toString()
          const lng = position.coords.longitude.toString()
          setAddressForm(prev => ({ ...prev, latitude: lat, longitude: lng }))
          setMapOverrideVisible(true)
        },
        () => {
          setAddressForm(prev => ({ ...prev, latitude: '-6.2088', longitude: '106.8456' }))
          setMapOverrideVisible(true)
        }
      )
    } else {
      setAddressForm(prev => ({ ...prev, latitude: '-6.2088', longitude: '106.8456' }))
      setMapOverrideVisible(true)
    }
  }

  // Postal code resolver
  const fetchPostalCode = useCallback(async (kelurahanName, subdistrictName) => {
    try {
      const res = await apiClient.get('/location/postal-code', {
        kelurahan: kelurahanName || '',
        subdistrict: subdistrictName || '',
        city: addressForm.city || '',
        province: addressForm.province || '',
      })
      if (res?.data && res.data.length > 0) {
        const match = res.data[0]
        if (match && match.postalCode) {
          setAddressForm(prev => ({ ...prev, postalCode: match.postalCode }))
        }
      }
    } catch (err) {
      console.error('Failed to fetch postal code:', err)
    }
  }, [addressForm.city, addressForm.province])

  // Fetch orders API call with silent background refresh support
  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!user) {
      setOrders([])
      return
    }
    if (!isSilent) setOrdersLoading(true)
    setOrdersError(null)
    try {
      const result = await getAllOrders()
      if (result.success) {
        setOrders(result.orders || [])
        setLastOrderUpdated(new Date())
      } else {
        if (!isSilent) setOrdersError(result.error || 'Gagal memuat riwayat pesanan')
      }
    } catch (err) {
      logError('Error fetching orders', err)
      if (!isSilent) setOrdersError('Gagal memuat riwayat pesanan')
    } finally {
      if (!isSilent) setOrdersLoading(false)
    }
  }, [user])

  // Customer manual confirmation that package was received
  const handleCompleteOrder = useCallback(async (orderId) => {
    if (!window.confirm('Konfirmasi bahwa paket telah Anda terima dengan baik? Pesanan akan ditandai selesai.')) {
      return
    }
    setCompletingOrderId(orderId)
    try {
      const result = await completeOrder(orderId)
      if (result.success) {
        fetchOrders(true)
      } else {
        alert(`Gagal menyelesaikan pesanan: ${result.error || 'Terjadi kesalahan'}`)
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menyelesaikan pesanan')
    } finally {
      setCompletingOrderId(null)
    }
  }, [fetchOrders])

  // Auto-fetch and real-time polling every 10 seconds while on orders tab
  useEffect(() => {
    if (activeTab === 'orders' && user) {
      fetchOrders()
      const interval = setInterval(() => {
        fetchOrders(true)
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [activeTab, user, fetchOrders])

  // Count orders per status category
  const orderCounts = useMemo(() => {
    return {
      ALL: orders.length,
      UNPAID: orders.filter(o => o.status === 'PENDING' && o.paymentStatus === 'PENDING').length,
      PROCESSING: orders.filter(o => o.status === 'PROCESSING' || (o.paymentStatus === 'PAID' && o.status === 'PENDING')).length,
      SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
      DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
      CANCELLED: orders.filter(o => o.status === 'CANCELLED' || o.status === 'EXPIRED').length,
    }
  }, [orders])

  // Filter orders according to selected tab
  const filteredOrders = useMemo(() => {
    if (orderFilter === 'ALL') return orders
    if (orderFilter === 'UNPAID') {
      return orders.filter(o => o.status === 'PENDING' && o.paymentStatus === 'PENDING')
    }
    if (orderFilter === 'PROCESSING') {
      return orders.filter(o => o.status === 'PROCESSING' || (o.paymentStatus === 'PAID' && o.status === 'PENDING'))
    }
    if (orderFilter === 'SHIPPED') {
      return orders.filter(o => o.status === 'SHIPPED')
    }
    if (orderFilter === 'DELIVERED') {
      return orders.filter(o => o.status === 'DELIVERED')
    }
    if (orderFilter === 'CANCELLED') {
      return orders.filter(o => o.status === 'CANCELLED' || o.status === 'EXPIRED')
    }
    return orders
  }, [orders, orderFilter])

  // Helper to determine stepper progress and status styling
  const getOrderStepInfo = useCallback((order) => {
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
  }, [])

  // Cancel order directly from profile
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini? Stok produk akan dikembalikan ke inventaris.')) {
      return
    }
    setCancellingOrderId(orderId)
    try {
      const result = await cancelOrder(orderId)
      if (result.success) {
        await fetchOrders()
      } else {
        alert(result.error || 'Gagal membatalkan pesanan')
      }
    } catch (err) {
      alert('Terjadi kesalahan saat membatalkan pesanan')
    } finally {
      setCancellingOrderId(null)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target
    setAddressForm(prev => ({ ...prev, [name]: value }))
  }

  // Save Account Profile Changes
  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address, // keep string representation if not edited via structured address
      })
      if (result.success && result.user) {
        setAuth(result.user)
        setIsEditing(false)
      } else {
        alert(result.error || 'Gagal memperbarui profil')
      }
    } catch (err) {
      logError('Error saving profile', err)
      alert('Terjadi kesalahan saat memperbarui profil')
    }
  }

  // Save Structured Shipping Address
  const handleSaveAddress = async () => {
    if (!addressForm.receiverName.trim()) {
      alert("Nama penerima wajib diisi")
      return
    }
    if (!addressForm.shippingPhone.trim()) {
      alert("Nomor telepon penerima wajib diisi")
      return
    }
    if (!addressForm.addressDetail.trim()) {
      alert("Detail alamat wajib diisi")
      return
    }
    if (!addressForm.province || !addressForm.city || !addressForm.subdistrict || !addressForm.kelurahan) {
      alert("Harap lengkapi informasi wilayah (Provinsi, Kota, Kecamatan, Kelurahan)")
      return
    }

    try {
      const activeUser = user?.user || user
      const serializedAddress = JSON.stringify(addressForm)
      const result = await updateProfile({
        name: activeUser?.name || addressForm.receiverName,
        phone: activeUser?.phone || addressForm.shippingPhone,
        address: serializedAddress,
      })
      if (result.success && result.user) {
        setAuth(result.user)
        setIsEditingAddress(false)
        alert('Alamat pengiriman berhasil diperbarui!')
      } else {
        alert(result.error || 'Gagal memperbarui alamat')
      }
    } catch (err) {
      logError('Error saving address', err)
      alert('Terjadi kesalahan saat memperbarui alamat')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/shop')
  }

  const tabs = [
    { id: 'profile', label: 'Profil Saya', icon: 'Users' },
    { id: 'orders', label: 'Pesanan Saya', icon: 'Package' },
    { id: 'address', label: 'Alamat Pengiriman', icon: 'MapPin' },
  ]

  if (!user) {
    return <Loading message="Redirecting..." />
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ShopNavigation />

      <main className="container-custom py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-heading font-semibold text-gray-900 mb-2">
              Akun Saya
            </h1>
            <p className="text-sm text-gray-600">
              Kelola informasi akun, alamat pengiriman, dan pesanan Anda
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Tabs */}
            <div className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setIsEditing(false)
                    setIsEditingAddress(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon name={tab.icon} size={18} />
                  {tab.label}
                </button>
              ))}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body font-medium text-red-600 bg-white border border-gray-200 hover:bg-red-50 transition-colors mt-6"
              >
                <Icon name="LogOut" size={18} />
                Keluar Akun
              </button>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* Profile Info Tab */}
              {activeTab === 'profile' && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-heading font-semibold text-gray-900">
                      Informasi Akun
                    </h2>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm font-body text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Edit Profil
                      </button>
                    )}
                  </div>

                  <div className="space-y-6 max-w-xl">
                    <div>
                      <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                        Nama Lengkap
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{formData.name || '-'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <p className="text-gray-900">{formData.email || '-'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Email tidak dapat diubah
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                        Nomor Telepon
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{formData.phone || '-'}</p>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSaveProfile}
                          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-body font-medium hover:bg-primary-700 transition-colors"
                        >
                          Simpan Perubahan
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false)
                            setFormData({
                              name: user?.name || '',
                              email: user?.email || '',
                              phone: user?.phone || '',
                              address: user?.address || '',
                            })
                          }}
                          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-body font-medium hover:bg-gray-50 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm">
                  {/* Header: Title, Live Status Indicator, Refresh Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100">
                    <div>
                      <h2 className="text-xl font-heading font-semibold text-gray-900">
                        Pesanan Saya
                      </h2>
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

                  {/* Status Filter Tabs (Shopee / Tokopedia Style) */}
                  <div className="flex items-center gap-1.5 border-b border-gray-200 mb-6 overflow-x-auto pb-1 text-xs">
                    {[
                      { id: 'ALL', label: 'Semua', count: orderCounts.ALL },
                      { id: 'UNPAID', label: 'Belum Bayar', count: orderCounts.UNPAID },
                      { id: 'PROCESSING', label: 'Dikemas', count: orderCounts.PROCESSING },
                      { id: 'SHIPPED', label: 'Dikirim', count: orderCounts.SHIPPED },
                      { id: 'DELIVERED', label: 'Selesai', count: orderCounts.DELIVERED },
                      { id: 'CANCELLED', label: 'Dibatalkan', count: orderCounts.CANCELLED },
                    ].map(tab => (
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
                        const totalAmountNum = Number(order.totalAmount || 0) + Number(order.shippingFee || 0)

                        return (
                          <div
                            key={order.id}
                            className="border border-gray-200 rounded-lg p-4 md:p-5 hover:border-gray-300 transition-all bg-white shadow-sm"
                          >
                            {/* Card Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                                  #{order.id?.slice(-8).toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                  {formatDateTime(order.createdAt)}
                                </span>
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
                                              ? 'bg-primary-600 text-white shadow-sm'
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
                                <Icon name="AlertCircle" size={16} className="text-red-600 flex-shrink-0" />
                                <span>
                                  Pesanan dibatalkan ({order.status === 'EXPIRED' ? 'Batas waktu pembayaran habis' : 'Dibatalkan oleh pembeli'}). Seluruh stok produk telah dikembalikan ke inventaris.
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
                                    <div className="w-14 h-14 bg-gray-50 rounded border border-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
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

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                {/* If PENDING and UNPAID: Allow Pay Now or Cancel */}
                                {order.status === 'PENDING' && order.paymentStatus === 'PENDING' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleCancelOrder(order.id)}
                                      disabled={cancellingOrderId === order.id}
                                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded transition-colors disabled:opacity-50"
                                    >
                                      {cancellingOrderId === order.id ? 'Membatalkan...' : 'Batalkan'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/shop/order/${order.id}`)}
                                      className="px-4 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors shadow-sm"
                                    >
                                      Bayar Sekarang
                                    </button>
                                  </>
                                )}

                                {/* If PROCESSING: View Details */}
                                {order.status === 'PROCESSING' && (
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/shop/order/${order.id}`)}
                                    className="px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:text-primary-700 border border-gray-300 hover:border-primary-400 rounded transition-colors"
                                  >
                                    Lihat Rincian
                                  </button>
                                )}

                                {/* If SHIPPED: Track Package, Confirm Received, and Dispute */}
                                {order.status === 'SHIPPED' && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={completingOrderId === order.id}
                                      onClick={() => handleCompleteOrder(order.id)}
                                      className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded transition-colors shadow-sm flex items-center gap-1.5"
                                    >
                                      <Icon name="CheckCircle" size={13} />
                                      <span>{completingOrderId === order.id ? 'Memproses...' : 'Pesanan Diterima'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTrackingModalOrderId(order.id)}
                                      className="px-3.5 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded transition-colors flex items-center gap-1.5"
                                    >
                                      <Icon name="Truck" size={13} />
                                      <span>Lacak Paket</span>
                                    </button>
                                    {!order.paymentDetails?.disputeDetails?.isDisputed && (
                                      <button
                                        type="button"
                                        onClick={() => setDisputeModalOrder(order)}
                                        className="px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 border border-amber-200 rounded transition-colors"
                                      >
                                        Komplain
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/shop/order/${order.id}`)}
                                      className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
                                    >
                                      Rincian
                                    </button>
                                  </>
                                )}

                                {/* If DELIVERED: Review, Buy Again, or Dispute */}
                                {order.status === 'DELIVERED' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setReviewModalData({ orderId: order.id, product: order.items[0]?.product })}
                                      className="px-3.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded transition-colors flex items-center gap-1"
                                    >
                                      <Icon name="Star" size={13} className="fill-amber-400 text-amber-500" />
                                      <span>Beri Ulasan</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTrackingModalOrderId(order.id)}
                                      className="px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 border border-blue-200 rounded transition-colors flex items-center gap-1"
                                    >
                                      <Icon name="Truck" size={12} />
                                      <span>Lacak</span>
                                    </button>
                                    {!order.paymentDetails?.disputeDetails?.isDisputed && (
                                      <button
                                        type="button"
                                        onClick={() => setDisputeModalOrder(order)}
                                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
                                      >
                                        Komplain
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => navigate('/shop')}
                                      className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 border border-primary-300 rounded transition-colors"
                                    >
                                      Beli Lagi
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/shop/order/${order.id}`)}
                                      className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
                                    >
                                      Rincian
                                    </button>
                                  </>
                                )}

                                {/* If CANCELLED: Buy Again */}
                                {stepInfo.isCancelled && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => navigate('/shop')}
                                      className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 border border-primary-300 rounded transition-colors"
                                    >
                                      Beli Lagi
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/shop/order/${order.id}`)}
                                      className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
                                    >
                                      Rincian
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Dispute Active Alert */}
                            {order.paymentDetails?.disputeDetails?.isDisputed && (
                              <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                                <span className="flex items-center gap-1.5 font-medium">
                                  <Icon name="AlertTriangle" size={13} className="text-amber-600 shrink-0" />
                                  <span>Komplain Diajukan: <strong>{order.paymentDetails.disputeDetails.reason}</strong> ({order.paymentDetails.disputeDetails.status})</span>
                                </span>
                                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                                  Ditangguhkan
                                </span>
                              </div>
                            )}

                            {/* Auto-complete notice for SHIPPED orders without dispute */}
                            {order.status === 'SHIPPED' && !order.paymentDetails?.disputeDetails?.isDisputed && (
                              <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded border border-amber-100">
                                <Icon name="Clock" size={13} className="text-amber-600 shrink-0" />
                                <span>Pesanan otomatis diselesaikan dalam <strong>2 hari</strong> setelah barang diterima jika belum dikonfirmasi.</span>
                              </div>
                            )}
                          </div>
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
              )}

              {/* Structured Address Tab */}
              {activeTab === 'address' && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-heading font-semibold text-gray-900">
                      Alamat Pengiriman Saya
                    </h2>
                    {!isEditingAddress && (
                      <button
                        onClick={() => setIsEditingAddress(true)}
                        className="text-sm font-body text-primary-600 hover:text-primary-700 font-semibold"
                      >
                        {addressForm.addressDetail ? 'Edit Alamat' : 'Tambah Alamat'}
                      </button>
                    )}
                  </div>

                  {isEditingAddress ? (
                    <div className="space-y-6 max-w-3xl">
                      {/* Peta Lokasi Section */}
                      {mapVisible || mapOverrideVisible ? (
                        <div className="space-y-3 pt-2">
                          <label className="block text-xs font-body font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                            Peta Lokasi Pengiriman
                          </label>
                          
                          {/* Search Input for Panning the Map */}
                          <div className="flex gap-2 mb-3">
                            <div ref={searchContainerRef} className="flex-grow relative">
                              <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => {
                                  preventSuggestionsRef.current = false
                                  setSearchQuery(e.target.value)
                                }}
                                onKeyDown={(e) => {
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
                                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                              
                              {/* Auto-complete Suggestions Dropdown */}
                              {showSuggestions && (
                                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                  {suggestions.map((item, idx) => (
                                    <div
                                      key={item.place_id || idx}
                                      onClick={() => handleSelectSuggestion(item)}
                                      className="px-4 py-2.5 text-xs font-body text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors text-left truncate"
                                      title={item.display_name}
                                    >
                                      {item.display_name}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Loading indicator */}
                              {isLoadingSuggestions && (
                                <div className="absolute right-3 top-[10px] flex items-center">
                                  <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </div>
                              )}
                            </div>
                            
                            <button 
                              type="button" 
                              onClick={handleSearchLocation}
                              className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-xs uppercase tracking-wider whitespace-nowrap h-[38px] transition-colors"
                            >
                              Cari
                            </button>
                            <button
                              type="button"
                              onClick={handleActivateMapManual}
                              className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-body font-medium transition-colors"
                              title="Gunakan lokasi saya saat ini"
                            >
                              <Icon name="MapPin" size={16} />
                            </button>
                          </div>

                          <div 
                            ref={mapRef} 
                            className="w-full h-[260px] border border-gray-300 rounded-xl shadow-sm z-0 relative overflow-hidden"
                            style={{ minHeight: '260px' }}
                          />
                          
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-[11px] text-gray-500 font-body flex items-center gap-1">
                              <Icon name="Info" size={12} className="inline text-gray-400" />
                              Geser pin merah jika ingin menentukan titik kirim kurir yang lebih akurat.
                            </p>
                            {mapOverrideVisible && !mapVisible && (
                              <button 
                                type="button"
                                onClick={() => {
                                  setMapOverrideVisible(false)
                                  setAddressForm(prev => ({
                                    ...prev,
                                    latitude: '',
                                    longitude: ''
                                  }))
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
                          <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                            Peta Lokasi Pengiriman
                          </label>
                          <div 
                            onClick={handleActivateMapManual}
                            className="w-full h-[150px] border border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50/50 transition-all duration-200 relative overflow-hidden"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M0 0h80v80H0z' fill='%23fbfbfb'/%3E%3Cpath d='M0 10h80M0 20h80M0 30h80M0 40h80M0 50h80M0 60h80M0 70h80M10 0v80M20 0v80M30 0v80M40 0v80M50 0v80M60 0v80M70 0v80' stroke='%23f3f3f3' stroke-width='1'/%3E%3C/svg%3E")`
                            }}
                          >
                            <div className="bg-white px-6 py-3 border border-gray-300 rounded shadow-sm hover:shadow-md transition-shadow flex items-center gap-2 text-sm font-heading font-medium text-gray-700 z-10">
                              <Icon name="Plus" size={16} className="text-gray-500" />
                              Tambah Lokasi
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Receiver and Phone Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                            Nama Penerima
                          </label>
                          <input
                            type="text"
                            name="receiverName"
                            value={addressForm.receiverName}
                            onChange={handleAddressInputChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            placeholder="Nama penerima paket"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                            Nomor Telepon Penerima
                          </label>
                          <input
                            type="tel"
                            name="shippingPhone"
                            value={addressForm.shippingPhone}
                            onChange={handleAddressInputChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            placeholder="Contoh: 0812345678"
                          />
                        </div>
                      </div>

                      {/* Detail Address */}
                      <div>
                        <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                          Detail Alamat (Nama Jalan, No. Rumah, RT/RW)
                        </label>
                        <textarea
                          name="addressDetail"
                          value={addressForm.addressDetail}
                          onChange={handleAddressInputChange}
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none"
                          placeholder="Contoh: Jl. Merpati No. 12 RT 04/RW 02"
                        />
                      </div>

                      {/* Region Select List Row 1 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Province */}
                        <div>
                          <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                            Provinsi
                          </label>
                          <select
                            name="province"
                            value={addressForm.province}
                            onChange={(e) => {
                              const selectedOption = e.target.options[e.target.selectedIndex]
                              const id = selectedOption.getAttribute('data-id')
                              handleAddressInputChange(e)
                              
                              if (id) fetchCities(id)
                              setCities([])
                              setSubdistricts([])
                              setVillages([])
                              setAddressForm(prev => ({
                                ...prev,
                                city: '',
                                subdistrict: '',
                                kelurahan: '',
                                postalCode: ''
                              }))
                            }}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white appearance-none"
                          >
                            <option value="" data-id="">Pilih Provinsi</option>
                            {provinces.map(prov => (
                              <option key={prov.id} value={prov.name} data-id={prov.id}>{prov.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* City */}
                        <div>
                          <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                            Kota / Kabupaten
                          </label>
                          <select
                            name="city"
                            value={addressForm.city}
                            onChange={(e) => {
                              const selectedOption = e.target.options[e.target.selectedIndex]
                              const id = selectedOption.getAttribute('data-id')
                              handleAddressInputChange(e)

                              if (id) fetchSubdistricts(id)
                              setSubdistricts([])
                              setVillages([])
                              setAddressForm(prev => ({
                                ...prev,
                                subdistrict: '',
                                kelurahan: '',
                                postalCode: ''
                              }))
                            }}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white appearance-none"
                            disabled={cities.length === 0}
                          >
                            <option value="" data-id="">Pilih Kota/Kabupaten</option>
                            {cities.map(city => (
                              <option key={city.id} value={city.name} data-id={city.id}>{city.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Region Select List Row 2 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Subdistrict */}
                        <div>
                          <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                            Kecamatan
                          </label>
                          <select
                            name="subdistrict"
                            value={addressForm.subdistrict}
                            onChange={(e) => {
                              const selectedOption = e.target.options[e.target.selectedIndex]
                              const id = selectedOption.getAttribute('data-id')
                              handleAddressInputChange(e)

                              if (id) fetchVillages(id)
                              setVillages([])
                              setAddressForm(prev => ({
                                ...prev,
                                kelurahan: '',
                                postalCode: ''
                              }))
                            }}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white appearance-none"
                            disabled={subdistricts.length === 0}
                          >
                            <option value="" data-id="">Pilih Kecamatan</option>
                            {subdistricts.map(sub => (
                              <option key={sub.id} value={sub.name} data-id={sub.id}>{sub.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Kelurahan / Village */}
                        <div>
                          <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                            Kelurahan / Desa
                          </label>
                          <select
                            name="kelurahan"
                            value={addressForm.kelurahan}
                            onChange={(e) => {
                              handleAddressInputChange(e)
                              if (e.target.value && addressForm.subdistrict) {
                                fetchPostalCode(e.target.value, addressForm.subdistrict)
                              }
                            }}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white appearance-none"
                            disabled={villages.length === 0}
                          >
                            <option value="">Pilih Kelurahan</option>
                            {villages.map(vil => (
                              <option key={vil.id} value={vil.name}>{vil.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Postal Code */}
                        <div>
                          <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                            Kode Pos
                          </label>
                          <input
                            type="text"
                            name="postalCode"
                            value={addressForm.postalCode}
                            onChange={handleAddressInputChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            placeholder="Kode Pos"
                          />
                        </div>
                      </div>

                      {/* Coordinates fields (Hidden but updated by Leaflet marker drag/click) */}

                      {/* Edit Actions */}
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSaveAddress}
                          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-body font-medium hover:bg-primary-700 transition-colors"
                        >
                          Simpan Alamat
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingAddress(false)
                            // Restore initial address state
                            let parsed = {
                              receiverName: user.name || '',
                              shippingPhone: user.phone || '',
                              addressDetail: '',
                              province: '',
                              city: '',
                              subdistrict: '',
                              kelurahan: '',
                              postalCode: '',
                              latitude: '',
                              longitude: '',
                            }
                            if (user.address) {
                              try {
                                const parsedAddress = JSON.parse(user.address)
                                parsed = {
                                  receiverName: parsedAddress.receiverName || user.name || '',
                                  shippingPhone: parsedAddress.shippingPhone || user.phone || '',
                                  addressDetail: parsedAddress.addressDetail || '',
                                  province: parsedAddress.province || '',
                                  city: parsedAddress.city || '',
                                  subdistrict: parsedAddress.subdistrict || '',
                                  kelurahan: parsedAddress.kelurahan || '',
                                  postalCode: parsedAddress.postalCode || '',
                                  latitude: parsedAddress.latitude || '',
                                  longitude: parsedAddress.longitude || '',
                                }
                              } catch (e) {
                                parsed.addressDetail = user.address
                              }
                            }
                            setAddressForm(parsed)
                          }}
                          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-body font-medium hover:bg-gray-50 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {addressForm.addressDetail ? (
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-400 font-body uppercase tracking-wider">Nama Penerima</p>
                              <p className="text-sm font-semibold text-gray-900 mt-0.5">{addressForm.receiverName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 font-body uppercase tracking-wider">Nomor Telepon</p>
                              <p className="text-sm font-semibold text-gray-900 mt-0.5">{addressForm.shippingPhone}</p>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 pt-3">
                            <p className="text-xs text-gray-400 font-body uppercase tracking-wider">Alamat Pengiriman Lengkap</p>
                            <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                              {addressForm.addressDetail}
                              <br />
                              Kel. {addressForm.kelurahan}, Kec. {addressForm.subdistrict}
                              <br />
                              {addressForm.city}, {addressForm.province}
                              <br />
                              KODE POS: <span className="font-semibold text-gray-900">{addressForm.postalCode}</span>
                            </p>
                          </div>


                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Icon name="MapPin" size={48} className="text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4 font-body">Belum ada alamat pengiriman terperinci tersimpan.</p>
                          <button
                            onClick={() => setIsEditingAddress(true)}
                            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-body font-medium hover:bg-primary-700 transition-colors"
                          >
                            Tambah Alamat Baru
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProfilePage
