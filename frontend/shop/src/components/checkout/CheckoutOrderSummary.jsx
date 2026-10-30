import { formatCurrency } from '../../utils/format'

/**
 * Sticky Order Summary Component for Checkout Page
 */
export default function CheckoutOrderSummary({ items = [], totalPrice = 0, shippingFee = 0 }) {
  const finalTotal = totalPrice + Number(shippingFee || 0)

  return (
    <div className="bg-white p-8 sticky top-20 border border-gray-200/60 rounded-lg shadow-xs">
      <h2 className="text-xl font-heading font-medium text-gray-900 mb-6">Ringkasan Pesanan</h2>

      <div className="space-y-4 mb-8 pb-8 border-b border-gray-200">
        {items.map(item => {
          const itemKey = item.cartKey || (item.variantId ? `${item.id}-${item.variantId}` : item.id)
          return (
            <div key={itemKey} className="flex justify-between items-start text-sm py-1">
              <div className="flex flex-col pr-2">
                <span className="text-gray-800 font-medium leading-snug">
                  {item.name} <span className="text-gray-500 font-normal">x{item.quantity}</span>
                </span>
                {item.variantName && (
                  <span className="text-[11px] text-primary-700 font-semibold mt-0.5">
                    Varian: {item.variantName}
                  </span>
                )}
              </div>
              <span className="font-semibold text-gray-900 shrink-0">
                {formatCurrency(Number(item.price) * item.quantity)}
              </span>
            </div>
          )
        })}

        <div className="pt-4 space-y-3">
          <div className="flex justify-between text-sm font-body text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium text-gray-900">{formatCurrency(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm font-body text-gray-600">
            <span>Ongkos Kirim</span>
            <span className="font-medium text-gray-900">{formatCurrency(shippingFee)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-base font-heading font-semibold text-gray-900">Total Pembayaran</span>
        <span className="text-lg font-heading font-bold text-gray-900">
          {formatCurrency(finalTotal)}
        </span>
      </div>
    </div>
  )
}
