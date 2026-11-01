
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
          className={`group flex flex-col p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
            paymentMethod === 'transfer'
              ? 'border-gray-900 bg-gray-900 text-white shadow-md ring-2 ring-gray-900/10'
              : 'border-gray-200 hover:border-gray-900/40 bg-white hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="paymentMethod"
                value="transfer"
                checked={paymentMethod === 'transfer'}
                onChange={onChange}
                className="w-4 h-4 accent-white focus:ring-0 cursor-pointer"
                disabled={disabled}
              />
              <span
                className={`text-sm font-heading font-bold tracking-tight ${
                  paymentMethod === 'transfer' ? 'text-white' : 'text-gray-900'
                }`}
              >
                Transfer Bank (VA)
              </span>
            </div>
            {paymentMethod === 'transfer' && (
              <span className="text-[10px] font-mono uppercase bg-white/15 px-2 py-0.5 rounded text-gray-200">
                Otomatis
              </span>
            )}
          </div>
          <p
            className={`text-[11px] font-body pl-7 leading-relaxed ${
              paymentMethod === 'transfer' ? 'text-gray-300' : 'text-gray-500'
            }`}
          >
            Verifikasi otomatis tanpa perlu upload bukti. Dapatkan Virtual Account unik dari BCA, Mandiri, BNI, BRI, dll.
          </p>
        </label>

        {/* QRIS */}
        <label
          className={`group flex flex-col p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
            paymentMethod === 'qris'
              ? 'border-gray-900 bg-gray-900 text-white shadow-md ring-2 ring-gray-900/10'
              : 'border-gray-200 hover:border-gray-900/40 bg-white hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="paymentMethod"
                value="qris"
                checked={paymentMethod === 'qris'}
                onChange={onChange}
                className="w-4 h-4 accent-white focus:ring-0 cursor-pointer"
                disabled={disabled}
              />
              <span
                className={`text-sm font-heading font-bold tracking-tight ${
                  paymentMethod === 'qris' ? 'text-white' : 'text-gray-900'
                }`}
              >
                QRIS (E-Wallet)
              </span>
            </div>
            {paymentMethod === 'qris' && (
              <span className="text-[10px] font-mono uppercase bg-white/15 px-2 py-0.5 rounded text-gray-200">
                Real-Time
              </span>
            )}
          </div>
          <p
            className={`text-[11px] font-body pl-7 leading-relaxed ${
              paymentMethod === 'qris' ? 'text-gray-300' : 'text-gray-500'
            }`}
          >
            Bayar instan dengan scan kode QRIS menggunakan GoPay, OVO, Dana, ShopeePay, LinkAja, atau Mobile Banking.
          </p>
        </label>
      </div>

      {/* Sub-panel for Bank Transfer Selection */}
      {paymentMethod === 'transfer' && (
        <div className="mt-4 p-5 border border-gray-200 bg-gray-50/70 rounded-xl transition-all duration-300">
          <p className="text-xs font-heading font-semibold text-gray-900 mb-3 uppercase tracking-wider">
            Pilih Bank Virtual Account
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {bankOptions.map(bank => {
              const isBankSelected = selectedBank === bank.id
              return (
                <label
                  key={bank.id}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    isBankSelected
                      ? 'border-gray-900 bg-white shadow-sm ring-1 ring-gray-900 text-gray-900'
                      : 'border-gray-200 bg-white hover:border-gray-400 text-gray-600'
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
