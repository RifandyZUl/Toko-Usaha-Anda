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
              className={`flex flex-col justify-between p-4 rounded-lg border transition-all duration-200 ${
                !courier.available
                  ? 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed'
                  : isSelected
                    ? 'border-primary-700 bg-white ring-1 ring-primary-700 shadow-xs cursor-pointer'
                    : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer'
              }`}
            >
              <div>
                <span className="text-xs font-heading font-semibold text-gray-900 block mb-1">
                  {courier.name}
                </span>
                <p className="text-[11px] font-body text-gray-500 mb-3">
                  {courier.desc}
                </p>
              </div>
              {courier.available ? (
                <p className="text-sm font-heading font-bold text-gray-900">
                  {formatCurrency(courier.fee)}
                </p>
              ) : (
                <p className="text-[10px] font-heading font-semibold text-red-500 uppercase tracking-wider">
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
