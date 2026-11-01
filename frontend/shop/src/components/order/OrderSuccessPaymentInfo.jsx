import { useState } from 'react'
import Icon from '@shared/components/Icon.jsx'
import { formatCurrency } from '../../utils/format'
import PaymentCountdown from './PaymentCountdown'
import PaymentInstructions from './PaymentInstructions'

/**
 * OrderSuccessPaymentInfo - Handles Bank Transfer VA, QRIS, and Online payment retry instructions
 * Redesigned with modern, premium fintech aesthetics
 */
export default function OrderSuccessPaymentInfo({
  order,
  selectedBank,
  shippingFee,
  handleCopy,
  handleSimulatePayment,
  isSimulating,
  handlePayNow,
}) {
  const [copiedId, setCopiedId] = useState(null)

  const onCopy = (text, id) => {
    handleCopy(text, id)
    setCopiedId(id)
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  const isTransfer = order?.paymentMethod?.startsWith('TRANSFER') && order?.paymentStatus === 'PENDING'
  const isQris = order?.paymentMethod === 'QRIS' && order?.paymentStatus === 'PENDING'
  const isMidtransPending = order?.paymentMethod === 'MIDTRANS' && order?.paymentStatus === 'PENDING'

  if (!isTransfer && !isQris && !isMidtransPending) {
    return null
  }

  return (
    <>
      {/* Bank Transfer Instructions */}
      {isTransfer && (
        <div className="bg-white border border-gray-100 p-6 md:p-8 mb-8 rounded-2xl animate-fadeIn shadow-lg shadow-gray-200/50">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-xs">
                <Icon name="CreditCard" size={18} />
              </div>
              <div>
                <h2 className="text-sm font-heading font-bold text-gray-900 uppercase tracking-wider">
                  Selesaikan Pembayaran Transfer Bank
                </h2>
                <p className="text-[11px] text-gray-500">
                  Verifikasi instan otomatis dari sistem banking
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              Otomatis
            </span>
          </div>

          <PaymentCountdown
            expiredAt={order.paymentDetails?.expiredAt}
            createdAt={order.createdAt}
          />

          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block">
                  Total Tagihan Transfer
                </span>
                <p className="text-xl md:text-2xl font-heading font-black text-gray-900 mt-0.5">
                  {formatCurrency(
                    order.paymentDetails?.grossAmount || Number(order.totalAmount) + shippingFee
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onCopy(
                    String(
                      order.paymentDetails?.grossAmount || Number(order.totalAmount) + shippingFee
                    ),
                    'copy-total-amount'
                  )
                }
                id="copy-total-amount"
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  copiedId === 'copy-total-amount'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-gray-800 border-gray-300 hover:border-gray-900 shadow-2xs'
                }`}
              >
                <Icon name={copiedId === 'copy-total-amount' ? 'Check' : 'Copy'} size={13} />
                <span>{copiedId === 'copy-total-amount' ? 'Tersalin!' : 'Salin Jumlah'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {order.paymentDetails ? (
              <div className="p-5 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50/50 shadow-xs">
                {order.paymentDetails.isMock && (
                  <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <p className="text-[11px] text-amber-900 font-bold uppercase tracking-wider mb-1">
                      Mode Simulasi / Testing Sandbox
                    </p>
                    <p className="text-[11px] text-amber-700 mb-2.5">
                      Klik tombol di bawah ini untuk mensimulasikan pembayaran lunas seketika.
                    </p>
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={isSimulating}
                      className="bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all uppercase tracking-wider shadow-sm"
                    >
                      {isSimulating ? 'Memproses...' : 'Simulasikan Bayar Lunas'}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pb-3.5 border-b border-gray-200/80 mb-4">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    Bank Tujuan:
                  </span>
                  <span className="text-xs font-heading font-black text-gray-900 uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-lg">
                    {order.paymentDetails.bank?.toUpperCase()} Virtual Account
                  </span>
                </div>

                {order.paymentDetails.billKey ? (
                  <div className="space-y-3.5">
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        Kode Perusahaan (Biller Code)
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-base font-mono text-gray-900 font-bold tracking-wider">
                          {order.paymentDetails.billerCode}
                        </p>
                        <button
                          type="button"
                          onClick={() => onCopy(order.paymentDetails.billerCode, 'copy-biller')}
                          id="copy-biller"
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                            copiedId === 'copy-biller'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-white text-gray-800 border-gray-300 hover:border-gray-900'
                          }`}
                        >
                          <Icon name={copiedId === 'copy-biller' ? 'Check' : 'Copy'} size={12} />
                          <span>{copiedId === 'copy-biller' ? 'Tersalin!' : 'Salin'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        Kode Bayar (Bill Key)
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-lg font-mono text-gray-900 font-bold tracking-wider">
                          {order.paymentDetails.billKey}
                        </p>
                        <button
                          type="button"
                          onClick={() => onCopy(order.paymentDetails.billKey, 'copy-billkey')}
                          id="copy-billkey"
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                            copiedId === 'copy-billkey'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-white text-gray-800 border-gray-300 hover:border-gray-900'
                          }`}
                        >
                          <Icon name={copiedId === 'copy-billkey' ? 'Check' : 'Copy'} size={12} />
                          <span>{copiedId === 'copy-billkey' ? 'Tersalin!' : 'Salin'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      Nomor Virtual Account
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xl md:text-2xl font-mono text-gray-900 font-black tracking-wider select-all">
                        {order.paymentDetails.vaNumber}
                      </p>
                      <button
                        type="button"
                        onClick={() => onCopy(order.paymentDetails.vaNumber, 'copy-va')}
                        id="copy-va"
                        className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                          copiedId === 'copy-va'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-gray-900 text-white hover:bg-black border-transparent shadow-xs'
                        }`}
                      >
                        <Icon name={copiedId === 'copy-va' ? 'Check' : 'Copy'} size={13} />
                        <span>{copiedId === 'copy-va' ? 'Tersalin!' : 'Salin VA'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-5">
                  <p className="text-xs font-heading font-bold text-gray-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Icon name="HelpCircle" size={14} className="text-gray-500" />
                    <span>Petunjuk Cara Pembayaran:</span>
                  </p>
                  <PaymentInstructions bank={selectedBank} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {(!selectedBank || selectedBank === 'bca') && (
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-2xs">
                    <div>
                      <p className="text-xs font-heading font-bold text-gray-900">BCA</p>
                      <p className="text-base font-mono text-gray-900 font-bold mt-0.5">8123-456-789</p>
                      <p className="text-[10px] text-gray-500">a.n. Toko Usaha Anda</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCopy('8123456789', 'copy-bca')}
                      id="copy-bca"
                      className="text-xs font-semibold px-3 py-1.5 border border-gray-300 hover:border-gray-900 rounded-lg bg-white"
                    >
                      {copiedId === 'copy-bca' ? 'Tersalin!' : 'Salin'}
                    </button>
                  </div>
                )}

                {(!selectedBank || selectedBank === 'mandiri') && (
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-2xs">
                    <div>
                      <p className="text-xs font-heading font-bold text-gray-900">MANDIRI</p>
                      <p className="text-base font-mono text-gray-900 font-bold mt-0.5">123-00-1234567-8</p>
                      <p className="text-[10px] text-gray-500">a.n. Toko Usaha Anda</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCopy('1230012345678', 'copy-mandiri')}
                      id="copy-mandiri"
                      className="text-xs font-semibold px-3 py-1.5 border border-gray-300 hover:border-gray-900 rounded-lg bg-white"
                    >
                      {copiedId === 'copy-mandiri' ? 'Tersalin!' : 'Salin'}
                    </button>
                  </div>
                )}

                {(!selectedBank || selectedBank === 'bri') && (
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-2xs">
                    <div>
                      <p className="text-xs font-heading font-bold text-gray-900">BRI</p>
                      <p className="text-base font-mono text-gray-900 font-bold mt-0.5">0123-01-234567-89-0</p>
                      <p className="text-[10px] text-gray-500">a.n. Toko Usaha Anda</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCopy('012301234567890', 'copy-bri')}
                      id="copy-bri"
                      className="text-xs font-semibold px-3 py-1.5 border border-gray-300 hover:border-gray-900 rounded-lg bg-white"
                    >
                      {copiedId === 'copy-bri' ? 'Tersalin!' : 'Salin'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern QRIS Instructions */}
      {isQris && (
        <div className="bg-white border border-gray-100 p-6 md:p-8 mb-8 rounded-2xl text-center animate-fadeIn shadow-lg shadow-gray-200/50">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-xs">
                <Icon name="QrCode" size={18} />
              </div>
              <div>
                <h2 className="text-sm font-heading font-bold text-gray-900 uppercase tracking-wider">
                  Selesaikan Pembayaran QRIS
                </h2>
                <p className="text-[11px] text-gray-500">
                  Didukung seluruh E-Wallet & Mobile Banking Indonesia
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Real-Time
            </span>
          </div>

          <PaymentCountdown
            expiredAt={order.paymentDetails?.expiredAt}
            createdAt={order.createdAt}
          />

          {order.paymentDetails?.isMock && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl max-w-sm mx-auto text-center shadow-2xs">
              <p className="text-[11px] text-amber-900 font-bold uppercase tracking-wider mb-1">
                Mode Simulasi / Testing Sandbox
              </p>
              <p className="text-[11px] text-amber-700 mb-3">
                Tekan tombol di bawah untuk simulasi pembayaran lunas instan.
              </p>
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all uppercase tracking-wider shadow-sm"
              >
                {isSimulating ? 'Memproses...' : 'Simulasikan Bayar Lunas'}
              </button>
            </div>
          )}

          <p className="text-xs text-gray-600 mb-3 leading-relaxed max-w-md mx-auto">
            Buka aplikasi pembayaran favorit Anda (GoPay, OVO, Dana, ShopeePay, BCA, Mandiri, BRI, dll) lalu scan kode di bawah:
          </p>

          {/* Sleek Viewfinder QR Container */}
          <div className="my-6 p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gradient-to-b from-gray-50 to-white max-w-[280px] mx-auto relative shadow-inner">
            {/* Viewfinder Corners */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-gray-900 rounded-tl"></div>
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-gray-900 rounded-tr"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-gray-900 rounded-bl"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-gray-900 rounded-br"></div>

            <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-center">
              {order.paymentDetails?.qrUrl ? (
                <img
                  src={order.paymentDetails.qrUrl}
                  alt="QRIS Code"
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-50 text-gray-400 text-xs">
                  Gagal memuat QRIS Code
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              <span>QRIS Standard Nasional</span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-gray-50 p-4 rounded-xl mb-5 max-w-md mx-auto border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block">
                  Total Tagihan
                </span>
                <span className="text-xl md:text-2xl font-mono font-black text-gray-900">
                  {formatCurrency(
                    order.paymentDetails?.grossAmount || Number(order.totalAmount) + shippingFee
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onCopy(
                    String(
                      order.paymentDetails?.grossAmount || Number(order.totalAmount) + shippingFee
                    ),
                    'copy-qris-amount'
                  )
                }
                id="copy-qris-amount"
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  copiedId === 'copy-qris-amount'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-gray-800 border-gray-300 hover:border-gray-900 shadow-2xs'
                }`}
              >
                <Icon name={copiedId === 'copy-qris-amount' ? 'Check' : 'Copy'} size={12} />
                <span>{copiedId === 'copy-qris-amount' ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-left max-w-md mx-auto">
            <p className="text-[11px] text-emerald-800 leading-relaxed flex items-start gap-2">
              <Icon name="CheckCircle" size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Verifikasi Real-Time:</strong> Setelah Anda memasukkan PIN e-wallet, status pesanan otomatis berubah lunas tanpa perlu konfirmasi manual.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Midtrans Payment Pending - Retry Button */}
      {isMidtransPending && (
        <div className="bg-white border border-gray-100 p-8 mb-8 rounded-2xl text-center shadow-lg shadow-gray-200/50">
          <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Icon name="Wallet" size={24} />
          </div>
          <h2 className="text-base font-heading font-bold text-gray-900 uppercase tracking-wider mb-2">
            Menunggu Pembayaran Online
          </h2>
          <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
            Pembayaran online Anda belum diselesaikan. Selesaikan transaksi menggunakan QRIS, Virtual Account, atau Kartu Kredit.
          </p>

          <button
            type="button"
            onClick={handlePayNow}
            className="bg-gray-900 hover:bg-black text-white font-bold text-xs py-3 px-8 rounded-xl transition-all uppercase tracking-wider shadow-md hover:shadow-lg inline-flex items-center gap-2"
          >
            <Icon name="CreditCard" size={15} />
            <span>Bayar Sekarang</span>
          </button>
        </div>
      )}
    </>
  )
}
