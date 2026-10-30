
/**
 * Payment Method Selection Component (Transfer VA & QRIS)
 */
export default function CheckoutPaymentSelector({
  paymentMethod = 'transfer',
  selectedBank = 'bca',
  onChange,
  disabled = false,
}) {
  const bankOptions = [
    { id: 'bca', name: 'BCA', desc: 'BCA VA' },
    { id: 'mandiri', name: 'MANDIRI', desc: 'Mandiri Bill' },
    { id: 'bri', name: 'BRI', desc: 'BRI VA' },
    { id: 'bni', name: 'BNI', desc: 'BNI VA' },
    { id: 'permata', name: 'PERMATA', desc: 'Permata VA' },
  ]

  return (
    <div>
      <label className="block text-xs font-heading font-semibold text-gray-900 mb-4 uppercase tracking-wider">
        Metode Pembayaran
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bank Transfer (Virtual Account) */}
        <label
          className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
            paymentMethod === 'transfer'
              ? 'border-primary-500 bg-primary-50/20 ring-1 ring-primary-500 shadow-sm'
              : 'border-gray-200 hover:border-gray-400 bg-white'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <input
              type="radio"
              name="paymentMethod"
              value="transfer"
              checked={paymentMethod === 'transfer'}
              onChange={onChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              disabled={disabled}
            />
            <span className="text-sm font-heading font-semibold text-gray-900">
              Transfer Bank (VA)
            </span>
          </div>
          <p className="text-[11px] font-body text-gray-500 pl-7 leading-relaxed">
            Verifikasi otomatis. Dapatkan Virtual Account unik dari BCA, Mandiri, BNI, BRI, dll.
          </p>
        </label>

        {/* QRIS */}
        <label
          className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
            paymentMethod === 'qris'
              ? 'border-primary-500 bg-primary-50/20 ring-1 ring-primary-500 shadow-sm'
              : 'border-gray-200 hover:border-gray-400 bg-white'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <input
              type="radio"
              name="paymentMethod"
              value="qris"
              checked={paymentMethod === 'qris'}
              onChange={onChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              disabled={disabled}
            />
            <span className="text-sm font-heading font-semibold text-gray-900">
              QRIS (E-Wallet)
            </span>
          </div>
          <p className="text-[11px] font-body text-gray-500 pl-7 leading-relaxed">
            Bayar instan dengan scan kode QRIS menggunakan GoPay, OVO, Dana, ShopeePay, dll.
          </p>
        </label>
      </div>

      {/* Sub-panel for Bank Transfer Selection */}
      {paymentMethod === 'transfer' && (
        <div className="mt-4 p-5 border border-primary-100 bg-primary-50/10 rounded-lg transition-all duration-300">
          <p className="text-xs font-heading font-semibold text-gray-900 mb-3 uppercase tracking-wider">
            Pilih Bank Virtual Account
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {bankOptions.map(bank => (
              <label
                key={bank.id}
                className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedBank === bank.id
                    ? 'border-primary-500 bg-primary-50/20 ring-1 ring-primary-500 font-semibold shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="selectedBank"
                  value={bank.id}
                  checked={selectedBank === bank.id}
                  onChange={onChange}
                  className="sr-only"
                  disabled={disabled}
                />
                <span className="text-sm font-heading uppercase tracking-widest text-gray-900 font-bold">
                  {bank.name}
                </span>
                <span className="text-[8px] text-gray-400 font-normal mt-1 uppercase text-center leading-none">
                  {bank.desc}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
