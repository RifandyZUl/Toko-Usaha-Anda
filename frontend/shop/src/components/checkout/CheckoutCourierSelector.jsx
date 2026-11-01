import { formatCurrency } from '../../utils/format'

/**
 * Courier Selection Component for Checkout Page
 */
export default function CheckoutCourierSelector({
  courierOptions = [],
  selectedCourier = 'JNE',
  onSelectCourier,
  error,
}) {
  return (
    <div className="pt-6 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-xs font-heading font-semibold text-gray-900 uppercase tracking-wider">
          Pilih Kurir Pengiriman
        </label>
        <span className="text-[11px] text-gray-400 font-normal">Tarif otomatis dihitung per wilayah</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {courierOptions.map(courier => {
          const isSelected = selectedCourier === courier.id
          return (
            <div
              key={courier.id}
              onClick={() => {
                if (courier.available) {
                  onSelectCourier(courier.id, courier.fee)
                }
              }}
              className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 ${
                !courier.available
                  ? 'border-gray-100 bg-gray-50/60 opacity-40 cursor-not-allowed'
                  : isSelected
                    ? 'border-gray-900 bg-gray-900 text-white shadow-md cursor-pointer ring-2 ring-gray-900/10'
                    : 'border-gray-200 hover:border-gray-900/40 bg-white hover:shadow-xs cursor-pointer'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`text-xs font-heading font-bold tracking-tight ${
                      isSelected ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {courier.name}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <p
                  className={`text-[10px] font-body mb-3 leading-tight ${
                    isSelected ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  {courier.desc}
                </p>
              </div>
              {courier.available ? (
                <p
                  className={`text-sm font-heading font-bold tracking-tight ${
                    isSelected ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {formatCurrency(courier.fee)}
                </p>
              ) : (
                <p className="text-[9px] font-heading font-semibold text-rose-500 uppercase tracking-wider">
                  Tidak Tersedia
                </p>
              )}
            </div>
          )
        })}
      </div>
      {error && <p className="mt-2 text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  )
}
