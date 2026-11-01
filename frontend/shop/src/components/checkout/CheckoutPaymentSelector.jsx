
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
      <div className="flex items-center justify-between mb-4">
        <label className="block text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider">
          Metode Pembayaran
        </label>
        <span className="text-[11px] text-gray-400 font-normal">Instan & Terverifikasi Otomatis</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Bank Transfer (Virtual Account) */}
        <label
          className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
            paymentMethod === 'transfer'
              ? 'border-primary-700 bg-white ring-1 ring-primary-700 shadow-xs'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <input
              type="radio"
              name="paymentMethod"
              value="transfer"
              checked={paymentMethod === 'transfer'}
              onChange={onChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 cursor-pointer"
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
              ? 'border-primary-700 bg-white ring-1 ring-primary-700 shadow-xs'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <input
              type="radio"
              name="paymentMethod"
              value="qris"
              checked={paymentMethod === 'qris'}
              onChange={onChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 cursor-pointer"
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
        <div className="mt-4 p-4 border border-primary-100 bg-primary-50/10 rounded-lg transition-all duration-300">
          <p className="text-xs font-heading font-semibold text-gray-900 mb-3 uppercase tracking-wider">
            Pilih Bank Virtual Account
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {bankOptions.map(bank => {
              const isBankSelected = selectedBank === bank.id
              return (
                <label
                  key={bank.id}
                  className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                    isBankSelected
                      ? 'border-primary-700 bg-white ring-1 ring-primary-700 font-semibold shadow-xs text-gray-900'
                      : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="selectedBank"
                    value={bank.id}
                    checked={isBankSelected}
                    onChange={onChange}
                    className="sr-only"
                    disabled={disabled}
                  />
                  <span className="text-xs font-heading uppercase tracking-widest font-bold">
                    {bank.name}
                  </span>
                  <span className="text-[9px] text-gray-400 font-normal mt-1 uppercase text-center leading-none">
                    {bank.desc}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
