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
    <div className="pt-4 border-t border-gray-100">
      <label className="block text-xs font-heading font-semibold text-gray-900 mb-4 uppercase tracking-wider">
        Pilih Kurir Pengiriman
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              className={`flex flex-col justify-between p-4 border rounded-lg transition-all duration-200 ${
                !courier.available
                  ? 'border-gray-100 bg-gray-50/50 opacity-40 cursor-not-allowed'
                  : isSelected
                    ? 'border-primary-500 bg-primary-50/20 ring-1 ring-primary-500 shadow-sm cursor-pointer'
                    : 'border-gray-200 hover:border-gray-400 bg-white cursor-pointer'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-heading font-semibold text-gray-900">
                    {courier.name}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-body mb-3">
                  {courier.desc}
                </p>
              </div>
              {courier.available ? (
                <p className="text-sm font-heading font-bold text-primary-600">
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
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
