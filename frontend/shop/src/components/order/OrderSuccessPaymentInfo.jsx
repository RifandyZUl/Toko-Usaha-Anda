import Icon from '@shared/components/Icon.jsx'
import { formatCurrency } from '../../utils/format'
import PaymentCountdown from './PaymentCountdown'
import PaymentInstructions from './PaymentInstructions'

/**
 * OrderSuccessPaymentInfo - Handles Bank Transfer VA, QRIS, and Online payment retry instructions
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
        <div className="bg-white border border-gray-200 p-6 mb-6 rounded-lg animate-fadeIn shadow-xs">
          <h2 className="text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
            Selesaikan Pembayaran
          </h2>

          <PaymentCountdown
            expiredAt={order.paymentDetails?.expiredAt}
            createdAt={order.createdAt}
          />

          <p className="text-xs text-gray-600 mb-4 leading-relaxed">
            Silakan lakukan transfer sebesar{' '}
            <strong className="text-primary-600 font-bold">
              {formatCurrency(
                order.paymentDetails?.grossAmount || Number(order.totalAmount) + shippingFee
              )}
            </strong>{' '}
            (termasuk ongkir) ke rekening/Virtual Account di bawah ini:
          </p>

          <div className="space-y-4">
            {order.paymentDetails ? (
              <div className="p-4 border border-primary-100 bg-primary-50/5 rounded-lg">
                {order.paymentDetails.isMock && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center animate-pulse">
                    <p className="text-[10px] text-yellow-800 font-semibold uppercase tracking-wider mb-2">
                      ⚠️ MODE TESTING OFFLINE / SIMULASI
                    </p>
                    <p className="text-[10px] text-gray-500 mb-3">
                      Channel pembayaran belum diaktifkan di Midtrans. Anda dapat menguji alur pembayaran
                      secara penuh menggunakan tombol simulasi di bawah ini.
                    </p>
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={isSimulating}
                      className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-semibold text-[10px] py-1.5 px-4 rounded transition-colors uppercase tracking-wider shadow-xs"
                    >
                      {isSimulating ? 'Memproses...' : 'Simulasikan Bayar Lunas'}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                  <span className="text-xs text-gray-500 font-medium">Bank Tujuan:</span>
                  <span className="text-xs font-heading font-bold text-gray-900 uppercase tracking-wider">
                    {order.paymentDetails.bank?.toUpperCase()} Virtual Account
                  </span>
                </div>

                {order.paymentDetails.billKey ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        Kode Perusahaan (Biller Code)
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-base font-mono text-gray-900 font-bold tracking-wider">
                          {order.paymentDetails.billerCode}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.paymentDetails.billerCode, 'copy-biller')}
                          id="copy-biller"
                          className="text-[10px] text-primary-600 hover:text-primary-700 font-semibold px-2.5 py-1 border border-primary-200 hover:border-primary-300 rounded bg-white transition-colors"
                        >
                          Salin
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        Kode Bayar (Bill Key)
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-lg font-mono text-gray-900 font-bold tracking-wider">
                          {order.paymentDetails.billKey}
                        </p>
                        <button
                          type="button"
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
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                      Nomor Virtual Account
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-lg font-mono text-gray-900 font-bold tracking-wider">
                        {order.paymentDetails.vaNumber}
                      </p>
                      <button
                        type="button"
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
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider font-body">
                      Jumlah Pembayaran
                    </p>
                    <p className="text-sm font-heading font-semibold text-primary-600 mt-0.5">
                      {formatCurrency(order.paymentDetails.grossAmount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(String(order.paymentDetails.grossAmount), 'copy-amount')
                    }
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
              <>
                {(!selectedBank || selectedBank === 'bca') && (
                  <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-300 transition-colors bg-white">
                    <div>
                      <p className="text-xs font-heading font-semibold text-gray-900">BCA</p>
                      <p className="text-sm font-mono text-gray-700 font-bold mt-1">8123-456-789</p>
                      <p className="text-[10px] text-gray-400">a.n. Toko Usaha Anda</p>
                    </div>
                    <button
                      type="button"
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
                      <p className="text-sm font-mono text-gray-700 font-bold mt-1">
                        123-00-1234567-8
                      </p>
                      <p className="text-[10px] text-gray-400">a.n. Toko Usaha Anda</p>
                    </div>
                    <button
                      type="button"
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
                      <p className="text-sm font-mono text-gray-700 font-bold mt-1">
                        0123-01-234567-89-0
                      </p>
                      <p className="text-[10px] text-gray-400">a.n. Toko Usaha Anda</p>
                    </div>
                    <button
                      type="button"
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
                    💡 <strong>Penting:</strong> Setelah mentransfer, hubungi Admin via WhatsApp atau
                    perbarui ulasan pembayaran dengan mengirimkan bukti transaksi agar status pesanan
                    berubah menjadi <strong>Dikemas</strong>.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* QRIS Instructions */}
      {isQris && (
        <div className="bg-white border border-gray-200 p-6 mb-6 rounded-lg text-center animate-fadeIn shadow-xs">
          <h2 className="text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
            Selesaikan Pembayaran QRIS
          </h2>

          <PaymentCountdown
            expiredAt={order.paymentDetails?.expiredAt}
            createdAt={order.createdAt}
          />

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
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-semibold text-[10px] py-1.5 px-4 rounded transition-colors uppercase tracking-wider shadow-xs"
              >
                {isSimulating ? 'Memproses...' : 'Simulasikan Bayar Lunas'}
              </button>
            </div>
          )}

          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
            Scan kode QRIS di bawah menggunakan GoPay, OVO, Dana, LinkAja, ShopeePay atau Mobile
            Banking:
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
                {formatCurrency(
                  order.paymentDetails?.grossAmount || Number(order.totalAmount) + shippingFee
                )}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    String(
                      order.paymentDetails?.grossAmount || Number(order.totalAmount) + shippingFee
                    ),
                    'copy-qris-amount'
                  )
                }
                id="copy-qris-amount"
                className="text-[9px] text-primary-600 font-semibold px-2 py-0.5 border border-primary-200 rounded bg-white hover:bg-primary-50 transition-colors"
              >
                Salin
              </button>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-left">
            <p className="text-[10px] text-yellow-800 leading-relaxed">
              💡 <strong>Verifikasi Otomatis:</strong> Setelah scan dan memasukkan PIN e-wallet Anda,
              transaksi Anda terkonfirmasi otomatis oleh sistem. Status di halaman ini akan terupdate
              secara real-time.
            </p>
          </div>
        </div>
      )}

      {/* Midtrans Payment Pending - Retry Button */}
      {isMidtransPending && (
        <div className="bg-white border border-gray-200 p-6 mb-6 rounded-lg text-center shadow-xs">
          <h2 className="text-sm font-heading font-semibold text-gray-900 uppercase tracking-wider mb-2">
            Menunggu Pembayaran Online
          </h2>
          <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">
            Pembayaran online Anda belum diselesaikan. Selesaikan pembayaran menggunakan QRIS, Virtual
            Account, dll.
          </p>

          <button
            type="button"
            onClick={handlePayNow}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs py-2.5 px-6 rounded-full transition-colors uppercase tracking-wider shadow-md hover:shadow-lg inline-flex items-center gap-2"
          >
            <Icon name="Wallet" size={14} />
            Bayar Sekarang
          </button>
        </div>
      )}
    </>
  )
}
