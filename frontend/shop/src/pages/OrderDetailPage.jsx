import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Icon from '@shared/components/Icon.jsx'
import ShopNavigation from '../components/ShopNavigation'
import { useAuthStore } from '../stores/authStore'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import TrackingModal from '../components/TrackingModal'
import DisputeModal from '../components/DisputeModal'
import ReviewModal from '../components/ReviewModal'
import { getOrderById, simulateOrderPayment, cancelOrder, completeOrder } from '../services/orders'
import { formatCurrency, formatDateTime } from '../utils/format'
import { logError } from '../utils/logger'

/**
 * Dynamic script loader for Midtrans Snap JS
 */
const loadMidtransSnap = () => {
  return new Promise((resolve) => {
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

/**
 * Countdown Timer Component for Payments
 */
function PaymentCountdown({ expiredAt, createdAt }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetTime = expiredAt ? new Date(expiredAt).getTime() : new Date(createdAt).getTime() + 24 * 60 * 60 * 1000
      const difference = targetTime - Date.now()
      if (difference <= 0) {
        return 'Batas waktu pembayaran telah habis'
      }

      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference / 1000 / 60) % 60)
      const seconds = Math.floor((difference / 1000) % 60)

      return `${hours} jam ${minutes} menit ${seconds} detik`
    }

    setTimeLeft(calculateTimeLeft())
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [expiredAt, createdAt])

  return (
    <div className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-lg text-center font-medium my-3 text-xs flex items-center justify-center gap-2">
      <Icon name="Clock" size={14} className="animate-pulse" />
      <span>Sisa Waktu Pembayaran: <strong className="font-mono">{timeLeft}</strong></span>
    </div>
  )
}

/**
 * Collapsible Tab-based payment instructions for various banks
 */
function PaymentInstructions({ bank }) {
  const [activeTab, setActiveTab] = useState('atm')
  
  const instructions = {
    bca: {
      atm: [
        'Masukkan Kartu ATM BCA dan PIN Anda.',
        'Pilih menu "Transaksi Lainnya" > "Transfer" > "Ke Rek BCA Virtual Account".',
        'Masukkan nomor Virtual Account.',
        'Masukkan jumlah pembayaran yang sesuai.',
        'Ikuti instruksi selanjutnya untuk menyelesaikan transaksi.'
      ],
      mobile: [
        'Buka aplikasi BCA Mobile dan Login.',
        'Pilih menu "m-Transfer" > "BCA Virtual Account".',
        'Masukkan nomor Virtual Account.',
        'Pastikan data transaksi (nama, nominal) sudah benar, lalu klik "OK".',
        'Masukkan PIN m-BCA Anda untuk memproses pembayaran.'
      ],
      ib: [
        'Buka KlikBCA dan login.',
        'Pilih menu "Transfer Dana" > "Transfer ke BCA Virtual Account".',
        'Masukkan nomor Virtual Account.',
        'Validasi transaksi menggunakan token KeyBCA Anda.'
      ]
    },
    mandiri: {
      atm: [
        'Masukkan Kartu ATM Mandiri dan PIN Anda.',
        'Pilih menu "Bayar/Beli" > "Multi Payment".',
        'Masukkan Kode Perusahaan (Biller Code) Mandiri.',
        'Masukkan Kode Bayar (Bill Key) transaksi.',
        'Pilih item tagihan yang sesuai, lalu tekan "Ya".',
        'Konfirmasi pembayaran dan simpan struk.'
      ],
      mobile: [
        'Buka aplikasi Livin\' by Mandiri dan Login.',
        'Pilih menu "Bayar" > "Multi Payment" (atau cari nama biller).',
        'Pilih penyedia jasa / masukan kode perusahaan.',
        'Masukkan Kode Bayar (Bill Key).',
        'Periksa detail tagihan, lalu masukkan PIN Livin\' Anda.'
      ],
      ib: [
        'Login ke Mandiri Internet Banking.',
        'Pilih menu "Bayar" > "Multi Payment".',
        'Pilih penyedia jasa, masukkan Kode Bayar.',
        'Konfirmasi transaksi dengan token Mandiri.'
      ]
    },
    bri: {
      atm: [
        'Masukkan Kartu ATM BRI dan PIN Anda.',
        'Pilih menu "Transaksi Lain" > "Pembayaran" > "Lainnya" > "BRIVA".',
        'Masukkan nomor BRIVA (Virtual Account).',
        'Periksa detail tagihan, pilih "Ya" untuk bayar.',
        'Ambil struk bukti pembayaran.'
      ],
      mobile: [
        'Buka aplikasi BRImo dan Login.',
        'Pilih menu "BRIVA" > "Pembayaran Baru".',
        'Masukkan nomor BRIVA (Virtual Account).',
        'Periksa info nominal pembayaran, lalu klik "Bayar".',
        'Masukkan PIN BRImo Anda untuk memproses pembayaran.'
      ],
      ib: [
        'Login ke Internet Banking BRI.',
        'Pilih menu "Pembayaran" > "BRIVA".',
        'Masukkan nomor Virtual Account BRIVA.',
        'Ikuti langkah verifikasi token untuk menyelesaikan.'
      ]
    },
    bni: {
      atm: [
        'Masukkan Kartu ATM BNI dan PIN Anda.',
        'Pilih menu "Menu Lain" > "Transfer" > "Jenis Rekening" > "Ke Rekening Tabungan" > "Virtual Account Billing".',
        'Masukkan nomor Virtual Account Billing.',
        'Pilih nominal pembayaran, pilih "Ya" untuk bayar.',
        'Simpan struk transaksi.'
      ],
      mobile: [
        'Buka aplikasi BNI Mobile Banking dan Login.',
        'Pilih menu "Transfer" > "Virtual Account Billing".',
        'Pilih rekening debet, lalu masukkan nomor Virtual Account.',
        'Pastikan detail pembayaran sesuai, masukkan password transaksi Anda.'
      ],
      ib: [
        'Login ke BNI Internet Banking.',
        'Pilih menu "Transfer" > "Virtual Account Billing".',
        'Masukkan nomor Virtual Account BNI.',
        'Gunakan token BNI untuk verifikasi dan selesaikan pembayaran.'
      ]
    },
    permata: {
      atm: [
        'Masukkan Kartu ATM Permata dan PIN Anda.',
        'Pilih menu "Transaksi Lainnya" > "Pembayaran" > "Pembayaran Lainnya" > "Virtual Account".',
        'Masukkan nomor Permata Virtual Account.',
        'Pilih rekening sumber dana, periksa detail tagihan, lalu pilih "Benar".',
        'Simpan struk transaksi.'
      ],
      mobile: [
        'Buka aplikasi PermataMobile X dan Login.',
        'Pilih menu "Bayar" > "Virtual Account".',
        'Masukkan nomor Virtual Account.',
        'Periksa nominal tagihan, masukkan PIN PermataMobile X Anda.'
      ],
      ib: [
        'Login ke PermataNet.',
        'Pilih menu "Pembayaran" > "Virtual Account".',
        'Masukkan nomor Virtual Account.',
        'Konfirmasi transaksi dengan token Permata.'
      ]
    }
  }

  const bankInstructions = instructions[bank]
  if (!bankInstructions) return null

  return (
    <div className="mt-4 border border-gray-100 rounded-lg overflow-hidden bg-gray-50">
      <div className="flex border-b border-gray-100 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('atm')}
          className={`flex-1 py-2 text-center transition-colors ${activeTab === 'atm' ? 'bg-white text-primary-600 border-b-2 border-primary-500 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
        >
          ATM
        </button>
        <button
          onClick={() => setActiveTab('mobile')}
          className={`flex-1 py-2 text-center transition-colors ${activeTab === 'mobile' ? 'bg-white text-primary-600 border-b-2 border-primary-500 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
        >
          M-Banking
        </button>
        <button
          onClick={() => setActiveTab('ib')}
          className={`flex-1 py-2 text-center transition-colors ${activeTab === 'ib' ? 'bg-white text-primary-600 border-b-2 border-primary-500 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Internet Banking
        </button>
      </div>
      <div className="p-4 bg-white">
        <ol className="list-decimal pl-4 text-[11px] text-gray-600 space-y-2">
          {bankInstructions[activeTab].map((step, idx) => (
            <li key={idx} className="leading-relaxed">{step}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/**
 * Order Detail Page - Zalora style order tracking
 */
function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [reviewModalProduct, setReviewModalProduct] = useState(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/shop/login', { replace: true, state: { from: { pathname: `/shop/order/${id}` } } })
    }
  }, [user, id, navigate])

  const handleCompleteOrder = async () => {
    if (!window.confirm('Konfirmasi bahwa barang sudah Anda terima dengan baik? Pesanan akan ditandai selesai.')) {
      return
    }

    setIsCompleting(true)
    try {
      const result = await completeOrder(id)
      if (result.success) {
        alert(result.message || 'Pesanan berhasil diselesaikan. Terima kasih!')
        fetchOrder()
      } else {
        alert(`Gagal menyelesaikan pesanan: ${result.error || 'Terjadi kesalahan'}`)
      }
    } catch (err) {
      console.error('Failed to complete order:', err)
      alert('Terjadi kesalahan saat menyelesaikan pesanan')
    } finally {
      setIsCompleting(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) {
      return
    }

    setIsCancelling(true)
    try {
      const result = await cancelOrder(id)
      if (result.success) {
        alert('Pesanan berhasil dibatalkan.')
        fetchOrder()
      } else {
        alert(`Gagal membatalkan pesanan: ${result.error || 'Terjadi kesalahan'}`)
      }
    } catch (err) {
      console.error('Failed to cancel order:', err)
      alert('Terjadi kesalahan saat membatalkan pesanan')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleSimulatePayment = async () => {
    if (!id) return
    setIsSimulating(true)
    const result = await simulateOrderPayment(id)
    if (result.success) {
      fetchOrder()
    } else {
      alert(`Gagal simulasi pembayaran: ${result.error}`)
    }
    setIsSimulating(false)
  }

  const fetchOrder = useCallback(async () => {
    if (!id || !user) return
    setLoading(true)
    setError(null)
    try {
      const result = await getOrderById(id)
      if (result.success && result.order) {
        setOrder(result.order)
      } else {
        setError(result.error || 'Gagal memuat detail pesanan')
      }
    } catch (err) {
      logError('Error loading order detail', err)
      setError('Terjadi kesalahan saat memuat detail pesanan')
    } finally {
      setLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // Polling for payment status verification (real-time updates)
  useEffect(() => {
    if (!id || !order || order.paymentStatus !== 'PENDING') return

    const interval = setInterval(() => {
      getOrderById(id).then(result => {
        if (result.success && result.order) {
          if (result.order.paymentStatus !== order.paymentStatus || result.order.status !== order.status) {
            setOrder(result.order)
          }
        }
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [id, order])

  // Shipping calculation (dynamic from order)
  const shippingFee = order ? Number(order.shippingFee || 15000) : 15000

  // Status mapping
  const statusConfig = useMemo(() => {
    const config = {
      PENDING: { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', step: 1 },
      PROCESSING: { label: 'Dikemas', color: 'bg-blue-100 text-blue-800 border-blue-200', step: 2 },
      SHIPPED: { label: 'Dikirim', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', step: 3 },
      DELIVERED: { label: 'Selesai', color: 'bg-green-100 text-green-800 border-green-200', step: 4 },
      CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800 border-red-200', step: 0 },
    }
    return config[order?.status] || { label: order?.status, color: 'bg-gray-100 text-gray-800', step: 1 }
  }, [order])

  // Get selected bank for transfer manual
  const selectedBank = useMemo(() => {
    if (!order?.paymentMethod) return null
    if (order.paymentMethod.startsWith('TRANSFER_')) {
      return order.paymentMethod.split('_')[1].toLowerCase() // bca / mandiri / bri
    }
    return null
  }, [order])

  // Map payment method to readable label
  const paymentMethodLabel = useMemo(() => {
    if (!order?.paymentMethod) return ''
    if (order.paymentMethod === 'COD') return 'Cash on Delivery (COD)'
    if (order.paymentMethod === 'MIDTRANS') return 'Pembayaran Online (Midtrans)'
    if (order.paymentMethod === 'QRIS') return 'QRIS (Otomatis)'
    if (order.paymentMethod.startsWith('TRANSFER_')) {
      const bankName = order.paymentMethod.split('_')[1]
      return `Transfer Bank VA (${bankName})`
    }
    return 'Transfer Bank'
  }, [order])

  // Copy helper
  const handleCopy = (text, elementId) => {
    navigator.clipboard.writeText(text)
    const element = document.getElementById(elementId)
    if (element) {
      element.innerText = 'Tersalin!'
      setTimeout(() => {
        element.innerText = 'Salin'
      }, 2000)
    }
  }

  // Midtrans pay trigger
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
      onError: (err) => {
        console.error('Midtrans payment error:', err)
        alert('Pembayaran gagal, silakan coba lagi.')
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <ShopNavigation />
        <main className="container-custom py-20">
          <Loading message="Memuat detail pesanan..." />
        </main>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <ShopNavigation />
        <main className="container-custom py-20">
          <ErrorMessage
            message={error || 'Pesanan tidak ditemukan'}
            onRetry={fetchOrder}
          />
          <div className="text-center mt-6">
            <Link
              to="/shop/profile"
              className="inline-flex items-center gap-2 text-sm font-heading font-medium text-black hover:text-primary-600 transition-colors uppercase tracking-wider"
            >
              <Icon name="ChevronLeft" size={16} />
              Kembali ke Akun Saya
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ShopNavigation />

      <main className="container-custom py-8 max-w-4xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/shop/profile"
            className="inline-flex items-center gap-1.5 text-xs font-heading font-medium text-gray-500 hover:text-black uppercase tracking-wider transition-colors"
          >
            <Icon name="ChevronLeft" size={14} />
            Kembali ke Akun
          </Link>
        </div>

        {/* Order Header Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">ID PESANAN</p>
              <h1 className="text-lg font-heading font-semibold text-gray-900">
                #{order.id.slice(-12).toUpperCase()}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Dibuat pada {formatDateTime(order.createdAt)}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-xs font-heading font-medium border ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Progress Tracker Timeline */}
          {order.status !== 'CANCELLED' && (
            <div className="pt-8 pb-4">
              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0 hidden md:block"></div>
                <div 
                  className="absolute top-1/2 left-0 h-0.5 bg-primary-600 -translate-y-1/2 z-0 hidden md:block transition-all duration-500"
                  style={{
                    width: `${((statusConfig.step - 1) / 3) * 100}%`
                  }}
                ></div>

                {/* Steps */}
                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 md:gap-0">
                  {/* Step 1: Placed */}
                  <div className="flex md:flex-col items-center gap-3 md:gap-2 text-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                      statusConfig.step >= 1 
                        ? 'bg-primary-600 border-primary-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {statusConfig.step > 1 ? '✓' : '1'}
                    </div>
                    <div>
                      <p className="text-xs font-heading font-semibold text-gray-900">Menunggu Pembayaran</p>
                      <p className="text-[10px] text-gray-400">Verifikasi Transaksi</p>
                    </div>
                  </div>

                  {/* Step 2: Processing */}
                  <div className="flex md:flex-col items-center gap-3 md:gap-2 text-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                      statusConfig.step >= 2 
                        ? 'bg-primary-600 border-primary-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {statusConfig.step > 2 ? '✓' : '2'}
                    </div>
                    <div>
                      <p className="text-xs font-heading font-semibold text-gray-900">Dikemas</p>
                      <p className="text-[10px] text-gray-400">Penyiapan Produk</p>
                    </div>
                  </div>

                  {/* Step 3: Shipped */}
                  <div className="flex md:flex-col items-center gap-3 md:gap-2 text-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                      statusConfig.step >= 3 
                        ? 'bg-primary-600 border-primary-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {statusConfig.step > 3 ? '✓' : '3'}
                    </div>
                    <div>
                      <p className="text-xs font-heading font-semibold text-gray-900">Dikirim</p>
                      <p className="text-[10px] text-gray-400">Pesanan Diperjalanan</p>
                    </div>
                  </div>

                  {/* Step 4: Delivered */}
                  <div className="flex md:flex-col items-center gap-3 md:gap-2 text-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                      statusConfig.step >= 4 
                        ? 'bg-primary-600 border-primary-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      4
                    </div>
                    <div>
                      <p className="text-xs font-heading font-semibold text-gray-900">Selesai</p>
                      <p className="text-[10px] text-gray-400">Diterima Pembeli</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Alert */}
          {order.status === 'CANCELLED' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
              <Icon name="AlertCircle" className="text-red-500 mt-0.5" size={20} />
              <div>
                <h4 className="text-xs font-heading font-semibold text-red-900">Pesanan Dibatalkan</h4>
                <p className="text-[11px] text-red-700 mt-0.5">
                  Pesanan ini telah dibatalkan. Dana (jika ada) akan dikembalikan sesuai kebijakan retur.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bank Transfer Instructions */}
        {order?.paymentMethod?.startsWith('TRANSFER') && order?.paymentStatus === 'PENDING' && (
          <div className="bg-white border border-gray-200 p-6 mb-6 rounded-lg animate-fadeIn">
            <h2 className="text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
              Selesaikan Pembayaran
            </h2>
            
            <PaymentCountdown expiredAt={order.paymentDetails?.expiredAt} createdAt={order.createdAt} />
            
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Silakan lakukan transfer sebesar <strong className="text-primary-600 font-bold">{formatCurrency(order.paymentDetails?.grossAmount || (Number(order.totalAmount) + shippingFee))}</strong> (termasuk ongkir) ke rekening/Virtual Account di bawah ini:
            </p>

            <div className="space-y-4">
              {order.paymentDetails ? (
                // Real Virtual Account details from Midtrans
                <div className="p-4 border border-primary-100 bg-primary-50/5 rounded-lg text-left">
                  {order.paymentDetails.isMock && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center animate-pulse">
                      <p className="text-[10px] text-yellow-800 font-semibold uppercase tracking-wider mb-2">
                        ⚠️ MODE TESTING OFFLINE / SIMULASI
                      </p>
                      <p className="text-[10px] text-gray-500 mb-3">
                        Channel pembayaran belum diaktifkan di Midtrans. Anda dapat menguji alur pembayaran secara penuh menggunakan tombol simulasi di bawah ini.
                      </p>
                      <button
                        type="button"
                        onClick={handleSimulatePayment}
                        disabled={isSimulating}
                        className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-semibold text-[10px] py-1.5 px-4 rounded transition-colors uppercase tracking-wider shadow-sm"
                      >
                        {isSimulating ? 'Memproses...' : 'Simulasikan Bayar Lunas'}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-heading font-bold bg-primary-50 text-primary-700 px-2.5 py-1 rounded uppercase tracking-wider">
                      {order.paymentDetails.bankName} Virtual Account
                    </span>
                    <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                      Verifikasi Otomatis
                    </span>
                  </div>

                  {order.paymentDetails.bankName === 'MANDIRI' ? (
                    // Mandiri biller code and bill key
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Kode Perusahaan (Biller Code)</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-base font-mono text-gray-900 font-bold tracking-wider">{order.paymentDetails.billerCode}</p>
                          <button
                            onClick={() => handleCopy(order.paymentDetails.billerCode, 'detail-copy-biller')}
                            id="detail-copy-biller"
                            className="text-[10px] text-primary-600 hover:text-primary-700 font-semibold px-2.5 py-1 border border-primary-200 hover:border-primary-300 rounded bg-white transition-colors"
                          >
                            Salin
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Kode Bayar (Bill Key)</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-base font-mono text-gray-900 font-bold tracking-wider">{order.paymentDetails.billKey}</p>
                          <button
                            onClick={() => handleCopy(order.paymentDetails.billKey, 'detail-copy-billkey')}
                            id="detail-copy-billkey"
                            className="text-[10px] text-primary-600 hover:text-primary-700 font-semibold px-2.5 py-1 border border-primary-200 hover:border-primary-300 rounded bg-white transition-colors"
                          >
                            Salin
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // BCA, BNI, BRI, Permata VA Number
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Nomor Virtual Account</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-lg font-mono text-gray-900 font-bold tracking-wider">{order.paymentDetails.vaNumber}</p>
                        <button
                          onClick={() => handleCopy(order.paymentDetails.vaNumber, 'detail-copy-va')}
                          id="detail-copy-va"
                          className="text-[10px] text-primary-600 hover:text-primary-700 font-semibold px-2.5 py-1 border border-primary-200 hover:border-primary-300 rounded bg-white transition-colors"
                        >
                          Salin
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider font-body">Jumlah Pembayaran</p>
                      <p className="text-sm font-heading font-semibold text-primary-600 mt-0.5">
                        {formatCurrency(order.paymentDetails.grossAmount)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(String(order.paymentDetails.grossAmount), 'detail-copy-amount')}
                      id="detail-copy-amount"
                      className="text-[10px] text-primary-600 hover:text-primary-700 font-semibold px-2.5 py-1 border border-primary-200 hover:border-primary-300 rounded bg-white transition-colors"
                    >
                      Salin Jumlah
                    </button>
                  </div>

                  <p className="text-[10px] font-heading font-semibold text-gray-900 uppercase tracking-wider mt-4 mb-2 text-left">
                    Petunjuk Pembayaran:
                  </p>
                  <PaymentInstructions bank={selectedBank} />
                </div>
              ) : (
                // Fallback to dummy account numbers if paymentDetails not populated
                <>
                  {(!selectedBank || selectedBank === 'bca') && (
                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-300 transition-colors bg-white text-left">
                      <div>
                        <p className="text-xs font-heading font-semibold text-gray-900">BCA</p>
                        <p className="text-sm font-mono text-gray-700 font-bold mt-1">8123-456-789</p>
                        <p className="text-[10px] text-gray-400">a.n. Toko Usaha Anda</p>
                      </div>
                      <button 
                        onClick={() => handleCopy('8123456789', 'detail-copy-bca')}
                        id="detail-copy-bca"
                        className="text-[10px] text-primary-600 hover:text-primary-700 font-semibold px-2.5 py-1 border border-primary-200 hover:border-primary-300 rounded"
                      >
                        Salin
                      </button>
                    </div>
                  )}

                  {(!selectedBank || selectedBank === 'mandiri') && (
                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-300 transition-colors bg-white text-left">
                      <div>
                        <p className="text-xs font-heading font-semibold text-gray-900">MANDIRI</p>
                        <p className="text-sm font-mono text-gray-700 font-bold mt-1">123-00-1234567-8</p>
                        <p className="text-[10px] text-gray-400">a.n. Toko Usaha Anda</p>
                      </div>
                      <button 
                        onClick={() => handleCopy('1230012345678', 'detail-copy-mandiri')}
                        id="detail-copy-mandiri"
                        className="text-[10px] text-primary-600 hover:text-primary-700 font-semibold px-2.5 py-1 border border-primary-200 hover:border-primary-300 rounded"
                      >
                        Salin
                      </button>
                    </div>
                  )}

                  {(!selectedBank || selectedBank === 'bri') && (
                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-300 transition-colors bg-white text-left">
                      <div>
                        <p className="text-xs font-heading font-semibold text-gray-900">BRI</p>
                        <p className="text-sm font-mono text-gray-700 font-bold mt-1">0123-01-234567-89-0</p>
                        <p className="text-[10px] text-gray-400">a.n. Toko Usaha Anda</p>
                      </div>
                      <button 
                        onClick={() => handleCopy('012301234567890', 'detail-copy-bri')}
                        id="detail-copy-bri"
                        className="text-[10px] text-primary-600 hover:text-primary-700 font-semibold px-2.5 py-1 border border-primary-200 hover:border-primary-300 rounded"
                      >
                        Salin
                      </button>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-left">
                    <p className="text-[10px] text-yellow-800 leading-relaxed">
                      💡 Setelah mentransfer, silakan hubungi admin via WhatsApp untuk menyertakan bukti transfer agar status pesanan diverifikasi menjadi <strong>Dikemas</strong>.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* QRIS Instructions */}
        {order?.paymentMethod === 'QRIS' && order?.paymentStatus === 'PENDING' && (
          <div className="bg-white border border-gray-200 p-6 mb-6 rounded-lg text-center animate-fadeIn">
            <h2 className="text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
              Selesaikan Pembayaran QRIS
            </h2>
            
            <PaymentCountdown expiredAt={order.paymentDetails?.expiredAt} createdAt={order.createdAt} />
            
            {order.paymentDetails?.isMock && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-xs mx-auto text-center animate-pulse">
                <p className="text-[10px] text-yellow-800 font-semibold uppercase tracking-wider mb-2">
                  ⚠️ MODE TESTING OFFLINE / SIMULASI
                </p>
                <p className="text-[10px] text-gray-500 mb-3">
                  Selesaikan alur pembayaran testing offline dengan menekan tombol di bawah.
                </p>
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isSimulating}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-semibold text-[10px] py-1.5 px-4 rounded transition-colors uppercase tracking-wider shadow-sm"
                >
                  {isSimulating ? 'Memproses...' : 'Simulasikan Bayar Lunas'}
                </button>
              </div>
            )}

            <p className="text-xs text-gray-600 mb-2 leading-relaxed">
              Scan kode QRIS di bawah menggunakan GoPay, OVO, Dana, LinkAja, ShopeePay atau Mobile Banking:
            </p>

            <div className="my-5 p-4 border border-gray-100 rounded-xl bg-white shadow-inner max-w-[240px] mx-auto flex items-center justify-center">
              {order.paymentDetails?.qrUrl ? (
                <img 
                  src={order.paymentDetails.qrUrl} 
                  alt="QRIS Code" 
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-50 text-gray-400 text-[10px]">
                  Gagal memuat QRIS Code
                </div>
              )}
            </div>

            <div className="bg-primary-50/50 p-3 rounded-lg mb-4 text-left border border-primary-50">
              <p className="text-[10px] text-primary-800 font-semibold flex items-center justify-center gap-1.5 mb-1.5 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-ping"></span>
                Jumlah Tagihan
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-mono font-bold text-primary-700 mx-auto animate-pulse">
                  {formatCurrency(order.paymentDetails?.grossAmount || (Number(order.totalAmount) + shippingFee))}
                </span>
                <button
                  onClick={() => handleCopy(String(order.paymentDetails?.grossAmount || (Number(order.totalAmount) + shippingFee)), 'detail-copy-qris-amount')}
                  id="detail-copy-qris-amount"
                  className="text-[9px] text-primary-600 font-semibold px-2 py-0.5 border border-primary-200 rounded bg-white hover:bg-primary-50 transition-colors"
                >
                  Salin
                </button>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-left">
              <p className="text-[10px] text-yellow-800 leading-relaxed">
                💡 <strong>Verifikasi Otomatis:</strong> Setelah scan dan memasukkan PIN e-wallet Anda, transaksi Anda terkonfirmasi otomatis oleh sistem. Status di halaman ini akan terupdate secara real-time.
              </p>
            </div>
          </div>
        )}

        {/* Midtrans Re-pay Instructions Card (New) */}
        {order.paymentMethod === 'MIDTRANS' && order.paymentStatus === 'PENDING' && (
          <div className="bg-white border border-gray-200 p-6 mb-6 rounded-lg text-center">
            <h2 className="text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider mb-2">
              Selesaikan Pembayaran Online Anda
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Silakan selesaikan pembayaran online Anda via QRIS (GoPay/ShopeePay), Virtual Account, dll.
            </p>
            <button
              onClick={handlePayNow}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs py-2 px-6 rounded-full transition-colors uppercase tracking-wider shadow-md inline-flex items-center gap-1.5"
            >
              <Icon name="Wallet" size={14} />
              Bayar Sekarang
            </button>
          </div>
        )}

        {/* Cancel Order Card */}
        {order.status === 'PENDING' && (
          <div className="bg-white border border-red-100 p-6 mb-6 rounded-lg text-center shadow-sm">
            <h2 className="text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider mb-2">
              Ingin Membatalkan Pesanan?
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Anda masih dapat membatalkan pesanan ini secara instan selama pembayaran belum diselesaikan.
            </p>
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium text-xs py-2 px-6 rounded-full transition-colors uppercase tracking-wider shadow-sm inline-flex items-center gap-1.5"
            >
              {isCancelling ? (
                <>
                  <Icon name="Loader2" size={14} className="animate-spin" />
                  Membatalkan...
                </>
              ) : (
                <>
                  <Icon name="X" size={14} />
                  Batalkan Pesanan
                </>
              )}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Items & Pricing (Left / Main) */}
          <div className="md:col-span-2 space-y-6">
            {/* Products List */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                Rincian Produk
              </h2>
              
              <div className="divide-y divide-gray-100">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                    {/* Item Image */}
                    <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={item.product?.image || item.product?.imageUrl || '/placeholder.jpg'}
                        alt={item.product?.name || 'Produk'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder.jpg'
                        }}
                      />
                    </div>

                    {/* Item details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-heading font-medium text-gray-900 line-clamp-2">
                        {item.product?.name}
                      </h3>
                      {item.product?.category && (
                        <p className="text-[10px] text-gray-400 uppercase mt-0.5">
                          {item.product.category.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {item.quantity} x {formatCurrency(Number(item.price))}
                      </p>
                    </div>

                    {/* Total Price Per Item */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-heading font-semibold text-gray-900">
                        {formatCurrency(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Price Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                Rincian Pembayaran
              </h2>
              
              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal Produk</span>
                  <span className="font-medium text-gray-900">{formatCurrency(Number(order.totalAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kurir Pengiriman</span>
                  <span className="font-semibold text-gray-900">{order.shippingCourier || 'JNE'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Pengiriman</span>
                  <span className="font-medium text-gray-900">{formatCurrency(shippingFee)}</span>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-heading font-semibold text-gray-900">
                  <span>Total Pembayaran</span>
                  <span className="text-primary-600">{formatCurrency(Number(order.totalAmount) + shippingFee)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Methods (Right / Sidebar) */}
          <div className="md:col-span-1 space-y-6">
            {/* Courier Tracking Card */}
            {(order.status === 'SHIPPED' || order.status === 'DELIVERED' || order.status === 'PROCESSING') && (
              <div className="bg-white border border-primary-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <div className="w-6 h-6 rounded bg-primary-100 text-primary-700 flex items-center justify-center">
                    <Icon name="Truck" size={14} />
                  </div>
                  <h2 className="text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider">
                    Status Pengiriman
                  </h2>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Ekspedisi:</span>
                    <strong className="text-gray-900">{order.shippingCourier || 'JNE'}</strong>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Nomor Resi:</span>
                    <span className="font-mono font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                      {order.paymentDetails?.shippingDetails?.trackingNumber || `RESI-${(order.shippingCourier || 'JNE').toUpperCase()}-${order.id.slice(0, 8).toUpperCase()}`}
                    </span>
                  </div>
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowTrackingModal(true)}
                      className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Icon name="Truck" size={14} />
                      <span>Lacak Posisi Paket</span>
                    </button>

                    {order.status === 'SHIPPED' && (
                      <>
                        <button
                          type="button"
                          disabled={isCompleting}
                          onClick={handleCompleteOrder}
                          className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                          <Icon name="CheckCircle" size={14} />
                          <span>{isCompleting ? 'Memproses...' : 'Pesanan Diterima (Selesai)'}</span>
                        </button>

                        {!order.paymentDetails?.disputeDetails?.isDisputed && (
                          <button
                            type="button"
                            onClick={() => setShowDisputeModal(true)}
                            className="w-full py-2 px-4 bg-white hover:bg-gray-50 border border-amber-300 text-amber-800 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                          >
                            <Icon name="AlertCircle" size={14} />
                            <span>Ajukan Komplain / Pengembalian</span>
                          </button>
                        )}

                        {!order.paymentDetails?.disputeDetails?.isDisputed && (
                          <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-100 flex items-center gap-1.5">
                            <Icon name="Clock" size={13} className="text-amber-600 shrink-0" />
                            <span>Pesanan otomatis masuk ke selesai dalam <strong>2 hari</strong> setelah barang sampai jika belum dikonfirmasi.</span>
                          </p>
                        )}
                      </>
                    )}

                    {order.status === 'DELIVERED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setReviewModalProduct(order.items[0]?.product)}
                          className="w-full py-2 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                          <Icon name="Star" size={14} className="fill-amber-400 text-amber-500" />
                          <span>Beri Ulasan & Rating Bintang</span>
                        </button>
                        {!order.paymentDetails?.disputeDetails?.isDisputed && (
                          <button
                            type="button"
                            onClick={() => setShowDisputeModal(true)}
                            className="w-full py-2 px-4 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                          >
                            <Icon name="AlertCircle" size={14} />
                            <span>Ajukan Komplain / Pengembalian</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* Dispute Banner if active */}
                    {order.paymentDetails?.disputeDetails?.isDisputed && (
                      <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900 space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <Icon name="AlertTriangle" size={14} className="text-amber-600" />
                            <span>Komplain Ditinjau Admin</span>
                          </span>
                          <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded">Ditangguhkan</span>
                        </div>
                        <p className="text-[11px] text-gray-700">Alasan: {order.paymentDetails.disputeDetails.reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <Icon name="MapPin" size={16} className="text-gray-400" />
                <h2 className="text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider">
                  Alamat Pengiriman
                </h2>
              </div>
              
              <p className="text-xs font-heading font-medium text-gray-900 mb-1">
                Penerima:
              </p>
              <p className="text-xs text-gray-600 mb-3 font-semibold">
                {order.shippingPhone}
              </p>
              
              <p className="text-xs font-heading font-medium text-gray-900 mb-1">
                Alamat lengkap:
              </p>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                {order.shippingAddress}
              </p>
              
              {order.latitude && order.longitude && (
                <div className="mt-2 text-xs text-gray-600">
                  <p className="font-heading font-medium text-gray-900 mb-1">Koordinat Lokasi:</p>
                  <p className="text-[10px] font-mono text-gray-500 mb-2">{order.latitude}, {order.longitude}</p>
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

            {/* Payment Method Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <Icon name="Wallet" size={16} className="text-gray-400" />
                <h2 className="text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider">
                  Metode Pembayaran
                </h2>
              </div>
              
              <p className="text-xs font-heading font-semibold text-gray-900">
                {paymentMethodLabel}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Status Pembayaran: <span className="font-semibold text-gray-600">{order.paymentStatus === 'PAID' ? 'Lunas' : 'Menunggu Pembayaran'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showTrackingModal && (
          <TrackingModal
            orderId={order.id}
            onClose={() => setShowTrackingModal(false)}
          />
        )}
        {showDisputeModal && (
          <DisputeModal
            order={order}
            onClose={() => setShowDisputeModal(false)}
            onSuccess={() => fetchOrder()}
          />
        )}
        {reviewModalProduct && (
          <ReviewModal
            orderId={order.id}
            product={reviewModalProduct}
            onClose={() => setReviewModalProduct(null)}
            onSuccess={() => fetchOrder()}
          />
        )}
      </main>
    </div>
  )
}

export default OrderDetailPage
