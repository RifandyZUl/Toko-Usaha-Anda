import Icon from '@shared/components/Icon.jsx'
import { formatCurrency } from '../../utils/format'
import { handleCopyFeedback } from '../../utils/clipboard'
import PaymentCountdown from './PaymentCountdown'
import PaymentInstructions from './PaymentInstructions'

/**
 * OrderDetailPaymentCard - Displays payment details, Virtual Account numbers, QRIS, and simulation
 */
export default function OrderDetailPaymentCard({
  order,
  selectedBank,
  shippingFee = 0,
  isSimulating,
  onSimulatePayment,
  onPayNow,
}) {
  const isPaid = order.paymentStatus === 'PAID'
  const isPending = order.paymentStatus === 'PENDING'
  const isTransfer = order?.paymentMethod?.startsWith('TRANSFER') && isPending
  const isQris = order?.paymentMethod === 'QRIS' && isPending
  const isMidtransPending = order?.paymentMethod === 'MIDTRANS' && isPending

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <h2 className="text-sm font-heading font-semibold text-gray-900 uppercase tracking-wider">
          Informasi Pembayaran
        </h2>
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
            isPaid
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-orange-50 text-orange-700 border border-orange-200'
          }`}
        >
          {isPaid ? 'Lunas' : 'Belum Lunas'}
        </span>
      </div>

      <div className="space-y-4 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-medium">Metode Pembayaran:</span>
          <span className="font-semibold text-gray-900">
            {order.paymentMethod === 'QRIS'
              ? 'QRIS (E-Wallet)'
              : order.paymentMethod === 'MIDTRANS'
                ? 'Pembayaran Online'
                : order.paymentMethod?.startsWith('TRANSFER_')
                  ? `Virtual Account (${order.paymentMethod.split('_')[1]})`
                  : 'Transfer Bank'}
          </span>
        </div>

        {/* Transfer VA Details */}
        {isTransfer && (
          <div className="pt-2 border-t border-gray-100">
            <PaymentCountdown
              expiredAt={order.paymentDetails?.expiredAt}
              createdAt={order.createdAt}
            />

            {order.paymentDetails ? (
              <div className="p-4 bg-primary-50/10 border border-primary-100 rounded-lg space-y-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Bank Tujuan:</span>
                  <span className="font-bold text-gray-900 uppercase">
                    {order.paymentDetails.bank?.toUpperCase()} Virtual Account
                  </span>
                </div>

                {order.paymentDetails.billKey ? (
                  <>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Kode Perusahaan</span>
                        <span className="font-mono font-bold text-gray-900 text-sm">
                          {order.paymentDetails.billerCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        id="copy-biller"
                        onClick={() =>
                          handleCopyFeedback(order.paymentDetails.billerCode, 'copy-biller')
                        }
                        className="text-[10px] text-primary-600 font-semibold px-2 py-1 bg-white border border-primary-200 rounded hover:bg-primary-50 transition-colors"
                      >
                        Salin
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Kode Bayar (Bill Key)</span>
                        <span className="font-mono font-bold text-gray-900 text-base">
                          {order.paymentDetails.billKey}
                        </span>
                      </div>
                      <button
                        type="button"
                        id="copy-billkey"
                        onClick={() =>
                          handleCopyFeedback(order.paymentDetails.billKey, 'copy-billkey')
                        }
                        className="text-[10px] text-primary-600 font-semibold px-2 py-1 bg-white border border-primary-200 rounded hover:bg-primary-50 transition-colors"
                      >
                        Salin
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Nomor Virtual Account</span>
                      <span className="font-mono font-bold text-gray-900 text-base">
                        {order.paymentDetails.vaNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      id="copy-va"
                      onClick={() =>
                        handleCopyFeedback(order.paymentDetails.vaNumber, 'copy-va')
                      }
                      className="text-[10px] text-primary-600 font-semibold px-2 py-1 bg-white border border-primary-200 rounded hover:bg-primary-50 transition-colors"
                    >
                      Salin
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Jumlah Pembayaran</span>
                    <span className="font-bold text-primary-600 text-sm">
                      {formatCurrency(
                        order.paymentDetails.grossAmount || Number(order.totalAmount) + shippingFee
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    id="copy-amount"
                    onClick={() =>
                      handleCopyFeedback(
                        String(
                          order.paymentDetails.grossAmount ||
                            Number(order.totalAmount) + shippingFee
                        ),
                        'copy-amount'
                      )
                    }
                    className="text-[10px] text-primary-600 font-semibold px-2 py-1 bg-white border border-primary-200 rounded hover:bg-primary-50 transition-colors"
                  >
                    Salin Jumlah
                  </button>
                </div>

                <PaymentInstructions bank={selectedBank} />
              </div>
            ) : (
              <p className="text-gray-500 mt-2">
                Silakan lakukan pembayaran ke Virtual Account Anda sesuai nominal tagihan.
              </p>
            )}
          </div>
        )}

        {/* QRIS Details */}
        {isQris && (
          <div className="pt-2 border-t border-gray-100 text-center">
            <PaymentCountdown
              expiredAt={order.paymentDetails?.expiredAt}
              createdAt={order.createdAt}
            />

            {order.paymentDetails?.qrUrl ? (
              <div className="my-4 p-3 bg-white border border-gray-200 rounded-xl max-w-[200px] mx-auto shadow-inner">
                <img
                  src={order.paymentDetails.qrUrl}
                  alt="QRIS Code"
                  className="w-full h-auto object-contain"
                />
              </div>
            ) : (
              <div className="my-4 p-6 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-xs">
                QRIS Code siap diproses melalui aplikasi e-wallet Anda.
              </div>
            )}

            <div className="flex justify-between items-center p-3 bg-primary-50/20 border border-primary-100 rounded-lg">
              <span className="font-medium text-gray-700">Total Tagihan:</span>
              <span className="font-bold text-primary-700 text-sm font-mono">
                {formatCurrency(
                  order.paymentDetails?.grossAmount || Number(order.totalAmount) + shippingFee
                )}
              </span>
            </div>
          </div>
        )}

        {/* Midtrans Online Pending */}
        {isMidtransPending && (
          <div className="pt-2 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 mb-3">
              Menunggu penyelesaian pembayaran online via Midtrans Snap.
            </p>
            <button
              type="button"
              onClick={onPayNow}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors uppercase tracking-wider inline-flex items-center gap-1.5"
            >
              <Icon name="Wallet" size={14} />
              Bayar Sekarang
            </button>
          </div>
        )}

        {/* Offline Simulation (Dev Mode) */}
        {isPending && order.paymentDetails?.isMock && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center mt-3 animate-pulse">
            <p className="text-[10px] text-yellow-800 font-bold uppercase tracking-wider mb-1">
              ⚠️ MODE TESTING SIMULASI
            </p>
            <button
              type="button"
              onClick={onSimulatePayment}
              disabled={isSimulating}
              className="mt-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-[10px] font-bold rounded uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {isSimulating ? 'Memproses...' : 'Simulasikan Pembayaran Lunas'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
