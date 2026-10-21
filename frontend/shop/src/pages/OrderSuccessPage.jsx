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
    <div className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-lg text-center font-medium my-4 text-xs flex items-center justify-center gap-2">
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
 * Order Success Page - Complete checkout success view
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
      // Re-fetch order status to trigger UI update
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
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // Polling for payment status verification (real-time updates)
  useEffect(() => {
    if (!orderId || !order || order.paymentStatus !== 'PENDING') return

    const interval = setInterval(() => {
      getOrderById(orderId).then(result => {
        if (result.success && result.order) {
          if (result.order.paymentStatus !== order.paymentStatus || result.order.status !== order.status) {
            setOrder(result.order)
          }
        }
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [orderId, order])

  // Shipping fee (dynamic from order)
  const shippingFee = order ? Number(order.shippingFee || 15000) : 15000

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
      onError: (err) => {
        console.error('Midtrans payment error:', err)
        alert('Pembayaran gagal, silakan coba lagi.')
      }
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
      return order.paymentMethod.split('_')[1].toLowerCase() // bca / mandiri / bri
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
            <ErrorMessage
              message={error}
              onRetry={() => navigate('/shop')}
            />
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
                <div className="p-4 border border-primary-100 bg-primary-50/5 rounded-lg">
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
                            onClick={() => handleCopy(order.paymentDetails.billerCode, 'copy-biller')}
                            id="copy-biller"
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
                            onClick={() => handleCopy(order.paymentDetails.billKey, 'copy-billkey')}
                            id="copy-billkey"
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
                          onClick={() => handleCopy(order.paymentDetails.vaNumber, 'copy-va')}
                          id="copy-va"
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
                      onClick={() => handleCopy(String(order.paymentDetails.grossAmount), 'copy-amount')}
                      id="copy-amount"
                      className="text-[10px] text-primary-600 hover:text-primary-700 font-semibold px-2.5 py-1 border border-primary-200 hover:border-primary-300 rounded bg-white transition-colors"
                    >
                      Salin Jumlah
                    </button>
                  </div>

                  <p className="text-[10px] font-heading font-semibold text-gray-900 uppercase tracking-wider mt-4 mb-2">
                    Petunjuk Pembayaran:
                  </p>
                  <PaymentInstructions bank={selectedBank} />
                </div>
              ) : (
                // Fallback to dummy account numbers if paymentDetails not populated
                <>
                  {(!selectedBank || selectedBank === 'bca') && (
                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-300 transition-colors bg-white">
                      <div>
                        <p className="text-xs font-heading font-semibold text-gray-900">BCA</p>
                        <p className="text-sm font-mono text-gray-700 font-bold mt-1">8123-456-789</p>
                        <p className="text-[10px] text-gray-400">a.n. Toko Usaha Anda</p>
                      </div>
                      <button 
                        onClick={() => handleCopy('8123456789', 'copy-bca')}
                        id="copy-bca"
                        className="text-[10px] text-primary-600 hover:text-primary-700 font-semibold px-2.5 py-1 border border-primary-200 hover:border-primary-300 rounded"
                      >
                        Salin
                      </button>
                    </div>
                  )}

                  {(!selectedBank || selectedBank === 'mandiri') && (
                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-300 transition-colors bg-white">
                      <div>
                        <p className="text-xs font-heading font-semibold text-gray-900">MANDIRI</p>
                        <p className="text-sm font-mono text-gray-700 font-bold mt-1">123-00-1234567-8</p>
                        <p className="text-[10px] text-gray-400">a.n. Toko Usaha Anda</p>
                      </div>
                      <button 
                        onClick={() => handleCopy('1230012345678', 'copy-mandiri')}
                        id="copy-mandiri"
                        className="text-[10px] text-primary-600 hover:text-primary-700 font-semibold px-2.5 py-1 border border-primary-200 hover:border-primary-300 rounded"
                      >
                        Salin
                      </button>
                    </div>
                  )}

                  {(!selectedBank || selectedBank === 'bri') && (
                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-300 transition-colors bg-white">
                      <div>
                        <p className="text-xs font-heading font-semibold text-gray-900">BRI</p>
                        <p className="text-sm font-mono text-gray-700 font-bold mt-1">0123-01-234567-89-0</p>
                        <p className="text-[10px] text-gray-400">a.n. Toko Usaha Anda</p>
                      </div>
                      <button 
                        onClick={() => handleCopy('012301234567890', 'copy-bri')}
                        id="copy-bri"
                        className="text-[10px] text-primary-600 hover:text-primary-700 font-semibold px-2.5 py-1 border border-primary-200 hover:border-primary-300 rounded"
                      >
                        Salin
                      </button>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <p className="text-[10px] text-yellow-800 leading-relaxed">
                      💡 <strong>Penting:</strong> Setelah mentransfer, hubungi Admin via WhatsApp atau perbarui ulasan pembayaran dengan mengirimkan bukti transaksi agar status pesanan berubah menjadi <strong>Dikemas</strong>.
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
                <span className="text-lg font-mono font-bold text-primary-700 mx-auto">
                  {formatCurrency(order.paymentDetails?.grossAmount || (Number(order.totalAmount) + shippingFee))}
                </span>
                <button
                  onClick={() => handleCopy(String(order.paymentDetails?.grossAmount || (Number(order.totalAmount) + shippingFee)), 'copy-qris-amount')}
                  id="copy-qris-amount"
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

        {/* Midtrans Payment Pending - Show Retry Payment Button */}
        {order?.paymentMethod === 'MIDTRANS' && order?.paymentStatus === 'PENDING' && (
          <div className="bg-white border border-gray-200 p-6 mb-6 rounded-lg text-center">
            <h2 className="text-sm font-heading font-semibold text-gray-900 uppercase tracking-wider mb-2">
              Menunggu Pembayaran Online
            </h2>
            <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">
              Pembayaran online Anda belum diselesaikan. Selesaikan pembayaran menggunakan QRIS, Virtual Account, dll.
            </p>
            
            <button
              onClick={handlePayNow}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs py-2.5 px-6 rounded-full transition-colors uppercase tracking-wider shadow-md hover:shadow-lg inline-flex items-center gap-2"
            >
              <Icon name="Wallet" size={14} />
              Bayar Sekarang
            </button>
          </div>
        )}

        {/* Order Details Card */}
        {order && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
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
                <span className="font-semibold text-gray-900">
                  {paymentMethodLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status Pembayaran:</span>
                <span className="font-semibold text-gray-900">
                  {order.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal Produk:</span>
                <span className="font-medium text-gray-900">{formatCurrency(Number(order.totalAmount))}</span>
              </div>
              <div className="flex justify-between">
                <span>Kurir Pengiriman:</span>
                <span className="font-semibold text-gray-900">{order.shippingCourier || 'JNE'}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Pengiriman:</span>
                <span className="font-medium text-gray-900">{formatCurrency(shippingFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-heading font-semibold text-gray-900 pt-2 border-t border-dashed border-gray-100">
                <span>Total Pembayaran:</span>
                <span className="text-primary-600">{formatCurrency(Number(order.totalAmount) + shippingFee)}</span>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h3 className="text-[10px] font-heading font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Item Pembelian
              </h3>
              <div className="divide-y divide-gray-50">
                {order.items?.map((item, index) => (
                  <div key={index} className="py-2.5 first:pt-0 last:pb-0 flex justify-between text-xs">
                    <span className="text-gray-600">
                      {item.product?.name || 'Produk'} <strong className="text-gray-900">x{item.quantity}</strong>
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
          </div>
        )}

        {/* Actions Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/shop" className="flex-1">
            <Button variant="primary" fullWidth size="md" className="uppercase tracking-wider text-xs">
              Lanjutkan Belanja
            </Button>
          </Link>
          <Link to="/shop/profile" className="flex-1">
            <Button variant="outline" fullWidth size="md" className="uppercase tracking-wider text-xs">
              Lihat Riwayat Pesanan
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

export default OrderSuccessPage
