import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from '@shared/components/Icon.jsx'
import ShopNavigation from '../components/navigation/ShopNavigation'
import Loading from '../components/common/Loading'
import { useAuthStore } from '../stores/authStore'
import { getAllOrders, cancelOrder, completeOrder } from '../services/orders'
import { updateProfile } from '../services/auth'
import { apiClient } from '../config/api'
import { logError } from '../utils/logger'
import { useLocation as useLocationHook } from '../hooks/useLocation'
import ProfileInfoTab from '../components/profile/ProfileInfoTab'
import ProfileOrdersTab from '../components/profile/ProfileOrdersTab'
import ProfileAddressTab from '../components/profile/ProfileAddressTab'

/**
 * Profile Page - Modular, clean architecture for customer account management
 */
function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchTab = new URLSearchParams(location.search).get('tab')
  const { user, logout, setAuth } = useAuthStore()
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
          if (parsedAddress && typeof parsedAddress === 'object') {
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
          } else {
            parsed.addressDetail = String(activeUser.address)
          }
        } catch (e) {
          parsed.addressDetail = String(activeUser.address)
        }
      }
      setAddressForm(parsed)
    }
  }, [user])

  // Region Hook for drop-downs
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
  } = useLocationHook()

  // Auto-resolve region IDs and fetch nested lists
  useEffect(() => {
    if (provinces.length > 0 && addressForm.province) {
      const matchProv = provinces.find(
        p => p.name.toLowerCase() === addressForm.province.toLowerCase()
      )
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
      const matchSub = subdistricts.find(
        s => s.name.toLowerCase() === addressForm.subdistrict.toLowerCase()
      )
      if (matchSub) {
        fetchVillages(matchSub.id)
      }
    }
  }, [subdistricts, addressForm.subdistrict, fetchVillages])

  // Postal code resolver
  const fetchPostalCode = useCallback(
    async (kelurahanName, subdistrictName) => {
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
    },
    [addressForm.city, addressForm.province]
  )

  // Fetch orders API call
  const fetchOrders = useCallback(
    async (isSilent = false) => {
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
    },
    [user]
  )

  // Customer manual confirmation that package was received
  const handleCompleteOrder = useCallback(
    async orderId => {
      if (
        !window.confirm(
          'Konfirmasi bahwa paket telah Anda terima dengan baik? Pesanan akan ditandai selesai.'
        )
      ) {
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
    },
    [fetchOrders]
  )

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
      PROCESSING: orders.filter(
        o => o.status === 'PROCESSING' || (o.paymentStatus === 'PAID' && o.status === 'PENDING')
      ).length,
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
      return orders.filter(
        o => o.status === 'PROCESSING' || (o.paymentStatus === 'PAID' && o.status === 'PENDING')
      )
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
  const getOrderStepInfo = useCallback(order => {
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
  const handleCancelOrder = async orderId => {
    if (
      !window.confirm(
        'Apakah Anda yakin ingin membatalkan pesanan ini? Stok produk akan dikembalikan ke inventaris.'
      )
    ) {
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

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddressInputChange = e => {
    const { name, value } = e.target
    setAddressForm(prev => ({ ...prev, [name]: value }))
  }

  // Save Account Profile Changes
  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
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
      alert('Nama penerima wajib diisi')
      return
    }
    if (!addressForm.shippingPhone.trim()) {
      alert('Nomor telepon penerima wajib diisi')
      return
    }
    if (!addressForm.addressDetail.trim()) {
      alert('Detail alamat wajib diisi')
      return
    }
    if (
      !addressForm.province ||
      !addressForm.city ||
      !addressForm.subdistrict ||
      !addressForm.kelurahan
    ) {
      alert('Harap lengkapi informasi wilayah (Provinsi, Kota, Kecamatan, Kelurahan)')
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
                      ? 'bg-primary-600 text-white shadow-xs'
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
                <ProfileInfoTab
                  user={user}
                  formData={formData}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  handleInputChange={handleInputChange}
                  handleSaveProfile={handleSaveProfile}
                  setFormData={setFormData}
                />
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <ProfileOrdersTab
                  orders={orders}
                  filteredOrders={filteredOrders}
                  ordersLoading={ordersLoading}
                  ordersError={ordersError}
                  orderFilter={orderFilter}
                  setOrderFilter={setOrderFilter}
                  orderCounts={orderCounts}
                  lastOrderUpdated={lastOrderUpdated}
                  fetchOrders={fetchOrders}
                  cancellingOrderId={cancellingOrderId}
                  completingOrderId={completingOrderId}
                  handleCancelOrder={handleCancelOrder}
                  handleCompleteOrder={handleCompleteOrder}
                  trackingModalOrderId={trackingModalOrderId}
                  setTrackingModalOrderId={setTrackingModalOrderId}
                  disputeModalOrder={disputeModalOrder}
                  setDisputeModalOrder={setDisputeModalOrder}
                  reviewModalData={reviewModalData}
                  setReviewModalData={setReviewModalData}
                  getOrderStepInfo={getOrderStepInfo}
                  navigate={navigate}
                />
              )}

              {/* Structured Address Tab */}
              {activeTab === 'address' && (
                <ProfileAddressTab
                  user={user}
                  addressForm={addressForm}
                  setAddressForm={setAddressForm}
                  isEditingAddress={isEditingAddress}
                  setIsEditingAddress={setIsEditingAddress}
                  handleAddressInputChange={handleAddressInputChange}
                  handleSaveAddress={handleSaveAddress}
                  provinces={provinces}
                  cities={cities}
                  subdistricts={subdistricts}
                  villages={villages}
                  fetchCities={fetchCities}
                  fetchSubdistricts={fetchSubdistricts}
                  fetchVillages={fetchVillages}
                  setCities={setCities}
                  setSubdistricts={setSubdistricts}
                  setVillages={setVillages}
                  fetchPostalCode={fetchPostalCode}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProfilePage
