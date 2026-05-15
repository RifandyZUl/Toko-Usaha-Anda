import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '@shared/components/Icon.jsx'
import ShopNavigation from '../components/ShopNavigation'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import { useAuthStore } from '../stores/authStore'
import { getAllOrders } from '../services/orders'
import { formatCurrency, formatDateTime } from '../utils/format'
import { logError } from '../utils/logger'

/**
 * Profile Page - Zalora Style Account Management
 */
function ProfilePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/shop/login', { state: { from: { pathname: '/shop/profile' } } })
    }
  }, [isAuthenticated, navigate])

  // Load user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      })
    }
  }, [user])

  // Fetch orders
  useEffect(() => {
    if (isAuthenticated() && activeTab === 'orders') {
      fetchOrders()
    }
  }, [activeTab, isAuthenticated])

  const fetchOrders = async () => {
    setOrdersLoading(true)
    setOrdersError(null)
    try {
      const result = await getAllOrders()
      if (result.success) {
        setOrders(result.orders || [])
      } else {
        setOrdersError(result.error || 'Gagal memuat riwayat pesanan')
      }
    } catch (err) {
      logError('Error fetching orders', err)
      setOrdersError('Gagal memuat riwayat pesanan')
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    // TODO: Implement update profile API
    setIsEditing(false)
    // Show success message
  }

  const handleLogout = () => {
    logout()
    navigate('/shop')
  }

  const tabs = [
    { id: 'profile', label: 'Profil Saya', icon: 'Users' },
    { id: 'orders', label: 'Pesanan Saya', icon: 'Package' },
    { id: 'address', label: 'Alamat', icon: 'MapPin' },
  ]

  if (!isAuthenticated()) {
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
              Kelola informasi akun dan pesanan Anda
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-24">
                {/* User Info Card */}
                <div className="text-center mb-6 pb-6 border-b border-gray-200">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon name="Users" size={32} className="text-primary-600" />
                  </div>
                  <h3 className="font-heading font-medium text-gray-900 mb-1">
                    {user?.name || 'User'}
                  </h3>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>

                {/* Navigation Tabs */}
                <nav className="space-y-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon name={tab.icon} size={18} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body text-red-600 hover:bg-red-50 transition-colors mt-4"
                  >
                    <Icon name="X" size={18} />
                    <span>Keluar</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-heading font-semibold text-gray-900">
                      Informasi Profil
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

                  <div className="space-y-4 max-w-2xl">
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
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-heading font-semibold text-gray-900 mb-6">
                    Pesanan Saya
                  </h2>

                  {ordersLoading ? (
                    <div className="text-center py-12">
                      <Loading message="Memuat pesanan..." />
                    </div>
                  ) : ordersError ? (
                    <ErrorMessage message={ordersError} onRetry={fetchOrders} />
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon name="Package" size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Belum ada pesanan</p>
                      <button
                        onClick={() => navigate('/shop')}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Mulai Belanja
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(order => (
                        <div
                          key={order.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="text-sm font-body text-gray-500 mb-1">
                                Pesanan #{order.id?.slice(-8).toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDateTime(order.createdAt)}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {order.status === 'completed'
                                ? 'Selesai'
                                : order.status === 'pending'
                                ? 'Menunggu'
                                : 'Diproses'}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex-shrink-0">
                                  {item.image && (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover rounded"
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-body text-gray-900 truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {item.quantity} x {formatCurrency(item.price)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <p className="text-sm font-body text-gray-600">
                              Total: <span className="font-semibold text-gray-900">{formatCurrency(order.total)}</span>
                            </p>
                            <button
                              onClick={() => navigate(`/shop/order/${order.id}`)}
                              className="text-sm font-body text-primary-600 hover:text-primary-700 font-medium"
                            >
                              Lihat Detail
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Address Tab */}
              {activeTab === 'address' && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-heading font-semibold text-gray-900">
                      Alamat Pengiriman
                    </h2>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm font-body text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {formData.address ? 'Edit Alamat' : 'Tambah Alamat'}
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4 max-w-2xl">
                      <div>
                        <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                          Alamat Lengkap
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Masukkan alamat lengkap Anda"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSaveProfile}
                          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-body font-medium hover:bg-primary-700 transition-colors"
                        >
                          Simpan Alamat
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false)
                            setFormData(prev => ({
                              ...prev,
                              address: user?.address || '',
                            }))
                          }}
                          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-body font-medium hover:bg-gray-50 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {formData.address ? (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-gray-900 whitespace-pre-line">{formData.address}</p>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Icon name="MapPin" size={48} className="text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">Belum ada alamat tersimpan</p>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-body font-medium hover:bg-primary-700 transition-colors"
                          >
                            Tambah Alamat
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

